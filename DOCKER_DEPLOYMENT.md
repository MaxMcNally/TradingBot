# Trading Bot Docker Deployment Guide

This guide explains how to deploy the Trading Bot application using Docker containers.

## Architecture

The application consists of three main services:

1. **API Service** (`api`) - Node.js/Express backend API
2. **Client Service** (`client`) - React frontend served by Nginx
3. **Core Service** (`core`) - Trading logic and bot functionality
4. **Redis Service** (`redis`) - Caching and session storage

## Quick Start

### Production Deployment

1. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8001
   - API Health Check: http://localhost:8001/ping

### Development Deployment

1. **Start development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173
   - API: http://localhost:8001

## Manual Deployment

### Production

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Production Environment Configuration
NODE_ENV=production
PORT=8001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_PATH=/app/db/trading_bot.db
CACHE_DB_PATH=/app/db/cache.db

# Trading API Keys (REQUIRED)
POLYGON_API_KEY=your_polygon_api_key
TWELVE_DATA_API_KEY=your_twelve_data_api_key

# Security (CHANGE IN PRODUCTION!)
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here

# Redis Configuration
REDIS_URL=redis://redis:6379

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
```

### Service Configuration

#### API Service
- **Port:** 8001
- **Health Check:** `/ping` endpoint
- **Dependencies:** Core service, Redis
- **Volumes:** Database persistence

#### Client Service
- **Port:** 3000 (production) / 5173 (development)
- **Build:** React app with Nginx
- **Dependencies:** API service
- **Features:** Client-side routing, static asset caching

#### Core Service
- **Purpose:** Trading logic and bot functionality
- **Dependencies:** Redis
- **Volumes:** Database, backtest data, cache

#### Redis Service
- **Port:** 6379
- **Purpose:** Caching and session storage
- **Persistence:** Data volume

## Data Persistence

The following data is persisted using Docker volumes:

- `api_data` - API database files
- `core_data` - Core trading database
- `backtest_data` - Backtest results
- `cache_data` - Cache files
- `redis_data` - Redis data

## Monitoring and Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f client
docker-compose logs -f core
docker-compose logs -f redis
```

### Health Checks
- API: `curl http://localhost:8001/ping`
- Client: `curl http://localhost:3000`
- Redis: `docker-compose exec redis redis-cli ping`

### Service Status
```bash
docker-compose ps
```

## Scaling

### Horizontal Scaling
```bash
# Scale API service
docker-compose up -d --scale api=3

# Scale with load balancer (requires additional configuration)
```

### Resource Limits
Add resource limits to services in `docker-compose.yml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Security Considerations

### Production Security
1. **Change default secrets** in `.env` file
2. **Use HTTPS** with proper SSL certificates
3. **Configure firewall** to restrict access
4. **Regular updates** of base images
5. **Network isolation** using Docker networks

### Environment Variables
- Never commit `.env` files to version control
- Use Docker secrets for sensitive data in production
- Rotate API keys and secrets regularly

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :8001
   ```

2. **Build failures:**
   ```bash
   # Clean build
   docker-compose build --no-cache
   ```

3. **Service not starting:**
   ```bash
   # Check logs
   docker-compose logs service_name
   
   # Check service status
   docker-compose ps
   ```

4. **Database issues:**
   ```bash
   # Reset volumes (WARNING: This will delete data)
   docker-compose down -v
   docker-compose up -d
   ```

### Performance Optimization

1. **Multi-stage builds** for smaller images
2. **Layer caching** for faster builds
3. **Resource limits** to prevent resource exhaustion
4. **Health checks** for better monitoring

## Cloud Deployment

### AWS ECS
1. Push images to ECR
2. Create ECS task definitions
3. Configure load balancer
4. Set up auto-scaling

### Google Cloud Run
1. Build and push to GCR
2. Deploy services to Cloud Run
3. Configure traffic routing

### Azure Container Instances
1. Push to Azure Container Registry
2. Deploy using Azure CLI or portal
3. Configure networking

## Backup and Recovery

### Database Backup
```bash
# Backup API database
docker-compose exec api sqlite3 /app/api/db/app.db ".backup /app/api/db/backup.db"

# Backup core database
docker-compose exec core sqlite3 /app/db/trading_bot.db ".backup /app/db/backup.db"
```

### Volume Backup
```bash
# Create backup
docker run --rm -v tradingbot_api_data:/data -v $(pwd):/backup alpine tar czf /backup/api_data_backup.tar.gz -C /data .

# Restore backup
docker run --rm -v tradingbot_api_data:/data -v $(pwd):/backup alpine tar xzf /backup/api_data_backup.tar.gz -C /data
```

## Maintenance

### Updates
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Cleanup
```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```
