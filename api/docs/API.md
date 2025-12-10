# Trading Bot API

This API provides endpoints for running algorithmic trading backtests, managing trading sessions, and analyzing performance.

## Base URL
```
http://localhost:8001
```

## Authentication

All API endpoints (except public routes) require authentication via JWT tokens:

```http
Authorization: Bearer <jwt_token>
```

## Endpoints

### Health Check
```http
GET /ping
```
Returns server status.

### Backtesting

#### Backtest Health
```http
GET /api/backtest/health
```
Returns backtest service health status.

#### Available Strategies
```http
GET /api/backtest/strategies
```
Returns list of available trading strategies and their parameters.

#### Run Backtest
```http
POST /api/backtest/run
```

#### Request Body
```json
{
  "strategy": "meanReversion",
  "symbols": ["AAPL", "TSLA"],
  "startDate": "2023-01-01",
  "endDate": "2023-12-31",
  "window": 20,
  "threshold": 0.05,
  "initialCapital": 10000,
  "sharesPerTrade": 100
}
```

#### Parameters
- `strategy` (required): Strategy name ("meanReversion")
- `symbols` (required): Array of stock symbols or single symbol string
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format
- `window` (optional): Moving average window in days (default: 20)
- `threshold` (optional): Percentage threshold for signals (default: 0.05)
- `initialCapital` (optional): Starting capital (default: 10000)
- `sharesPerTrade` (optional): Max shares per trade (default: 100)

#### Response
```json
{
  "success": true,
  "data": {
    "strategy": "meanReversion",
    "symbols": ["AAPL", "TSLA"],
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "config": {
      "window": 20,
      "threshold": 0.05,
      "initialCapital": 10000,
      "sharesPerTrade": 100
    },
    "results": [
      {
        "symbol": "AAPL",
        "trades": [],
        "finalPortfolioValue": 10403.38,
        "totalReturn": 0.0403,
        "winRate": 1,
        "maxDrawdown": 0.0431,
        "totalTrades": 2
      }
    ]
  }
}
```

### Trading Sessions

#### Start Trading Session
```http
POST /api/trading/sessions/start
```
Start a new trading session.

**Request Body:**
```json
{
  "userId": 1,
  "mode": "PAPER",
  "initialCash": 10000,
  "symbols": ["AAPL", "GOOGL"],
  "strategy": "meanReversion",
  "strategyParameters": {
    "window": 20,
    "threshold": 0.05
  },
  "settings": {
    "stop_loss_percentage": 5.0,
    "take_profit_percentage": 10.0,
    "max_position_size_percentage": 25.0
  }
}
```

#### Stop Trading Session
```http
POST /api/trading/sessions/:sessionId/stop
```
Stop an active trading session.

#### Pause Trading Session
```http
POST /api/trading/sessions/:sessionId/pause
```
Pause an active trading session.

#### Resume Trading Session
```http
POST /api/trading/sessions/:sessionId/resume
```
Resume a paused trading session.

#### Get Active Trading Session
```http
GET /api/trading/users/:userId/active-session
```
Get the active trading session for a user.

#### Get Trading Sessions
```http
GET /api/trading/users/:userId/sessions
```
Get all trading sessions for a user.

#### Get Trades by Session
```http
GET /api/trading/sessions/:sessionId/trades
```
Get all trades for a specific session.

#### Get User Trading Stats
```http
GET /api/trading/users/:userId/stats
```
Get trading statistics for a user.

#### Get User Portfolio
```http
GET /api/trading/users/:userId/portfolio
```
Get current portfolio summary for a user.

#### Get User Recent Trades
```http
GET /api/trading/users/:userId/trades
```
Get recent trades for a user.

### Performance Metrics

All performance routes require authentication and are accessible to all authenticated users.

#### Get Performance Overview
```http
GET /api/performance/overview
```
Get an overview of all strategy performance metrics.

**Query Parameters:**
- `limit` (optional): Number of recent executions to return (default: 50)
- `strategyType` (optional): Filter by strategy type
- `executionType` (optional): Filter by execution type (BACKTEST or LIVE_TRADING)

#### Get Performance Analytics
```http
GET /api/performance/analytics
```
Get aggregated performance analytics.

**Query Parameters:**
- `timeframe` (optional): Time period (7d, 30d, 90d, 1y) (default: 30d)
- `strategyType` (optional): Filter by strategy type

