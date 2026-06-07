# ── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
# Install dependencies needed for the Prisma engine to run during generation
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 3: runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
# Install dependencies needed for Prisma to run migrations and connect at runtime
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --frozen-lockfile --omit=dev

COPY --from=builder /app/dist ./dist

# Regenerate Prisma Client in the final environment
RUN npx prisma generate

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]