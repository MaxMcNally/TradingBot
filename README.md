# Trading Bot Application

A comprehensive algorithmic trading platform where users create, test, and deploy automated trading bots. Built with React frontend, Node.js/Express API, and TypeScript trading core. Features include backtesting, paper trading, live trading via Alpaca integration, custom strategy builder, marketplace, and enterprise API access.

## 🎯 Core Concept: Trading Bots

A **Bot** is a Trading Session that implements a Strategy. Each bot represents:
- A specific trading strategy (custom or pre-configured)
- Configurable trading session settings (risk management, order execution, position sizing)
- Performance tracking and analytics
- A potential asset for the marketplace

### Bot Workflow
1. **Program Bot** - Create custom strategies or select pre-built ones
2. **Test Bot** - Backtest against historical data to validate performance
3. **Run Bot** - Deploy in Paper Trading (simulated) or Live Trading (real capital) modes
4. **Monitor** - Track real-time performance and optimize strategies
5. **Monetize** - List successful bots in the Marketplace (Premium+)

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
- **Node.js** 20+ (LTS recommended)
- **Yarn** package manager
- **PostgreSQL** 14+ (or SQLite for local dev)
- **Redis** (optional, for caching)
- **Docker** (optional, for containerized setup)
- **Railway CLI** (optional, for deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd TradingBot

# Install root dependencies
yarn install

# Install client dependencies
cd client && yarn install && cd ..

# Install API dependencies (if separate)
cd api && yarn install && cd ..

# Initialize database
yarn db:init

# Run migrations
yarn migrate:run
```

### Environment Setup

Create a `.env` file in the root directory:

```bash
# Application
NODE_ENV=development
PORT=8001
VITE_API_URL=http://localhost:8001/api

# Database
DATABASE_URL=postgresql://trading:trading@localhost:5432/tradingbot
# Or for SQLite (local dev):
# DATABASE_URL=sqlite:./api/db/trading_bot.db

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-key-change-in-production
SESSION_SECRET=your-session-secret-key-change-in-production

# Trading
TRADING_MODE=paper
LOG_LEVEL=info

# API Keys (optional, for enhanced features)
ALPACA_API_KEY=your-alpaca-key
ALPACA_SECRET_KEY=your-alpaca-secret
POLYGON_API_KEY=your-polygon-key
YAHOO_FINANCE_API_KEY=your-yahoo-key
```

## 🏃‍♂️ Development

### Frontend Development

```bash
# Navigate to client directory
cd client

# Start development server (Vite)
yarn dev
# Server runs on http://localhost:3000

# Build for production
yarn build

# Run frontend tests
yarn test

# Lint frontend code
yarn lint
```

**Frontend Structure:**
- `src/components/` - Reusable React components
- `src/Pages/` - Page components (Dashboard, Trading, Backtesting, Strategies)
- `src/hooks/` - Custom React hooks
- `src/api/` - API client functions
- `src/providers/` - Context providers (Theme, Auth)
- `src/utils/` - Frontend utilities

### Backend Development

```bash
# Start API server (from root)
yarn dev:server
# Server runs on http://localhost:8001

# Or start with hot reload
cd api
npx ts-node-dev server.ts

# Build TypeScript
yarn build

# Run API tests
yarn test:api

# Lint API code
yarn lint:api
```

**Backend Structure:**
- `api/controllers/` - Request handlers
- `api/routes/` - API route definitions
- `api/models/` - Database models
- `api/services/` - Business logic services
- `api/middleware/` - Authentication, validation
- `api/database/` - Database operations

### Full Stack Development

```bash
# Start both frontend and backend simultaneously
yarn dev

# Or run separately in different terminals:
# Terminal 1: API server
yarn dev:server

# Terminal 2: React client
cd client && yarn dev
```

### Production Build

```bash
# Build all components
yarn ci:build

# Build API only
yarn build:api

# Build client only
cd client && yarn build

# Start production API server
yarn start:api

# Start core trading bot
yarn start:core
```

### Docker Development

```bash
# Build and start all services
yarn docker:up

# Development mode with Docker (hot reload)
yarn docker:dev

# View logs
yarn docker:logs

# Stop services
yarn docker:down

# Rebuild containers
yarn docker:rebuild
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

## 💳 Billing & Payment Tiers

| Plan        | Monthly Price | Target Users               | Status Defaults |
|-------------|---------------|----------------------------|-----------------|
| Free        | $0            | New accounts exploring the platform | `plan_tier=FREE`, `plan_status=ACTIVE`, `subscription_provider=NONE` |
| Basic       | $9.99         | Individual traders expanding automation | `subscription_provider` required (Stripe / PayPal / Square) |
| Premium     | $29.99        | Advanced users needing unlimited strategies | Paid provider required |
| Enterprise  | $199.99       | Organizations that need dedicated support | Paid provider required |

### Frontend Experience
- **Pricing Page (`/pricing`)** – Lists every tier, highlights the current plan, and deep-links into checkout.
- **Checkout Page (`/checkout`)** – Lets signed-in users choose a plan, payment processor (Stripe, PayPal, or Square), and record payment references.
- **Settings → Subscription** – Shows the active plan, renewal/cancellation status, and recent subscription history with quick links to pricing/checkout flows.

### API Surface
- `GET /api/billing/plans` – Public endpoint used by the pricing page to render tiers and supported processors.
- `POST /api/billing/checkout` – Authenticated upgrade/downgrade flow that records provider selection and subscription metadata for the user.
- `GET /api/billing/subscription` – Authenticated endpoint returning the user’s current plan and last 10 history entries.
- `PUT /api/billing/subscription` – Authenticated endpoint for cancelling or switching back to Free.

All non-public routes now enforce the shared `authenticateToken` middleware so controllers always receive an `AuthenticatedRequest` populated with user data. This includes billing flows, cache management, test utilities, strategy CRUD, trading session management, and other sensitive APIs.

### Payment Providers
The UI currently supports three processors during checkout:
- **Stripe** – default card-based payments
- **PayPal** – redirect/authorization style payments
- **Square** – in-person or stored-card style billing

Each provider selection is persisted with the subscription record so downstream automation or customer support can reconcile payments. Future environment variables (API keys, webhook secrets, etc.) can be attached per provider when those integrations are finalized.

## 🚀 Deployment

### Railway Deployment (Recommended)

Railway provides seamless deployment with automatic builds and environment management.

#### Initial Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link project (first time)
railway link

# Add services
railway add postgresql
railway add redis
```

#### Deploy Commands

```bash
# Deploy to Railway
yarn railway:deploy

# Or use Railway CLI directly
railway up

# View deployment logs
railway logs

# Check deployment status
railway status

# Open Railway dashboard
railway open
```

#### Environment Variables

Set these in Railway dashboard or via CLI:

```bash
# Required
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>
JWT_SECRET=<your-secret>
SESSION_SECRET=<your-secret>

# Optional
NODE_ENV=production
PORT=8001
TRADING_MODE=paper
LOG_LEVEL=info

# API Keys (if using)
ALPACA_API_KEY=<your-key>
ALPACA_SECRET_KEY=<your-secret>
POLYGON_API_KEY=<your-key>
```

### CI/CD Pipeline (CircleCI)

The project includes automated CI/CD via CircleCI:

- **Pull Requests**: Run tests and validation (no database changes)
- **Main Branch**: Run migrations and deploy to Railway QA/Staging
- **Releases**: Run migrations and deploy to Railway Production

**Pipeline Steps:**
1. Install dependencies
2. Run linting
3. Run tests (API + Client)
4. Build all components
5. Run database migrations (main branch only)
6. Deploy to Railway

### Docker Deployment

```bash
# Build production image
docker build -t tradingbot:latest .

# Run container
docker run -p 8001:8001 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  tradingbot:latest

# Or use docker-compose
docker-compose up -d
```

### Manual Deployment

1. **Build the application:**
   ```bash
   yarn ci:build
   ```

2. **Set up production environment:**
   - Configure PostgreSQL database
   - Set up Redis (optional)
   - Configure environment variables

3. **Run migrations:**
   ```bash
   yarn migrate:run
   ```

4. **Start services:**
   ```bash
   # API server
   yarn start:api

   # Or use PM2 for process management
   pm2 start dist/api/server.js --name tradingbot-api
   ```

## 🎨 User Experience & Capabilities

### Strategy Types

**Basic Strategies** - Pre-configured, ready-to-use strategies:
- Moving Average Crossovers
- Momentum Indicators (RSI, MACD)
- Mean Reversion
- Bollinger Bands
- Breakout Strategies
- Sentiment Analysis

**Custom Strategies** - User-created using the Custom Strategy Builder:
- Chainable indicator system
- Custom buy/sell conditions
- Complex trading logic
- Proprietary algorithms

### Trading Modes

1. **Backtesting** - Test bots against historical market data
   - Available to all tiers
   - Analyze performance before risking capital
   - Optimize strategy parameters

2. **Paper Trading** - Simulated trading with virtual capital
   - Real-time market data simulation
   - Risk-free strategy validation
   - Available to Free, Basic, and Premium users

3. **Live Trading** - Real capital deployment via Alpaca
   - Actual market execution
   - Real profits and losses
   - Available to Basic, Premium, and Enterprise users

### Trading Session Settings

Comprehensive session configuration including:
- **Risk Management**: Stop loss, take profit, position limits, daily loss limits
- **Order Execution**: Time in force, order types, extended hours, partial fills
- **Position Management**: Max positions, sizing methods (fixed, percentage, Kelly, equal weight), rebalancing
- **Trading Window**: Custom trading hours and days
- **Advanced**: Trailing stops, bracket orders, slippage models, commission rates

### Marketplace

- **Free Public Bots** - Open source, cloneable, editable by community
- **Paid Bots** - Proprietary strategies for purchase (Premium+)
- **Sell Your Bots** - Monetize successful strategies (Premium+)

### User Tiers

| Feature | Free | Basic ($9.99/mo) | Premium ($29.99/mo) | Enterprise ($199.99/mo) |
|---------|------|------------------|---------------------|------------------------|
| Basic Bots | 1 | Unlimited | Unlimited | Unlimited |
| Custom Bots | ❌ | ❌ | ✅ | ✅ |
| Backtesting | ✅ | ✅ | ✅ | ✅ |
| Paper Trading | ✅ | ✅ | ✅ | ✅ |
| Live Trading | ❌ | ✅ | ✅ | ✅ |
| Marketplace (Buy Paid) | ❌ | ❌ | ✅ | ✅ |
| Marketplace (Sell) | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |
| Webhooks | ❌ | ❌ | ❌ | ✅ |

## 🏗️ Architecture

### Core Components
- **API Server** (`/api`) - Express.js REST API with TypeScript
- **React Client** (`/client`) - Material-UI frontend with Vite
- **Trading Core** (`/src`) - Trading strategies, bot logic, and data providers
- **Database** - PostgreSQL (production) / SQLite (local dev)
- **Cache** - Redis for performance optimization

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Material-UI (MUI) components
- React Router for navigation
- TanStack Query (React Query) for data fetching
- Vite for build tooling

**Backend:**
- Node.js with Express.js
- TypeScript throughout
- JWT authentication
- PostgreSQL with migration system
- Redis caching

**Trading:**
- Custom strategy executor with chainable indicators
- Multiple data providers (Yahoo Finance, Polygon)
- Alpaca integration for live trading
- Backtesting engine with historical data

## 📁 Project Structure

```
TradingBot/
├── api/                           # Express.js API server
│   ├── controllers/               # API route handlers
│   ├── models/                    # Database models
│   ├── routes/                    # API routes
│   ├── services/                  # Business logic services
│   ├── database/                  # Database operations
│   ├── middleware/                # Authentication & validation
│   ├── types/                     # TypeScript type definitions
│   └── docs/                      # API documentation
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── shared/            # Shared components
│   │   │   └── TradingSessionSettingsForm/  # Settings form
│   │   ├── Pages/                 # Page components
│   │   │   ├── Dashboard/         # Dashboard page
│   │   │   ├── Trading/           # Run Bot page
│   │   │   ├── Backtesting/       # Test Bot page
│   │   │   ├── Strategies/        # Program Bot page
│   │   │   └── Settings/          # Settings page
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── providers/             # Context providers (Theme, Auth)
│   │   ├── api/                   # API client functions
│   │   └── utils/                 # Frontend utilities
│   └── docs/                      # Frontend documentation
├── src/                           # Core trading logic
│   ├── strategies/                # Trading strategies
│   ├── dataProviders/             # Market data sources
│   ├── cache/                     # Caching system
│   ├── bot/                       # Trading bot core
│   ├── utils/                     # Utilities (indicators, etc.)
│   └── docs/                      # Core documentation
├── scripts/                       # Scripts and migrations
│   ├── migrations/               # Database migrations
│   └── migration-system.ts       # Migration framework
├── .circleci/                     # CI/CD configuration
└── docker-compose.yml            # Docker orchestration
```

## ✨ Key Features

### Current Capabilities

✅ **Strategy Management**
- Pre-built strategies (mean reversion, momentum, moving averages, etc.)
- Custom strategy builder with chainable indicators
- Strategy parameter configuration
- Strategy marketplace (Premium+)

✅ **Backtesting**
- Historical data backtesting
- Multiple strategy support
- Performance metrics calculation
- Multi-symbol backtesting

✅ **Trading Sessions**
- Paper trading (simulated)
- Live trading via Alpaca integration
- Session settings configuration
- Real-time performance tracking

✅ **Risk Management**
- Stop loss and take profit
- Position size limits
- Daily loss limits
- Trading window restrictions

✅ **User Management**
- JWT-based authentication
- User tiers and subscriptions
- Billing integration (Stripe, PayPal, Square)
- Role-based access control

✅ **Data & Caching**
- Multiple data providers (Yahoo Finance, Polygon)
- Redis caching for performance
- Historical data management
- Real-time market data

### Coming Soon

🚧 **Backtest Enhancements** (See [BACKTEST_ROADMAP.md](BACKTEST_ROADMAP.md))
- Custom strategy backtesting
- Trading session settings in backtests
- Realistic order execution simulation
- Session settings templates

🚧 **Marketplace**
- Bot sharing and monetization
- Public and paid bot listings
- Bot cloning and editing

🚧 **Enterprise Features**
- Programmatic API access
- Webhook integrations
- Advanced analytics

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

## 🛠️ Development Guide

### Adding New Strategies

1. **Create strategy file** in `/src/strategies/`
   ```typescript
   import { AbstractStrategy, Signal } from './baseStrategy';
   
   export class MyStrategy extends AbstractStrategy {
     // Implement required methods
   }
   ```

2. **Extend `AbstractStrategy` class**
3. **Implement required methods**: `addPrice()`, `getSignal()`, etc.
4. **Add to strategy registry** in `/src/strategies/index.ts`
5. **Test with backtesting** using the backtest API
6. **Add to API** in `/api/controllers/backtestController.ts`

### API Development

1. **Add routes** in `/api/routes/`
   ```typescript
   router.get('/my-endpoint', authenticateToken, myController);
   ```

2. **Create controllers** in `/api/controllers/`
3. **Add models** in `/api/models/` (if needed)
4. **Add database operations** in `/api/database/` (if needed)
5. **Update tests** in `/api/__tests__/`
6. **Add authentication** using `authenticateToken` middleware

### Frontend Development

1. **Add components** in `/client/src/components/`
   - Use Material-UI components
   - Follow TypeScript best practices
   - Add proper error handling

2. **Create hooks** in `/client/src/hooks/`
   - Use TanStack Query for data fetching
   - Follow React best practices

3. **Update API calls** in `/client/src/api/`
   - Use the centralized API client
   - Add proper TypeScript types

4. **Add tests** in `/client/src/__tests__/`
   - Use Vitest for testing
   - Test components and hooks

### Database Migrations

```bash
# Create new migration
yarn migrate:create 1.0.4 migration-name

# Run migrations
yarn migrate:run

# Check migration status
yarn migrate:status

# Rollback migration
yarn migrate:rollback 1.0.3

# Validate schema
yarn migrate:validate:schema
```

### Custom Strategy Builder

The Custom Strategy Builder uses a chainable indicator system:

1. **Indicators**: SMA, EMA, RSI, MACD, Bollinger Bands, VWAP
2. **Conditions**: above, below, crossesAbove, crossesBelow, etc.
3. **Logic Operators**: AND, OR, NOT
4. **Buy/Sell Conditions**: Define entry and exit logic

See `src/utils/indicators/` for implementation details.

## 📚 Documentation

### Core Documentation
- [UX Paradigm & User Experience](UX_PARADIGM.md) - Complete overview of user tiers, bot concepts, and platform features
- [Backtest Enhancement Roadmap](BACKTEST_ROADMAP.md) - Roadmap for backtesting improvements
- [Trading Session Settings Spec](TRADING_SESSION_SETTINGS_SPEC.md) - Complete settings specification
- [Frontend Trading Session Settings](FRONTEND_TRADING_SESSION_SETTINGS.md) - Frontend implementation guide

### API Documentation
- [API Documentation](api/docs/API.md) - API endpoints and usage
- [Migration Guide](api/docs/MIGRATION.md) - Database migration instructions

### Frontend Documentation
- [Client Setup](client/docs/CLIENT_SETUP.md) - React/Vite setup guide
- [Design System](client/docs/DESIGN_SYSTEM.md) - UI design system and theming
- [Testing Guide](client/docs/TESTING_GUIDE.md) - Frontend testing guide
- [TradingSessionSettingsForm](client/docs/TradingSessionSettingsForm.md) - Component documentation

### Development Guides
- [Migration Guide](MIGRATION_GUIDE.md) - Database migration system
- [Migration Summary](MIGRATION_SUMMARY.md) - Migration history

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