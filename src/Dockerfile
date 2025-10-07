# Multi-stage build for core trading logic
FROM node:20-alpine AS base

# Install dependencies needed for native modules and Postgres client
RUN apk add --no-cache python3 make g++ postgresql-client curl

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache postgresql-client curl

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tradingbot -u 1001

# Copy built application and dependencies
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/src ./src
COPY --from=base /app/package.json ./

# Create directories for databases and data with proper permissions
RUN mkdir -p /app/db /app/backtest_data /app/cache && \
    chown -R tradingbot:nodejs /app

# Switch to non-root user
USER tradingbot

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "console.log('Core service is running')" || exit 1

# Default command (can be overridden in docker-compose)
CMD ["node", "dist/bot.js"]
