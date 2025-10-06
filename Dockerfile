# Multi-stage build for API service
FROM node:20-alpine AS base

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++ sqlite

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json yarn.lock ./
COPY api/package*.json ./api/

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
COPY --from=base /app/api/node_modules ./api/node_modules
COPY --from=base /app/api ./api
COPY --from=base /app/src ./src
COPY --from=base /app/package.json ./

# Create directories for databases
RUN mkdir -p /app/db /app/api/db

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8001/ping', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the API server
CMD ["node", "dist/api/server.js"]
