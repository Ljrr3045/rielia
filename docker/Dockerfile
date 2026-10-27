FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS node-base
# Prisma's migration engine requires OpenSSL on the Debian slim image.
RUN apt-get update && apt-get install --no-install-recommends -y openssl=3.0.22-1~deb12u2 libssl3=3.0.22-1~deb12u2 ca-certificates=20250419~deb12u2 && rm -rf /var/lib/apt/lists/*

FROM node-base AS dependencies
WORKDIR /build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@12.15.0
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @rielia/contracts build

FROM dependencies AS api-build
RUN pnpm --filter @rielia/api build
# deploy materializes workspace contracts and the frozen production closure.
RUN pnpm --filter @rielia/api deploy --prod --frozen-lockfile /runtime
RUN rm -rf /runtime/src /runtime/node_modules/.cache

FROM api-build AS migration-build
# The one-shot exposes Prisma CLI; production deploy still retains optional peer
# closures from the frozen lock, so this target is a lifecycle/tooling separation.
RUN pnpm --filter @rielia/api deploy --frozen-lockfile /migration
RUN rm -rf /migration/src /migration/node_modules/.cache

FROM node-base AS api
ENV NODE_ENV=production
WORKDIR /app
COPY --from=api-build --chown=node:node /runtime/ ./
USER node
CMD ["node", "dist/main.js"]

FROM node-base AS migrate
ENV NODE_ENV=production
WORKDIR /app
COPY --from=migration-build --chown=node:node /migration/ ./
USER node
CMD ["node", "dist/migrate.js"]

FROM dependencies AS web-build
RUN mkdir -p apps/web/public && pnpm --filter @rielia/web build

FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
COPY --from=web-build --chown=node:node /build/apps/web/.next/standalone/ ./
COPY --from=web-build --chown=node:node /build/apps/web/.next/static/ ./apps/web/.next/static/
COPY --from=web-build --chown=node:node /build/apps/web/public/ ./apps/web/public/
USER node
CMD ["node", "apps/web/server.js"]
