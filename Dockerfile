# syntax=docker/dockerfile:1.7

#####################################################################
# Stage 1 — build
#####################################################################
# Debian (glibc) instead of Alpine (musl) — far better prebuilt-binary
# coverage for native deps (@parcel/watcher, sharp, libvips, etc.).
FROM node:20-bookworm-slim AS builder
WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

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
RUN npm ci --no-audit --no-fund --include=optional

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

# tini → proper PID 1 + signal forwarding
# libvips42 → runtime shared lib for sharp
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini libvips42 ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd -r app && useradd -r -g app -d /app -s /usr/sbin/nologin app

ENV NODE_ENV=production
ENV PORT=8080

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
# lifecycle scripts so optional native prebuilds get fetched.
RUN npm ci --omit=dev --no-audit --no-fund --include=optional \
 && npm cache clean --force \
 && chown -R app:app /app

USER app
EXPOSE 8080

# tini reaps zombie processes + forwards SIGTERM cleanly.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "./packages/evershop/dist/bin/start/index.js"]
