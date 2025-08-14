# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/workers/package.json ./apps/workers/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/workers ./apps/workers

# Build the application
WORKDIR /app/apps/workers
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=worker:nodejs /app/apps/workers/dist ./dist
COPY --from=builder --chown=worker:nodejs /app/apps/workers/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/apps/workers/package.json ./

# Switch to non-root user
USER worker

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]