#### Get Strategy Performance by Name
```http
GET /api/performance/strategy/:strategyName
```
Get performance data for a specific strategy by name.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 100)

#### Get Strategy Performance by ID
```http
GET /api/performance/strategy-id/:strategyId
```
Get performance data for a specific strategy by ID (for custom strategies or user strategies).

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 100)

#### Get Performance Record by ID
```http
GET /api/performance/:id
```
Get a specific performance record by its ID.

#### Delete Performance Record
```http
DELETE /api/performance/:id
```
Delete a performance record (requires authentication).

### Strategies

#### Get User Strategies
```http
GET /api/strategies/users/:userId/strategies
```
Get all strategies for a user.

#### Create Strategy
```http
POST /api/strategies/users/:userId/strategies
```
Create a new user strategy.

#### Get Strategy by ID
```http
GET /api/strategies/:strategyId
```
Get a specific strategy by ID.

#### Update Strategy
```http
PUT /api/strategies/:strategyId
```
Update a strategy.

#### Delete Strategy
```http
DELETE /api/strategies/:strategyId
```
Delete a strategy.

#### Get Public Strategies
```http
GET /api/strategies/public
```
Get all public strategies.

#### Get Public Strategies by Type
```http
GET /api/strategies/public/:strategyType
```
Get public strategies filtered by type.

### Custom Strategies

#### Create Custom Strategy
```http
POST /api/custom-strategies
```
Create a new custom strategy (requires Premium/Enterprise subscription).

#### Get User Custom Strategies
```http
GET /api/custom-strategies
```
Get all custom strategies for the authenticated user.

#### Get Custom Strategy by ID
```http
GET /api/custom-strategies/:strategyId
```
Get a specific custom strategy by ID.

#### Update Custom Strategy
```http
PUT /api/custom-strategies/:strategyId
```
Update a custom strategy.

#### Delete Custom Strategy
```http
DELETE /api/custom-strategies/:strategyId
```
Delete a custom strategy.

#### Validate Custom Strategy
```http
POST /api/custom-strategies/validate
```
Validate custom strategy conditions without saving.

#### Test Custom Strategy
```http
POST /api/custom-strategies/test
```
Test a custom strategy with sample data.

### Admin Routes

All admin routes require admin privileges.

#### Get All Users
```http
GET /api/admin/users
```
Get all users (admin only).

#### Get User Performance Data
```http
GET /api/admin/users/:userId/performance
```
Get performance data for a specific user (admin or owner only).

## Example Usage

### Run Backtest - Single Symbol
```bash
curl -X POST http://localhost:8001/api/backtest/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "strategy": "meanReversion",
    "symbols": "AAPL",
    "startDate": "2023-01-01",
    "endDate": "2023-12-31"
  }'
```

### Run Backtest - Multiple Symbols
```bash
curl -X POST http://localhost:8001/api/backtest/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "strategy": "meanReversion",
    "symbols": ["TSLA", "NVDA", "AAPL"],
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "window": 30,
    "threshold": 0.03
  }'
```

### Get Performance Overview
```bash
curl -X GET http://localhost:8001/api/performance/overview \
  -H "Authorization: Bearer <token>"
```

### Get Strategy Performance by ID
```bash
curl -X GET http://localhost:8001/api/performance/strategy-id/123 \
  -H "Authorization: Bearer <token>"
```

## Error Responses

### Invalid Strategy
```json
{
  "success": false,
  "error": "Invalid strategy. Valid strategies: meanReversion, movingAverageCrossover, momentum, bollingerBands, breakout, sentimentAnalysis, custom"
}
```

### Missing Required Fields
```json
{
  "success": false,
  "error": "Missing required fields: strategy, symbols, startDate, endDate"
}
```

### Invalid Date Format
```json
{
  "success": false,
  "error": "Invalid date format. Use YYYY-MM-DD format"
}
```

### Authentication Required
```json
{
  "error": "Access token required"
}
```

### Session Limit Reached
```json
{
  "success": false,
  "error": "Maximum active sessions reached for your subscription tier",
  "details": {
    "tier": "FREE",
    "currentCount": 1,
    "maxSessions": 1,
    "activeSessionIds": [123]
  }
}
```

## Starting the Server

```bash
cd api
npx ts-node server.ts
```

The server will start on port 8001 by default.
