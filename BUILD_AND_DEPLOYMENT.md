# TradingBot - Build and Deployment Guide

This guide covers the complete build and deployment pipeline for the TradingBot project, including local development, testing, and production deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Building](#building)
- [Docker Deployment](#docker-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Management](#environment-management)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up the build and deployment pipeline, ensure you have the following installed:

- **Node.js** (v20 or higher)
- **Yarn** (latest version)
- **Docker** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)
- **Git** (latest version)

### Verification

Run the following command to verify your setup:

```bash
make status
```

## Quick Start

### For New Developers

```bash
# Clone the repository
git clone <repository-url>
cd TradingBot

# Complete setup
make setup

# Start development environment
make dev
```

### For Existing Developers

```bash
# Start development environment
make docker-dev

# Or start individual services
make dev
```

## Development Setup

### Local Development (Without Docker)

```bash
# Install dependencies
make install

# Initialize databases
make db-init

# Start development servers
make dev
```

### Docker Development

```bash
# Start development environment with Docker
make docker-dev

# View logs
make docker-dev-logs

# Stop development environment
make docker-dev-down
```

### Available Development Commands

```bash
# Start individual services
make dev-server    # API server only
make dev-client    # Client only

# Database management
make db-init       # Initialize databases
make db-reset      # Reset databases
make db-migrate    # Run migrations

# Cache management
make cache-stats   # Show cache statistics
make cache-cleanup # Clean cache
make cache-demo    # Run cache demo
```

## Testing

### Run All Tests

```bash
# Run comprehensive test suite
make test

# Run tests with coverage
make test-coverage

# Run tests in watch mode
make test-watch
```

### Run Specific Test Suites

```bash
# Backend tests only
make test-backend

# API tests only
make test-api

# Client tests only
make test-client
```

### Test Scripts

The project includes comprehensive test scripts:

```bash
# Run tests with detailed reporting
node scripts/run-tests.js

# Run tests with specific options
node scripts/run-tests.js --parallel --skip-lint
```

### Test Configuration

- **Backend Tests**: Jest with TypeScript support
- **API Tests**: Jest with API endpoint testing
- **Frontend Tests**: Vitest with React Testing Library
- **Coverage**: HTML and LCOV reports generated

## Building

### Build All Components

```bash
# Build everything
make build

# Build specific components
make build-core    # Core TypeScript
make build-api     # API TypeScript
make build-client  # React client
```

### Build Scripts

```bash
# CI build process
make ci-build

# Full CI deployment
make ci-deploy
```

## Docker Deployment

### Development Environment

```bash
# Start development environment
make docker-dev

# View logs
make docker-dev-logs

# Stop environment
make docker-dev-down
```

### Production Environment

```bash
# Build production images
make docker-build

# Start production environment
make docker-up

# View logs
make docker-logs

# Stop environment
make docker-down

# Restart environment
make docker-restart
```

### Docker Services

The Docker setup includes:

- **API Service**: Express.js API server
- **Client Service**: React frontend with Nginx
- **Core Service**: Trading bot logic
- **Redis Service**: Caching and session storage

## CI/CD Pipeline

### CircleCI Configuration

The project uses CircleCI for continuous integration and deployment:

- **Automatic Testing**: Runs on every commit
- **Multi-Environment**: Development, staging, production
- **Parallel Execution**: Tests run in parallel for speed
- **Docker Integration**: Builds and tests Docker images

### Pipeline Stages

1. **Install Dependencies**: Cache and install all dependencies
2. **Run Tests**: Backend, API, and frontend tests
3. **Build Images**: Create Docker images
4. **Deploy**: Deploy to appropriate environment

### Environment Deployment

```bash
# Deploy to development
make deploy-dev

# Deploy to staging
make deploy-staging

# Deploy to production
make deploy-prod
```

### Deployment Scripts

```bash
# Use deployment script directly
node scripts/deploy.js development
node scripts/deploy.js staging
node scripts/deploy.js production

# With options
node scripts/deploy.js production --skip-tests --skip-db
```

## Environment Management

### Environment Files

The project supports multiple environments:

- `.env.dev` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Environment Variables

Key environment variables:

```bash
# Application
NODE_ENV=development|staging|production
PORT=8001
FRONTEND_URL=http://localhost:3000

# Database
DB_PATH=/app/db/trading_bot.db
CACHE_DB_PATH=/app/db/cache.db

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# API Keys
POLYGON_API_KEY=your_polygon_key
TWELVE_DATA_API_KEY=your_twelve_data_key
```

### Creating Environment Files

```bash
# Create environment file for specific environment
node scripts/deploy.js development  # Creates .env.dev
node scripts/deploy.js staging      # Creates .env.staging
node scripts/deploy.js production   # Creates .env.production
```

## Database Management

### Initialization

```bash
# Initialize all databases
make db-init

# Or use the script directly
node scripts/init-database.js
```

### Database Scripts

```bash
# Reset all databases
make db-reset

# Run migrations
make db-migrate

# Database initialization with options
node scripts/init-database.js --reset --skip-cache
```

### Database Files

- `api/db/trading_bot.db` - API database
- `db/trading_bot.db` - Core trading database
- `db/cache.db` - Cache database

## Health Checks

### Service Health

```bash
# Check all services
make health

# Manual health checks
curl http://localhost:8001/ping  # API health
curl http://localhost:3000       # Client health
```

### Docker Health Checks

All Docker containers include health checks:

- **API**: HTTP endpoint check
- **Client**: HTTP endpoint check
- **Core**: Process check
- **Redis**: Redis ping

## Monitoring and Logs

### View Logs

```bash
# Development logs
make docker-dev-logs

# Production logs
make docker-logs

# Specific service logs
docker-compose logs -f api
docker-compose logs -f client
docker-compose logs -f core
```

### Log Management

```bash
# Follow logs in real-time
docker-compose logs -f

# View logs with timestamps
docker-compose logs -t

# View last N lines
docker-compose logs --tail=100
```

## Troubleshooting

### Common Issues

#### Docker Issues

```bash
# Clean Docker system
make clean-docker

# Rebuild images
make docker-build

# Check Docker status
docker system df
docker system prune
```

#### Database Issues

```bash
# Reset databases
make db-reset

# Check database files
ls -la api/db/
ls -la db/
```

#### Port Conflicts

```bash
# Check port usage
lsof -i :3000
lsof -i :8001
lsof -i :6379

# Kill processes using ports
sudo kill -9 $(lsof -t -i:3000)
```

#### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker permissions
sudo chmod 666 /var/run/docker.sock
```

### Debug Mode

```bash
# Run with debug logging
NODE_ENV=development LOG_LEVEL=debug make dev

# Docker debug mode
docker-compose -f docker-compose.dev.yml up --build
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Monitor logs for errors
make docker-logs | grep ERROR

# Check database size
du -sh api/db/ db/
```

## Advanced Usage

### Custom Builds

```bash
# Build with specific target
docker build --target base -t tradingbot:dev .

# Build with build args
docker build --build-arg NODE_ENV=production .
```

### Environment Overrides

```bash
# Override environment variables
NODE_ENV=production make docker-up

# Use custom compose file
docker-compose -f docker-compose.custom.yml up
```

### Scaling Services

```bash
# Scale specific services
docker-compose up --scale api=3

# Load balancing
docker-compose up --scale client=2
```

## Security Considerations

### Production Deployment

1. **Change Default Secrets**: Update JWT_SECRET and SESSION_SECRET
2. **API Keys**: Configure actual trading API keys
3. **SSL/TLS**: Set up HTTPS in production
4. **Firewall**: Configure appropriate firewall rules
5. **Updates**: Keep dependencies updated

### Docker Security

- All containers run as non-root users
- Minimal base images (Alpine Linux)
- Health checks for monitoring
- Proper file permissions

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review logs for error messages
3. Check GitHub issues
4. Contact the development team

## Contributing

When contributing to the build system:

1. Test changes locally
2. Update documentation
3. Ensure CI/CD pipeline passes
4. Follow security best practices
