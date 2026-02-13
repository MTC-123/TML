# ── Stage 1: Install dependencies ──────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy workspace root manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
COPY packages/crypto/package.json packages/crypto/
COPY packages/database/package.json packages/database/

RUN npm ci --ignore-scripts

# ── Stage 2: Build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build shared packages first, then the API
RUN npm run build --workspace=packages/types && \
    npm run build --workspace=packages/crypto && \
    npm run build --workspace=packages/database && \
    npm run build --workspace=apps/api

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 tml && \
    adduser --system --uid 1001 tml

# Copy only production artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/crypto/dist ./packages/crypto/dist
COPY --from=builder /app/packages/crypto/package.json ./packages/crypto/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER tml

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
