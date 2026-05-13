# syntax=docker/dockerfile:1.7

#####################################################################
# Stage 1 — build
#####################################################################
FROM node:20-alpine AS builder
WORKDIR /app

# OS packages required by native modules during the build:
#   python3/make/g++ → node-gyp for bcrypt/sharp
#   git → some npm git dependencies
RUN apk add --no-cache python3 make g++ git

# Install deps first so cache survives source edits.
COPY package.json package-lock.json ./
COPY packages/evershop/package.json ./packages/evershop/
COPY packages/postgres-query-builder/package.json ./packages/postgres-query-builder/
RUN npm ci --no-audit --no-fund --ignore-scripts \
 && npm rebuild

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
FROM node:20-alpine AS runtime
WORKDIR /app

# Minimal OS packages for runtime (libc++/libstdc++ are pulled in by
# transitive deps; sharp uses libvips which is bundled in the npm pkg).
RUN apk add --no-cache tini && \
    addgroup -S app && adduser -S app -G app

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
# packages/*/dist so we don't need the dev toolchain anymore.
RUN npm ci --omit=dev --no-audit --no-fund --ignore-scripts \
 && npm rebuild \
 && npm cache clean --force \
 && chown -R app:app /app

USER app
EXPOSE 8080

# tini reaps zombie processes — helpful when SIGTERM hits Cloud Run.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "./packages/evershop/dist/bin/start/index.js"]
