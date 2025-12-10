# Trading Bot Core Logic Documentation

## Overview

This document explains the core logic of the Trading Bot system, including how users interact with the system, how market data flows through the system, how strategies are applied, and where results are stored.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [API Integration](#api-integration)
3. [Starting a Trading Session](#starting-a-trading-session)
4. [Market Data Sources](#market-data-sources)
5. [Strategy Application](#strategy-application)
6. [Basic vs Custom Strategies](#basic-vs-custom-strategies)
7. [Backtesting vs Live Trading](#backtesting-vs-live-trading)
8. [Session Settings](#session-settings)
9. [Execution Flow](#execution-flow)
10. [Data Persistence](#data-persistence)

---

## System Architecture

The Trading Bot system consists of three main components:

1. **Frontend (React/TypeScript)**: User interface for configuring and monitoring trading sessions
2. **Backend API (Node.js/Express)**: RESTful API for session management, strategy execution, and data retrieval
3. **Core Trading Engine (TypeScript)**: Strategy execution, portfolio management, and order processing

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Frontend  │ ──────> │  Backend API │ ──────> │ Trading Engine  │
│  (React)    │ <────── │  (Express)   │ <────── │  (TypeScript)   │
└─────────────┘         └──────────────┘         └─────────────────┘
                              │                           │
                              │                           │
                              ▼                           ▼
                        ┌──────────────┐         ┌─────────────────┐
                        │  Database    │         │  Data Providers  │
                        │ (PostgreSQL) │         │ (Polygon/Yahoo) │
                        └──────────────┘         └─────────────────┘
```

---

## API Integration

### Authentication

All API requests require authentication via JWT tokens:

```typescript
// Request header
Authorization: Bearer <jwt_token>
```

### Main API Endpoints

#### Trading Sessions
- `POST /api/trading/sessions/start` - Start a new trading session
- `POST /api/trading/sessions/:sessionId/stop` - Stop an active session
- `POST /api/trading/sessions/:sessionId/pause` - Pause a session
- `POST /api/trading/sessions/:sessionId/resume` - Resume a paused session
- `GET /api/trading/users/:userId/active-session` - Get active session for user
- `GET /api/trading/users/:userId/sessions` - Get all sessions for user
- `GET /api/trading/sessions/:sessionId/trades` - Get trades for a session
- `GET /api/trading/users/:userId/stats` - Get user trading statistics
- `GET /api/trading/users/:userId/portfolio` - Get user portfolio summary

#### Backtesting
- `POST /api/backtest/run` - Run a backtest
- `GET /api/backtest/health` - Get backtest service health
- `GET /api/backtest/strategies` - List available strategies

#### Performance Metrics
All performance routes are accessible to authenticated users (no admin required):
- `GET /api/performance/overview` - Get performance overview
- `GET /api/performance/analytics` - Get performance analytics
- `GET /api/performance/strategy/:strategyName` - Get performance by strategy name
- `GET /api/performance/strategy-id/:strategyId` - Get performance by strategy ID
- `GET /api/performance/:id` - Get specific performance record
- `DELETE /api/performance/:id` - Delete performance record

#### Strategies
- `GET /api/strategies/users/:userId/strategies` - Get user strategies
- `GET /api/strategies/:strategyId` - Get strategy details
- `POST /api/strategies/users/:userId/strategies` - Create user strategy
- `PUT /api/strategies/:strategyId` - Update strategy
- `DELETE /api/strategies/:strategyId` - Delete strategy
- `GET /api/strategies/public` - Get public strategies
- `GET /api/strategies/public/:strategyType` - Get public strategies by type

#### Custom Strategies
- `POST /api/custom-strategies` - Create custom strategy (Premium/Enterprise)
- `GET /api/custom-strategies` - Get user's custom strategies
- `GET /api/custom-strategies/:strategyId` - Get custom strategy by ID
- `PUT /api/custom-strategies/:strategyId` - Update custom strategy
- `DELETE /api/custom-strategies/:strategyId` - Delete custom strategy
- `POST /api/custom-strategies/validate` - Validate custom strategy
- `POST /api/custom-strategies/test` - Test custom strategy

#### Session Settings
- `GET /api/trading/sessions/:sessionId/settings` - Get session settings
- `POST /api/trading/sessions/:sessionId/settings` - Create session settings
- `PATCH /api/trading/sessions/:sessionId/settings` - Update session settings

---

## Starting a Trading Session

### Active Session Limits by Tier

Users can run multiple concurrent trading sessions based on their subscription tier:

- **FREE**: 1 active session
- **BASIC**: 5 active sessions
- **PREMIUM**: 10 active sessions
- **ENTERPRISE**: 10 active sessions

If a user attempts to start a session when they've reached their limit, the API returns an error with details about their current active sessions.

### User Flow

1. **User selects configuration** (via frontend):
   - Trading mode: `PAPER` or `LIVE`
   - Initial capital: Starting cash amount
   - Symbols: Stock symbols to trade (e.g., `['AAPL', 'GOOGL']`)
   - Strategy: Predefined or custom strategy
   - Strategy parameters: Strategy-specific configuration
   - Session settings (optional): Risk management, order execution, trading windows

2. **Frontend sends request** to `POST /api/trading/sessions/start`:

```typescript
{
  userId: number,
  mode: 'PAPER' | 'LIVE',
  initialCash: number,
  symbols: string[],
  strategy: string, // or customStrategyId: number
  strategyParameters: Record<string, any>,
  settings?: TradingSessionSettings, // Optional session settings
  scheduledEndTime?: string // Optional scheduled end time
}
```

3. **Backend validates request**:
   - Checks user's subscription tier to determine active session limit
   - Validates active session count against tier limit:
     - **FREE**: 1 active session
     - **BASIC**: 5 active sessions
     - **PREMIUM/ENTERPRISE**: 10 active sessions
   - Validates strategy exists and user has access
   - Validates session settings (if provided)
   - Checks user subscription tier (custom strategies require Premium/Enterprise)

4. **Backend creates session**:
   - Creates `TradingSession` record in database
   - Creates `TradingSessionSettings` record (defaults or provided settings)
   - Sends webhook event (if configured)
   - Returns session ID to frontend

5. **Trading Engine starts**:
   - `TradingBot` instance is created (not directly from API, but conceptually)
   - Connects to market data stream
   - Initializes portfolio with initial cash
   - Starts processing market data and executing trades

### Code Flow

```typescript
// api/controllers/tradingController.ts
export const startTradingSession = async (req: Request, res: Response) => {
  // 1. Validate request
  // 2. Get user and check subscription tier
  // 3. Check active session count against tier limit:
  //    - FREE: max 1 session
  //    - BASIC: max 5 sessions
  //    - PREMIUM/ENTERPRISE: max 10 sessions
  // 4. Create trading session in database
  // 5. Create/validate session settings
  // 6. Return session details
}
```

### Session Limit Enforcement

The system enforces session limits by:

1. **Querying active sessions**: `TradingDatabase.getActiveTradingSessionsCount(userId)`
2. **Checking tier limit**: Compares count against tier-based limit
3. **Returning error if limit reached**: Includes current count, max allowed, and active session IDs

```typescript
// Session limits configuration
const sessionLimits = {
  'FREE': 1,
  'BASIC': 5,
  'PREMIUM': 10,
  'ENTERPRISE': 10
};
```

**Note**: The actual `TradingBot` instance runs as a separate process/service. The API creates the session record, and the bot process picks it up and starts trading.

---

## Market Data Sources

### Supported Data Providers

The system supports multiple data providers for market data:

#### 1. **Polygon.io** (Primary - Real-time & Historical)
- **Real-time data**: WebSocket stream for live price updates
- **Historical data**: REST API for backtesting
- **Features**: High-frequency updates, comprehensive market data
- **Configuration**: Requires `POLYGON_API_KEY` environment variable
- **Usage**: Default provider for live trading

#### 2. **Yahoo Finance** (Fallback - Historical)
- **Historical data**: Free, no API key required
- **Features**: Good for backtesting, limited real-time capabilities
- **Usage**: Default for backtesting, fallback for live trading

#### 3. **Polygon Flat Files** (Advanced - Historical)
- **Historical data**: S3-based flat file storage
- **Features**: Fast bulk data access, requires AWS credentials
- **Configuration**: Requires `POLYGON_AWS_ACCESS_KEY_ID` and `POLYGON_AWS_SECRET_ACCESS_KEY`

### Data Provider Selection

```typescript
// src/bot.ts - Data provider creation
function createDataProvider(): DataProvider {
  const providerType = process.env.DATA_PROVIDER || 'polygon';
  
  switch (providerType.toLowerCase()) {
    case 'polygon':
      return new PolygonProvider(process.env.POLYGON_API_KEY!);
    case 'yahoo':
      return new YahooDataProvider();
    case 'polygon-flatfiles':
      return new PolygonFlatFilesCLIProvider({...});
  }
}
```

### Data Flow

#### Live Trading
```
Market Data Provider (Polygon.io)
    │
    ├─> WebSocket Stream
    │       │
    │       └─> TradingBot.processMarketData()
    │               │
    │               └─> Strategy.getSignal()
    │                       │
    │                       └─> Execute Trade
```

#### Backtesting
```
Data Provider (Yahoo/Polygon)
    │
    ├─> getHistorical(symbol, interval, startDate, endDate)
    │       │
    │       └─> SmartCacheManager (optional caching)
    │               │
    │               └─> Strategy Execution Function
    │                       │
    │                       └─> Process each bar sequentially
```

### Caching

The system uses `SmartCacheManager` to cache historical data:

- **Location**: Local SQLite database (`db/cache.db`)
- **Purpose**: Reduce API calls and improve backtest performance
- **Features**: 
  - Automatic cache population
  - Cache hit/miss tracking
  - Date range coverage analysis

---

## Strategy Application

### How Strategies Work

Strategies analyze market data and generate trading signals (`BUY`, `SELL`, or `null`).

#### Strategy Interface

```typescript
abstract class BaseStrategy {
  abstract addPrice(price: number): Signal; // 'BUY' | 'SELL' | null
  abstract getSignal(): Signal;
  abstract reset(): void;
}
```

### Strategy Execution Flow

1. **Market data arrives** (real-time or historical bar)
2. **Price added to strategy**: `strategy.addPrice(currentPrice)`
3. **Strategy analyzes**: Calculates indicators, checks conditions
4. **Signal generated**: Returns `BUY`, `SELL`, or `null`
5. **Trade execution** (if signal is not null):
   - Check session settings (trading window, position limits, etc.)
   - Calculate position size
   - Execute order through order simulator (backtest) or broker (live)
   - Update portfolio
   - Save trade to database

### Example: Mean Reversion Strategy

```typescript
// Strategy logic
1. Calculate 20-day moving average
2. Calculate deviation from MA
3. If price < MA - 5% threshold → BUY signal
4. If price > MA + 5% threshold → SELL signal
```

---

## Basic vs Custom Strategies

### Basic (Predefined) Strategies

Predefined strategies are built into the system:

1. **Mean Reversion**
   - Parameters: `window` (MA period), `threshold` (deviation %)
   - Logic: Buy when price deviates below MA, sell when above

2. **Moving Average Crossover**
   - Parameters: `fastWindow`, `slowWindow`, `maType` (SMA/EMA)
   - Logic: Buy on golden cross, sell on death cross

3. **Momentum**
   - Parameters: `rsiWindow`, `rsiOverbought`, `rsiOversold`, `momentumWindow`, `momentumThreshold`
   - Logic: Buy on RSI oversold or momentum breakout, sell on RSI overbought

4. **Bollinger Bands**
   - Parameters: `window`, `multiplier`, `maType`
   - Logic: Buy at lower band, sell at upper band

5. **Breakout**
   - Parameters: `lookbackWindow`, `breakoutThreshold`, `minVolumeRatio`, `confirmationPeriod`
   - Logic: Buy on upward breakout, sell on downward breakout

6. **Sentiment Analysis**
   - Parameters: `lookbackDays`, `buyThreshold`, `sellThreshold`, `newsSource`
   - Logic: Buy on positive sentiment, sell on negative sentiment

### Custom Strategies

Custom strategies allow users to define their own buy/sell conditions using a visual condition builder.

#### Structure

```typescript
interface CustomStrategy {
  id: number;
  user_id: number;
  name: string;
  buy_conditions: ConditionNode | ConditionNode[];
  sell_conditions: ConditionNode | ConditionNode[];
  is_active: boolean;
}
```

#### Condition Nodes

Conditions are built using a tree structure:

```typescript
type ConditionNode = 
  | { type: 'indicator', indicator: {...} }  // Single indicator condition
  | { type: 'and', children: ConditionNode[] }  // AND logic
  | { type: 'or', children: ConditionNode[] };  // OR logic
```

#### Example Custom Strategy

```typescript
{
  buy_conditions: {
    type: 'and',
    children: [
      { type: 'indicator', indicator: { type: 'sma', period: 20, condition: 'above', value: 100 } },
      { type: 'indicator', indicator: { type: 'rsi', period: 14, condition: 'below', value: 30 } }
    ]
  },
  sell_conditions: {
    type: 'indicator',
    indicator: { type: 'rsi', period: 14, condition: 'above', value: 70 }
  }
}
```

**Translation**: Buy when SMA(20) > 100 AND RSI(14) < 30, Sell when RSI(14) > 70

#### Execution

Custom strategies use `CustomStrategyExecutor`:

```typescript
// src/utils/indicators/executor.ts
const signal = CustomStrategyExecutor.executeStrategy(
  buyConditions,
  sellConditions,
  priceDataHistory
);
```

#### Access Control

- **Requirement**: Premium or Enterprise subscription
- **Storage**: `custom_strategies` table
- **Privacy**: User-scoped (can be made public)

---

## Backtesting vs Live Trading

### Backtesting

**Purpose**: Test strategies on historical data before risking real capital.

#### Process

1. **User configures backtest** (via frontend):
   - Strategy selection
   - Date range (start/end)
   - Symbols
   - Initial capital
   - Session settings (optional)

2. **Frontend sends request** to `POST /api/backtest/run`

3. **Backend validates and executes**:
   - Fetches historical data from data provider
   - Runs strategy execution function (e.g., `runMeanReversionStrategy`)
   - Applies session settings (risk management, order execution simulation)
   - Calculates performance metrics

4. **Results returned**:
   - Trades executed
   - Final portfolio value
   - Total return
   - Win rate
   - Max drawdown
   - Portfolio history

5. **Results saved**:
   - Performance metrics saved to `strategy_performance` table
   - Can be associated with user strategies

#### Execution Functions

Each strategy has a dedicated execution function:

```typescript
// src/strategies/meanReversionStrategy.ts
export function runMeanReversionStrategy(
  symbol: string,
  data: PriceData[],
  config: {
    window: number,
    threshold: number,
    initialCapital: number,
    sharesPerTrade: number,
    sessionSettings?: TradingSessionSettings
  }
): MeanReversionResult
```

#### Session Settings in Backtesting

Backtests can use the same session settings as live trading:

- **Risk Management**: Stop loss, take profit, daily loss limits
- **Order Execution**: Slippage, commissions, order types
- **Position Sizing**: Fixed, percentage, Kelly, equal weight
- **Trading Windows**: Hours and days restrictions

This ensures backtest results are more realistic and predictive of live performance.

### Live Trading

**Purpose**: Execute trades in real-time based on live market data.

#### Process

1. **User starts session** (via API)
2. **TradingBot instance created**:
   - Connects to market data WebSocket stream
   - Initializes portfolio
   - Loads strategy configuration

3. **Real-time processing**:
   - Receives market data updates
   - Strategy analyzes each update
   - Generates signals
   - Executes trades (if conditions met)

4. **Trade execution**:
   - **PAPER mode**: Simulated execution, portfolio tracking only
   - **LIVE mode**: Orders sent to Alpaca broker (if configured)

5. **Results tracked**:
   - Trades saved to `trades` table
   - Portfolio snapshots saved periodically
   - Session statistics updated

#### TradingBot Class

```typescript
// src/bot/TradingBot.ts
export class TradingBot extends EventEmitter {
  private async processMarketData(data: any[]): Promise<void> {
    // Extract trade data
    // Update strategy with prices
    // Get signal
    // Execute trade if signal present
  }
  
  private async executeTrade(
    symbol: string,
    price: number,
    signal: Signal
  ): Promise<void> {
    // Check session settings
    // Calculate position size
    // Execute on broker (if LIVE mode)
    // Update portfolio
    // Save trade to database
  }
}
```

### Key Differences

| Aspect | Backtesting | Live Trading |
|--------|-------------|--------------|
| **Data Source** | Historical (cached) | Real-time (WebSocket) |
| **Execution** | Simulated | Real orders (LIVE mode) |
| **Speed** | Fast (processes all bars) | Real-time (waits for data) |
| **Risk** | None | Real capital at risk |
| **Settings** | Full support | Full support |
| **Results** | Saved to `strategy_performance` | Saved to `trades` and `trading_sessions` |

---

## Session Settings

Session settings allow users to configure risk management, order execution, and trading behavior for both backtesting and live trading.

### Categories

#### 1. Risk Management
- **Stop Loss**: Percentage-based stop loss (e.g., 5%)
- **Take Profit**: Percentage-based take profit (e.g., 10%)
- **Trailing Stop**: Dynamic stop loss that follows price
- **Max Position Size**: Maximum percentage of portfolio per position
- **Max Open Positions**: Maximum number of concurrent positions
- **Daily Loss Limits**: Percentage or absolute dollar limits

#### 2. Order Execution
- **Order Type**: Market, Limit, Stop, Stop Limit, Trailing Stop
- **Time in Force**: Day, GTC, IOC, FOK, OPG, CLS
- **Slippage Model**: None, Fixed, Proportional
- **Commission Rate**: Percentage-based commission
- **Partial Fills**: Allow or require full fills
- **Limit Price Offset**: Percentage offset for limit orders

#### 3. Position Management
- **Position Sizing Method**: Fixed, Percentage, Kelly Criterion, Equal Weight
- **Position Size Value**: Shares (fixed) or percentage (percentage/Kelly)
- **Rebalance Frequency**: Never, Daily, Weekly, On Signal

#### 4. Trading Window
- **Trading Hours**: Start and end times (UTC)
- **Trading Days**: Days of week (MON, TUE, etc.)
- **Extended Hours**: Allow pre/post market trading

### Application

#### In Backtesting

Session settings are applied through:

1. **BacktestPortfolio**: Manages position sizing, risk limits, trading windows
2. **OrderExecutionSimulator**: Simulates slippage, commissions, order types

```typescript
// Example: Stop loss enforcement
const stopLossTakeProfit = portfolio.checkStopLossTakeProfit(symbol, currentPrice);
if (stopLossTakeProfit === 'STOP_LOSS') {
  // Execute sell order
  portfolio.sell(symbol, currentPrice, date);
}
```

#### In Live Trading

Session settings are enforced by:

1. **TradingBot**: Checks settings before executing trades
2. **AlpacaService**: Applies order execution settings when placing orders

### Default Settings

If no settings are provided, system uses defaults:

```typescript
{
  stop_loss_percentage: null,
  take_profit_percentage: null,
  max_position_size_percentage: 25.0,
  position_sizing_method: 'percentage',
  position_size_value: 10.0,
  order_type_default: 'market',
  slippage_model: 'none',
  commission_rate: 0.0,
  trading_hours_start: '09:30',
  trading_hours_end: '16:00',
  trading_days: ['MON', 'TUE', 'WED', 'THU', 'FRI']
}
```

---

## Execution Flow

### Backtesting Execution Flow

```
1. User Request (POST /api/backtest/run)
   │
   ├─> Validate request
   │
   ├─> For each symbol:
   │     │
   │     ├─> Fetch historical data (with caching)
   │     │
   │     ├─> Parse session settings (if provided)
   │     │
   │     ├─> Initialize BacktestPortfolio
   │     │
   │     ├─> Initialize OrderExecutionSimulator
   │     │
   │     ├─> For each data point:
   │     │     │
   │     │     ├─> Check stop loss/take profit
   │     │     │
   │     │     ├─> Update strategy with price
   │     │     │
   │     │     ├─> Get signal (BUY/SELL/null)
   │     │     │
   │     │     ├─> If signal:
   │     │     │     │
   │     │     │     ├─> Check trading window
   │     │     │     │
   │     │     │     ├─> Check position limits
   │     │     │     │
   │     │     │     ├─> Calculate position size
   │     │     │     │
   │     │     │     ├─> Simulate order execution
   │     │     │     │
   │     │     │     └─> Update portfolio
   │     │     │
   │     │     └─> Track portfolio value
   │     │
   │     └─> Calculate metrics
   │
   ├─> Aggregate results
   │
   ├─> Save performance metrics
   │
   └─> Return results
```

### Live Trading Execution Flow

```
1. User Starts Session (POST /api/trading/sessions/start)
   │
   ├─> Create TradingSession record
   │
   ├─> Create TradingSessionSettings record
   │
   └─> Return session ID
   
2. TradingBot Process (separate process)
   │
   ├─> Connect to market data stream
   │
   ├─> Initialize portfolio
   │
   └─> Start processing loop:
         │
         ├─> Receive market data
         │
         ├─> Update strategy
         │
         ├─> Get signal
         │
         ├─> Check session settings
         │
         ├─> Execute trade (if conditions met)
         │     │
         │     ├─> Calculate position size
         │     │
         │     ├─> Place order (LIVE mode → Alpaca)
         │     │
         │     ├─> Update portfolio
         │     │
         │     └─> Save trade to database
         │
         └─> Save portfolio snapshot (periodically)
```

---

## Data Persistence

### Database Schema

The system uses PostgreSQL (or SQLite for development) with the following key tables:

#### Trading Sessions

**Table**: `trading_sessions`

```sql
CREATE TABLE trading_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  mode TEXT NOT NULL, -- 'PAPER' or 'LIVE'
  initial_cash DOUBLE PRECISION NOT NULL,
  final_cash DOUBLE PRECISION,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  total_pnl DOUBLE PRECISION,
  status TEXT NOT NULL, -- 'ACTIVE', 'COMPLETED', 'STOPPED'
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Storage Location**: `api/database/tradingSchema.ts`

#### Trades

**Table**: `trades`

```sql
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  action TEXT NOT NULL, -- 'BUY' or 'SELL'
  quantity DOUBLE PRECISION NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  timestamp TEXT NOT NULL,
  strategy TEXT NOT NULL,
  mode TEXT NOT NULL, -- 'PAPER' or 'LIVE'
  pnl DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Storage Location**: Saved by `TradingDatabase.saveTrade()`

#### Portfolio Snapshots

**Table**: `portfolio_snapshots`

```sql
CREATE TABLE portfolio_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  total_value DOUBLE PRECISION NOT NULL,
  cash DOUBLE PRECISION NOT NULL,
  positions TEXT NOT NULL, -- JSON string
  mode TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Storage Location**: Saved periodically during live trading

#### Session Settings

**Table**: `trading_session_settings`

```sql
CREATE TABLE trading_session_settings (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  -- Risk Management
  stop_loss_percentage DOUBLE PRECISION,
  take_profit_percentage DOUBLE PRECISION,
  max_position_size_percentage DOUBLE PRECISION,
  -- Order Execution
  time_in_force TEXT NOT NULL,
  order_type_default TEXT NOT NULL,
  -- Position Management
  position_sizing_method TEXT NOT NULL,
  position_size_value DOUBLE PRECISION NOT NULL,
  -- ... (many more fields)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Storage Location**: `api/database/tradingSessionSettingsDatabase.ts`

#### Strategy Performance (Backtest Results)

**Table**: `strategy_performance`

```sql
CREATE TABLE strategy_performance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  strategy_name TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  execution_type TEXT NOT NULL, -- 'backtest' or 'live'
  session_id INTEGER,
  symbols TEXT NOT NULL, -- JSON array
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  initial_capital DOUBLE PRECISION NOT NULL,
  final_capital DOUBLE PRECISION NOT NULL,
  total_return DOUBLE PRECISION NOT NULL,
  win_rate DOUBLE PRECISION,
  total_trades INTEGER,
  max_drawdown DOUBLE PRECISION,
  sharpe_ratio DOUBLE PRECISION,
  config TEXT NOT NULL, -- JSON string
  trades_data TEXT, -- JSON string
  portfolio_history TEXT, -- JSON string
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Storage Location**: `api/models/StrategyPerformance.ts`

### Where Results Are Saved

#### Backtest Results

1. **Immediate Response**: Returned to frontend via API response
2. **Performance Metrics**: Saved to `strategy_performance` table
   - Location: `api/services/performanceMetricsService.ts`
   - Method: `PerformanceMetricsService.savePerformanceMetrics()`
3. **Optional**: Can be saved as a user strategy in `user_strategies` table

#### Live Trading Results

1. **Trades**: Saved to `trades` table immediately after execution
   - Location: `src/database/tradingSchema.ts`
   - Method: `TradingDatabase.saveTrade()`

2. **Portfolio Snapshots**: Saved periodically (configurable interval)
   - Location: `src/database/tradingSchema.ts`
   - Method: `TradingDatabase.savePortfolioSnapshot()`

3. **Session Updates**: Session statistics updated in `trading_sessions` table
   - Total trades, winning trades, P&L updated in real-time

4. **Performance Metrics**: Can be calculated and saved after session ends
   - Similar to backtest metrics
   - Stored in `strategy_performance` table with `execution_type = 'live'`

### Data Flow Summary

```
Backtest:
  Results → PerformanceMetricsService → strategy_performance table

Live Trading:
  Trades → TradingDatabase.saveTrade() → trades table
  Snapshots → TradingDatabase.savePortfolioSnapshot() → portfolio_snapshots table
  Session → TradingDatabase.updateTradingSession() → trading_sessions table
```

---

## Key Components

### Core Classes

1. **TradingBot** (`src/bot/TradingBot.ts`)
   - Main trading engine
   - Processes market data
   - Executes trades
   - Manages portfolio

2. **BacktestPortfolio** (`src/backtest/BacktestPortfolio.ts`)
   - Enhanced portfolio for backtesting
   - Position sizing methods
   - Risk management enforcement
   - Trading window restrictions

3. **OrderExecutionSimulator** (`src/backtest/OrderExecutionSimulator.ts`)
   - Simulates realistic order execution
   - Applies slippage and commissions
   - Handles order types and time in force

4. **CustomStrategyExecutor** (`src/utils/indicators/executor.ts`)
   - Executes custom strategy conditions
   - Evaluates indicator-based logic trees

5. **Data Providers** (`src/dataProviders/`)
   - `PolygonProvider`: Real-time and historical data
   - `YahooDataProvider`: Historical data
   - `PolygonFlatFilesCLIProvider`: Bulk historical data

6. **SmartCacheManager** (`src/cache/SmartCacheManager.ts`)
   - Caches historical data
   - Reduces API calls
   - Improves backtest performance

---

## Example Workflows

### Workflow 1: User Runs a Backtest

```
1. User opens Backtesting page
2. Selects strategy: "Mean Reversion"
3. Configures parameters: window=20, threshold=0.05
4. Selects symbols: ['AAPL', 'GOOGL']
5. Sets date range: 2023-01-01 to 2023-12-31
6. (Optional) Configures session settings
7. Clicks "Run Backtest"
8. Frontend → POST /api/backtest/run
9. Backend fetches historical data (Yahoo/Polygon)
10. Backend runs runMeanReversionStrategy() for each symbol
11. Results aggregated and returned
12. Performance metrics saved to database
13. Frontend displays results
```

### Workflow 2: User Starts Live Trading Session

```
1. User opens Dashboard
2. Selects strategy and symbols
3. Configures session settings
4. Clicks "Start Trading Session"
5. Frontend → POST /api/trading/sessions/start
6. Backend creates TradingSession record
7. Backend creates TradingSessionSettings record
8. Backend returns session ID
9. (Separate process) TradingBot picks up session
10. TradingBot connects to Polygon WebSocket
11. TradingBot starts processing market data
12. Trades executed based on signals
13. Trades saved to database in real-time
14. Frontend polls for updates
```

### Workflow 3: User Creates Custom Strategy

```
1. User opens Strategy Builder
2. Defines buy conditions: RSI < 30 AND SMA(20) > price
3. Defines sell conditions: RSI > 70
4. Saves strategy
5. Frontend → POST /api/strategies/custom
6. Backend validates and saves to custom_strategies table
7. User can now use strategy for backtesting or trading
```

---

## Configuration

### Environment Variables

```bash
# Data Provider
DATA_PROVIDER=polygon  # or 'yahoo'
POLYGON_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql://user:pass@localhost/dbname

# Trading Mode
TRADING_MODE=PAPER  # or 'LIVE'

# Alpaca (for LIVE trading)
ALPACA_API_KEY=your_key
ALPACA_SECRET_KEY=your_secret
ALPACA_BASE_URL=https://paper-api.alpaca.markets  # or live URL
```

---

## Summary

The Trading Bot system provides a comprehensive platform for:

1. **Strategy Development**: Both predefined and custom strategies
2. **Backtesting**: Test strategies on historical data with realistic simulation
3. **Live Trading**: Execute strategies in real-time with risk management
4. **Risk Management**: Comprehensive session settings for both modes
5. **Data Management**: Multiple data providers with intelligent caching
6. **Result Tracking**: Detailed performance metrics and trade history

All components work together to provide a complete trading system that bridges the gap between strategy development and live execution.

