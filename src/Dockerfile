# Multi-stage build for core trading logic
FROM node:20-alpine AS base

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++ sqlite

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache sqlite

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/src ./src
COPY --from=base /app/package.json ./

# Create directories for databases and data
RUN mkdir -p /app/db /app/backtest_data /app/cache

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S tradingbot -u 1001

# Change ownership of the app directory
RUN chown -R tradingbot:nodejs /app
USER tradingbot

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Core trading logic is running')" || exit 1

# Default command (can be overridden in docker-compose)
CMD ["node", "dist/bot.js"]
