FROM docker.io/oven/bun:slim AS bun-deps

WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY site/package.json ./site/
COPY packages/database/package.json ./packages/database/
COPY packages/scheduler/package.json ./packages/scheduler/
COPY packages/utilities/package.json ./packages/utilities/
COPY packages/whatsapp-bot/package.json ./packages/whatsapp-bot/
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile

COPY . .

FROM bun-deps AS builder
RUN bun run build

# ─────

# Site
FROM docker.io/oven/bun:slim AS site
WORKDIR /app
ENV MONOREPO_ROOT="/app"
COPY --from=builder /app/site/dist ./
RUN mkdir -p /data
EXPOSE 4321
CMD ["bun", "server/entry.mjs"]

# WhatsApp Bot
FROM docker.io/oven/bun:slim AS whatsapp-bot
WORKDIR /app
ENV MONOREPO_ROOT="/app"
COPY --from=builder /app/packages/whatsapp-bot/dist ./
RUN mkdir -p /data
CMD ["bun", "index.js"]

# Scheduler
FROM docker.io/oven/bun:slim AS scheduler
WORKDIR /app
ENV MONOREPO_ROOT="/app"
COPY --from=builder /app/packages/scheduler/dist ./
RUN mkdir -p /data
CMD ["bun", "index.js"]
