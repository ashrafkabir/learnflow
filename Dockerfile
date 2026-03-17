# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json turbo.json ./
COPY packages/ packages/
COPY apps/ apps/
RUN npm ci --legacy-peer-deps
RUN npx turbo run build

# Stage 2: Production
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
