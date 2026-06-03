# ============================================================
# Multi-stage build for the API
# ============================================================

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Cài deps cho monorepo workspace (only api dependencies + prisma)
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=apps/api --include-workspace-root --omit=dev=false

# ---------- Stage 2: builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json package-lock.json* ./
COPY apps/api ./apps/api

WORKDIR /app/apps/api

# Generate prisma client + build TS
RUN npx prisma generate
RUN npx tsc

# ---------- Stage 3: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Cài chỉ runtime deps cho production
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --workspace=apps/api --include-workspace-root --omit=dev

# Copy build artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 mtf
USER mtf

EXPOSE 4000

# Healthcheck cho ALB target group
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
