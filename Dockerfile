# syntax=docker/dockerfile:1.7

#####################################################################
# Stage 1 — build
#####################################################################
# Debian (glibc) instead of Alpine (musl) — far better prebuilt-binary
# coverage for native deps (@parcel/watcher, sharp, libvips, etc.).
FROM node:20-bookworm-slim AS builder
WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
# Husky's `prepare` hook installs git hooks; useless inside a container.
ENV HUSKY=0

# Tools needed by node-gyp + sharp's libvips:
#   python3, make, g++  → fallback compilation for native modules
#   git                 → npm packages that resolve via git URLs
#   ca-certificates     → TLS to npm + Google APIs
#   libvips-dev         → sharp builds against this
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      python3 make g++ git ca-certificates libvips-dev \
 && rm -rf /var/lib/apt/lists/*

# Install deps first so cache survives source edits. We allow lifecycle
# scripts to run so optional prebuild downloaders (@parcel/watcher,
# sharp, bcrypt, etc.) can fetch the right binary for the platform.
COPY package.json package-lock.json ./
COPY packages/evershop/package.json ./packages/evershop/
COPY packages/postgres-query-builder/package.json ./packages/postgres-query-builder/
RUN npm pkg delete scripts.prepare \
 && npm install --no-audit --no-fund --no-save --include=optional

# Copy the rest of the workspace and build.
COPY packages ./packages
COPY translations ./translations
COPY public ./public
COPY config ./config

# Two-step compile: 1) swc transpiles TS/JSX -> dist/  2) webpack
# bundles the storefront + admin client. The repo gitignores dist/,
# so we always compile from source inside the image.
RUN npm run compile \
 && npm run compile:db \
 && npm run build

#####################################################################
# Stage 2 — runtime
#####################################################################
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV HUSKY=0

# tini → proper PID 1 + signal forwarding
# libvips42 → runtime shared lib for sharp
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini libvips42 ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd -r app && useradd -r -g app -d /app -s /usr/sbin/nologin app

ENV NODE_ENV=production
ENV PORT=8080
# EverShop's cms/bootstrap calls config.util.setModuleDefaults('system',
# {file_storage:'local'}) which conflicts with the GCS object form set
# in config/production.json. node-config freezes the tree on first
# access unless this is true at process start — initEnvStart.js sets
# it later but by then 'config' has already been evaluated by the ESM
# dependency graph. Force it here so it's live before any import.
ENV ALLOW_CONFIG_MUTATIONS=true

# Copy only the artifacts we need to run the server.
COPY --chown=app:app --from=builder /app/package.json /app/package-lock.json ./
COPY --chown=app:app --from=builder /app/packages ./packages
COPY --chown=app:app --from=builder /app/translations ./translations
COPY --chown=app:app --from=builder /app/public ./public
COPY --chown=app:app --from=builder /app/config ./config
# .evershop/ is the webpack build output (client + server bundles)
COPY --chown=app:app --from=builder /app/.evershop ./.evershop

# Production-only install — the build outputs already live under
# packages/*/dist so we don't need the dev toolchain anymore. Allow
# lifecycle scripts so optional native prebuilds get fetched, but drop
# the husky prepare hook (it tries to install git hooks even when
# husky itself is a devDependency excluded by --omit=dev).
RUN npm pkg delete scripts.prepare \
 && npm install --omit=dev --no-audit --no-fund --no-save --include=optional \
 && npm install --no-save --no-audit --no-fund \
      @parcel/watcher-linux-x64-glibc \
 && npm cache clean --force

# ┌─────────────────────────────────────────────────────────────────┐
# │ Image diet — remove packages we never need at runtime           │
# │   - build tools (swc, ts, webpack, babel, tailwind, sass, etc.) │
# │   - wrong-platform native prebuilds                             │
# │ Saves ~140 MB without touching anything the server actually     │
# │ loads during SSR or API handling.                               │
# └─────────────────────────────────────────────────────────────────┘
RUN cd /app/node_modules && rm -rf \
      @swc typescript webpack webpack-cli webpack-merge \
      webpack-dev-middleware webpack-hot-middleware \
      sass sass-loader @tailwindcss @babel @types \
      css-loader style-loader postcss-loader \
      mini-css-extract-plugin terser-webpack-plugin html-webpack-plugin \
      copyfiles rimraf eslint prettier jest \
      lightningcss-linux-x64-musl \
      @parcel/watcher-darwin-x64 @parcel/watcher-darwin-arm64 \
      @parcel/watcher-win32-x64 @parcel/watcher-win32-arm64 \
      @parcel/watcher-win32-ia32 @parcel/watcher-linux-x64-musl \
      @parcel/watcher-linux-arm64-glibc @parcel/watcher-linux-arm64-musl \
      @parcel/watcher-linux-arm-glibc @parcel/watcher-linux-arm-musl \
      @parcel/watcher-android-arm64 @parcel/watcher-freebsd-x64 \
 && chown -R app:app /app

USER app
EXPOSE 8080

# tini reaps zombie processes + forwards SIGTERM cleanly.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "./packages/evershop/dist/bin/start/index.js"]
