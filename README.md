# Trading Bot Application

A comprehensive trading bot application with React frontend, Node.js API, and automated trading strategies. Features backtesting, real-time trading, caching, and deployment automation.

**End-to-End CI/CD Pipeline Test** - This application includes automated deployment to Railway with CircleCI integration.

**Database Migration System** - Comprehensive migration system with automatic QA/production database synchronization.

## 🗄️ Database Migration System

This project includes a comprehensive database migration system that automatically keeps QA and production databases in sync with schema changes.

### Features
- ✅ **Version tracking** for all database changes
- ✅ **Automatic migrations** in CI/CD pipeline  
- ✅ **Rollback capabilities** for failed migrations
- ✅ **Multi-database support** (PostgreSQL/SQLite)
- ✅ **Schema validation** and integrity checks

### Migration Commands
```bash
yarn migrate:status           # Check migration status
yarn migrate:run              # Run pending migrations
yarn migrate:create 1.0.3 name # Create new migration
yarn migrate:rollback 1.0.1   # Rollback to version
yarn migrate:validate:schema  # Validate database health
```

### CI/CD Integration
- **PRs**: Run tests and validation (no database changes)
- **Main branch**: Run migrations and deploy to QA
- **Releases**: Run migrations and deploy to production

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Yarn package manager
- Docker (optional)
- Railway CLI (for deployment)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd TradingBot

# Install dependencies
yarn install
cd client && yarn install && cd ..

# Initialize database
yarn db:init
```

## 🏃‍♂️ Run

### Development Mode
```bash
# Start API server (port 8001)
yarn dev:server

# Start React client (port 3000)
yarn dev:client

# Start both simultaneously
yarn dev
```

### Production Mode
```bash
# Build all components
yarn ci:build

# Start API server
yarn start:api

# Start core trading bot
yarn start:core
```

### Trading Bot CLI
```bash
# Start trading bot
yarn bot:start

# Check bot status
yarn bot:status

# Configure bot settings
yarn bot:config

# Initialize database
yarn bot:db:init

# Create user
yarn bot:user:create
```

### Docker
```bash
# Build and start all services
yarn docker:up

# Development mode with Docker
yarn docker:dev

# View logs
yarn docker:logs

# Stop services
yarn docker:down
```

## 🧪 Test

### Run All Tests
```bash
# Run complete test suite
yarn test:all

# Run tests with coverage
yarn test:coverage

# Watch mode for development
yarn test:watch
```

### Component-Specific Testing
```bash
# Backend tests only
yarn test:ci

# API tests only
yarn test:api

# Frontend tests only
yarn test:client
```

### Linting
```bash
# Lint all code
yarn lint

# Fix linting issues
yarn lint:fix

# Lint specific components
yarn lint:api
yarn lint:client
```

## 🚀 Deploy

### Railway Deployment (Recommended)
```bash
# Setup Railway (first time only)
yarn railway:setup

# Deploy to Railway
yarn railway:deploy

# View deployment logs
yarn railway:logs

# Check deployment status
yarn railway:status
```

### Manual Railway Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway project new

# Add Redis service
railway add redis

# Deploy
railway up
```

### CircleCI Automated Deployment
- **Feature branches** → Railway Staging
- **Main branch** → Railway Production
- Automatic testing, building, and deployment

## 🏗️ Architecture

### Core Components
- **API Server** (`/api`) - Express.js REST API
- **React Client** (`/client`) - Material-UI frontend
- **Trading Core** (`/src`) - Trading strategies and bot logic
- **Database** - PostgreSQL (SQLite legacy support for local dev)
- **Cache** - Redis for performance optimization

### Key Features
- 📊 **Backtesting** - Test strategies with historical data
- 🤖 **Live Trading** - Paper and live trading modes
- 📈 **Real-time Data** - Yahoo Finance integration
- 💾 **Caching** - Redis-based data caching
- 🔐 **Authentication** - JWT-based user management
- 📱 **Responsive UI** - Material-UI dashboard
- 🐳 **Docker Support** - Containerized deployment
- 🚀 **CI/CD** - Automated testing and deployment

## 📁 Project Structure

```
TradingBot/
├── api/                    # Express.js API server
│   ├── controllers/        # API route handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   └── middleware/        # Authentication & validation
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Frontend utilities
├── src/                   # Core trading logic
│   ├── strategies/        # Trading strategies
│   ├── dataProviders/     # Market data sources
│   ├── cache/            # Caching system
│   └── bot/              # Trading bot core
├── scripts/              # Deployment scripts
├── .circleci/            # CI/CD configuration
└── docker-compose.yml    # Docker orchestration
```

## 🔧 Configuration

### Environment Variables
```bash
# Application
NODE_ENV=development
PORT=8001

# Database
DATABASE_URL=postgresql://trading:trading@localhost:5432/tradingbot

# Redis
REDIS_URL=redis://localhost:6379

# Trading
TRADING_MODE=paper
LOG_LEVEL=info

# Security
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# API Keys
ALPHA_VANTAGE_API_KEY=your-key
YAHOO_FINANCE_API_KEY=your-key
```

### Trading Modes
- **`paper`** - Simulated trading (default)
- **`live`** - Real money trading (use with caution)

## 📊 Available Scripts

### Development
- `yarn dev` - Start development servers
- `yarn dev:server` - Start API server only
- `yarn dev:client` - Start React client only

### Building
- `yarn build` - Build TypeScript
- `yarn build:api` - Build API server
- `yarn ci:build` - Build all components

### Testing
- `yarn test` - Run Jest tests
- `yarn test:all` - Run all test suites
- `yarn test:coverage` - Run with coverage report

### Trading Bot
- `yarn bot:start` - Start trading bot
- `yarn bot:status` - Check bot status
- `yarn backtest` - Run backtesting

### Database
- `yarn db:init` - Initialize database
- `yarn db:reset` - Reset database

### Deployment
- `yarn railway:deploy` - Deploy to Railway
- `yarn docker:up` - Start with Docker
- `yarn ci:deploy` - Full CI/CD pipeline

## 🛠️ Development

### Adding New Strategies
1. Create strategy in `/src/strategies/`
2. Extend `BaseStrategy` class
3. Implement required methods
4. Add to strategy registry
5. Test with backtesting

### API Development
1. Add routes in `/api/routes/`
2. Create controllers in `/api/controllers/`
3. Add models in `/api/models/`
4. Update tests in `/api/__tests__/`

### Frontend Development
1. Add components in `/client/src/components/`
2. Create hooks in `/client/src/hooks/`
3. Update API calls in `/client/src/api/`
4. Add tests in `/client/src/__tests__/`

## 📚 Documentation

- [Railway Deployment Guide](RAILWAY_DEPLOYMENT.md)
- [CircleCI + Railway Setup](CIRCLECI_RAILWAY_SETUP.md)
- [Quick Deploy Guide](QUICK_DEPLOY.md)
- [Strategy Documentation](STRATEGY_OVERVIEW.md)
- [Testing Guide](TESTING_SUMMARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with details
4. Contact the development team

---

**Happy Trading! 📈🤖**
