# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/web/ ./apps/web/
COPY packages/shared/ ./packages/shared/
COPY tsconfig.json ./

# Build shared package first
RUN pnpm --filter @what-if/shared build

# Build the web application
RUN pnpm --filter @what-if/web build

# Production stage
FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN adduser -D -s /bin/sh www-data

# Change ownership
RUN chown -R www-data:www-data /usr/share/nginx/html
RUN chown -R www-data:www-data /var/cache/nginx
RUN chown -R www-data:www-data /var/log/nginx
RUN chown -R www-data:www-data /etc/nginx/conf.d

# Switch to non-root user
USER www-data

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]