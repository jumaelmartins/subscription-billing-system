# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---- build: install workspace, compile api (+ its deps), prune to prod ----
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @sbs/api... build
RUN pnpm --filter @sbs/api deploy --legacy --prod /prod/api

# ---- runtime: minimal image with only prod deps + built dist ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /prod/api ./
USER node
EXPOSE 3333
CMD ["node", "dist/server.js"]
