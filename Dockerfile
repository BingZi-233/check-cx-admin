#
# Multi-stage build for Next.js (pnpm)
#
FROM node:20-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN apk add --no-cache libc6-compat

# ---- deps (dev deps included, for build) ----
FROM base AS deps

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM base AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ---- prod deps ----
FROM base AS prod-deps

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---- runtime ----
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN corepack enable && corepack prepare pnpm@9 --activate

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000

CMD ["pnpm", "start"]
