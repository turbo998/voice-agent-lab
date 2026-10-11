FROM node:24.13.1-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.server.json vite.config.ts ./
COPY apps ./apps
COPY packages ./packages
COPY integrations ./integrations
COPY scripts/stage-runtime.mjs ./scripts/stage-runtime.mjs
COPY experiments/gpt-live ./experiments/gpt-live
RUN npm run build \
    && node node_modules/esbuild/bin/esbuild integrations/private/controller-job.ts --bundle --platform=node --format=cjs --outfile=controller.cjs \
    && npm prune --omit=dev --no-audit --no-fund

FROM node:24.13.1-alpine AS controller
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/controller.cjs ./controller.cjs
USER node
CMD ["node", "controller.cjs"]

FROM node:24.13.1-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "dist/server/apps/retell-demo/server/index.js"]
