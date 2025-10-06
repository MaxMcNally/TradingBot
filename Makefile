# TradingBot Makefile
# Provides easy commands for development, testing, and deployment

.PHONY: help install build test lint clean dev docker-dev docker-prod deploy-staging deploy-prod

# Default target
help: ## Show this help message
	@echo "TradingBot - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Installation and Setup
install: ## Install all dependencies
	@echo "Installing root dependencies..."
	yarn install
	@echo "Installing API dependencies..."
	cd api && npm install
	@echo "Installing client dependencies..."
	cd client && yarn install

install-dev: ## Install development dependencies
	@echo "Installing development dependencies..."
	yarn install
	cd api && npm install
	cd client && yarn install

# Building
build: ## Build all TypeScript code
	@echo "Building core TypeScript..."
	yarn build
	@echo "Building API TypeScript..."
	yarn build:api
	@echo "Building client..."
	cd client && yarn build

build-core: ## Build core TypeScript only
	yarn build

build-api: ## Build API TypeScript only
	yarn build:api

build-client: ## Build client only
	cd client && yarn build

# Testing
test: ## Run all tests
	@echo "Running comprehensive test suite..."
	node scripts/run-tests.js

test-backend: ## Run backend tests only
	yarn test:ci

test-api: ## Run API tests only
	yarn test:api

test-client: ## Run client tests only
	yarn test:client

test-watch: ## Run tests in watch mode
	yarn test:watch

test-coverage: ## Run tests with coverage
	yarn test:coverage

# Linting
lint: ## Run linting on all code
	@echo "Running backend linting..."
	yarn lint
	@echo "Running API linting..."
	yarn lint:api
	@echo "Running client linting..."
	yarn lint:client

lint-fix: ## Fix linting issues automatically
	yarn lint:fix

# Database
db-init: ## Initialize all databases
	@echo "Initializing databases..."
	node scripts/init-database.js

db-reset: ## Reset all databases
	@echo "Resetting databases..."
	yarn db:reset

db-migrate: ## Run database migrations
	@echo "Running database migrations..."
	# Add migration commands here when available

# Development
dev: ## Start development servers
	@echo "Starting development servers..."
	yarn dev

dev-server: ## Start API development server only
	yarn dev:server

dev-client: ## Start client development server only
	yarn dev:client

# Docker Development
docker-dev: ## Start development environment with Docker
	@echo "Starting development Docker environment..."
	yarn docker:dev

docker-dev-down: ## Stop development Docker environment
	@echo "Stopping development Docker environment..."
	yarn docker:dev:down

docker-dev-logs: ## View development Docker logs
	docker-compose -f docker-compose.dev.yml logs -f

# Docker Production
docker-build: ## Build production Docker images
	@echo "Building production Docker images..."
	yarn docker:build

docker-up: ## Start production Docker environment
	@echo "Starting production Docker environment..."
	yarn docker:up

docker-down: ## Stop production Docker environment
	@echo "Stopping production Docker environment..."
	yarn docker:down

docker-logs: ## View production Docker logs
	yarn docker:logs

docker-restart: ## Restart production Docker environment
	@echo "Restarting production Docker environment..."
	yarn docker:down && yarn docker:up

# Deployment
deploy-dev: ## Deploy to development environment
	@echo "Deploying to development environment..."
	node scripts/deploy.js development

deploy-staging: ## Deploy to staging environment
	@echo "Deploying to staging environment..."
	node scripts/deploy.js staging

deploy-prod: ## Deploy to production environment
	@echo "Deploying to production environment..."
	node scripts/deploy.js production

# CI/CD
ci-test: ## Run CI test suite
	@echo "Running CI test suite..."
	yarn ci:test

ci-build: ## Run CI build process
	@echo "Running CI build process..."
	yarn ci:build

ci-deploy: ## Run full CI deployment
	@echo "Running full CI deployment..."
	yarn ci:deploy

# Bot Management
bot-start: ## Start the trading bot
	yarn bot:start

bot-status: ## Check bot status
	yarn bot:status

bot-config: ## Show bot configuration
	yarn bot:config

bot-cli: ## Open bot CLI
	yarn bot:cli

# Cache Management
cache-stats: ## Show cache statistics
	yarn cache:stats

cache-cleanup: ## Clean up cache
	yarn cache:cleanup

cache-demo: ## Run cache demo
	yarn cache:demo

# Backtesting
backtest: ## Run backtest
	yarn backtest

# Cleanup
clean: ## Clean build artifacts and dependencies
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf api/dist/
	rm -rf client/dist/
	rm -rf coverage/
	rm -rf client/coverage/
	rm -rf node_modules/
	rm -rf api/node_modules/
	rm -rf client/node_modules/

clean-docker: ## Clean Docker images and containers
	@echo "Cleaning Docker artifacts..."
	docker-compose down --volumes --remove-orphans
	docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
	docker system prune -f

# Health Checks
health: ## Check service health
	@echo "Checking service health..."
	@echo "API Health:"
	@curl -f http://localhost:8001/ping 2>/dev/null && echo "✅ API is healthy" || echo "❌ API is not responding"
	@echo "Client Health:"
	@curl -f http://localhost:3000 2>/dev/null && echo "✅ Client is healthy" || echo "❌ Client is not responding"

# Setup (for new developers)
setup: install db-init ## Complete setup for new developers
	@echo "Setup complete! Run 'make dev' to start development."

# Quick start
start: docker-dev ## Quick start with Docker development environment
	@echo "Starting TradingBot in development mode..."

# Production start
start-prod: docker-up ## Start production environment
	@echo "Starting TradingBot in production mode..."

# Full reset (use with caution)
reset: clean clean-docker install db-init ## Full reset of the project
	@echo "Full reset complete!"

# Show project status
status: ## Show project status
	@echo "TradingBot Project Status:"
	@echo "=========================="
	@echo "Node.js version: $$(node --version)"
	@echo "Yarn version: $$(yarn --version)"
	@echo "Docker version: $$(docker --version)"
	@echo "Docker Compose version: $$(docker-compose --version)"
	@echo ""
	@echo "Service Status:"
	@make health
