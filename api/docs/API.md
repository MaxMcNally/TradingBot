# Trading Bot API

This API provides endpoints for running algorithmic trading backtests.

## Base URL
```
http://localhost:8001
```

## Endpoints

### 1. Health Check
```http
GET /ping
```
Returns server status.

### 2. Backtest Health
```http
GET /api/backtest/health
```
Returns backtest service health status.

### 3. Available Strategies
```http
GET /api/backtest/strategies
```
Returns list of available trading strategies and their parameters.

### 4. Run Backtest
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

## Example Usage

### Single Symbol
```bash
curl -X POST http://localhost:8001/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "meanReversion",
    "symbols": "AAPL",
    "startDate": "2023-01-01",
    "endDate": "2023-12-31"
  }'
```

### Multiple Symbols
```bash
curl -X POST http://localhost:8001/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "meanReversion",
    "symbols": ["TSLA", "NVDA", "AAPL"],
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "window": 30,
    "threshold": 0.03
  }'
```

## Error Responses

### Invalid Strategy
```json
{
  "success": false,
  "error": "Invalid strategy. Valid strategies: meanReversion"
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

## Starting the Server

```bash
cd api
npx ts-node server.ts
```

The server will start on port 8001 by default.
