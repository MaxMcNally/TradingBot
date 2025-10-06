# Multi-stage build for API service
FROM node:20-alpine AS base

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++ sqlite curl

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json yarn.lock ./
COPY api/package*.json ./api/

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Install API dependencies
RUN cd api && npm install

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build && yarn build:api

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache sqlite curl

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tradingbot -u 1001

# Copy built application and dependencies
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/api/node_modules ./api/node_modules
COPY --from=base /app/api ./api
COPY --from=base /app/src ./src
COPY --from=base /app/package.json ./

# Create directories for databases and set permissions
RUN mkdir -p /app/db /app/api/db /app/backtest_data /app/cache && \
    chown -R tradingbot:nodejs /app

# Switch to non-root user
USER tradingbot

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8001/ping || exit 1

# Start the API server
CMD ["node", "dist/api/server.js"]
