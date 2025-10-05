#!/bin/bash

# Trading Bot Deployment Script
set -e

echo "🚀 Starting Trading Bot Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=8001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_PATH=/app/db/trading_bot.db
CACHE_DB_PATH=/app/db/cache.db

# Redis Configuration
REDIS_URL=redis://redis:6379

# Security (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=1000
EOF
    echo "⚠️  Please edit .env file with your actual configuration values before deploying to production!"
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."

# Check API
if curl -f http://localhost:8001/ping > /dev/null 2>&1; then
    echo "✅ API service is running"
else
    echo "❌ API service is not responding"
fi

# Check Client
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Client service is running"
else
    echo "❌ Client service is not responding"
fi

# Check Redis
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis service is running"
else
    echo "❌ Redis service is not responding"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Service URLs:"
echo "   Client: http://localhost:3000"
echo "   API: http://localhost:8001"
echo "   API Health: http://localhost:8001/ping"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update services: docker-compose pull && docker-compose up -d"
echo ""
echo "⚠️  Remember to:"
echo "   1. Configure your trading API keys in .env"
echo "   2. Set up proper security secrets"
echo "   3. Configure your domain and SSL certificates for production"
