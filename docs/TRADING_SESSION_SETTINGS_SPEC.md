# Trading Session Settings Specification

## Overview

This document outlines the specification for implementing configurable trading session settings that integrate with the Alpaca Trading API. These settings allow users to customize risk management, order execution preferences, and session behavior for their automated trading sessions.

---

## Table of Contents

1. [Session Settings Schema](#session-settings-schema)
2. [Risk Management Settings](#risk-management-settings)
3. [Order Execution Settings](#order-execution-settings)
4. [Session Control Settings](#session-control-settings)
5. [API Endpoints](#api-endpoints)
6. [Database Schema Changes](#database-schema-changes)
7. [Alpaca API Integration](#alpaca-api-integration)
8. [UI Components](#ui-components)
9. [Future Alpaca Integrations](#future-alpaca-integrations)

---

## Session Settings Schema

### TradingSessionSettings Interface

```typescript
interface TradingSessionSettings {
  id?: number;
  user_id: number;
  
  // Risk Management
  stop_loss_percentage: number;        // 0.01 - 0.50 (1% - 50%)
  take_profit_percentage: number;      // 0.01 - 1.00 (1% - 100%)
  max_position_size: number;           // 0.01 - 1.00 (% of portfolio)
  max_daily_loss: number;              // 0.01 - 1.00 (% of portfolio)
  max_drawdown: number;                // 0.01 - 1.00 (% of portfolio)
  trailing_stop_enabled: boolean;
  trailing_stop_percentage?: number;   // 0.01 - 0.50
  
  // Order Execution
  time_in_force: TimeInForce;
  allow_partial_fill: boolean;         // true = DAY/GTC, false = FOK/IOC
  order_type_preference: OrderType;
  extended_hours_enabled: boolean;
  
  // Position Sizing
  position_sizing_method: PositionSizingMethod;
  fixed_quantity?: number;
  fixed_dollar_amount?: number;
  risk_per_trade_percentage?: number;  // For risk-based sizing
  
  // Session Control
  auto_close_positions_at_eod: boolean;
  max_concurrent_positions: number;
  max_trades_per_day: number;
  cooldown_after_loss: number;         // Minutes to wait after a losing trade
  
  // Notifications
  notify_on_trade: boolean;
  notify_on_stop_loss: boolean;
  notify_on_take_profit: boolean;
  notify_on_daily_loss_limit: boolean;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}
```

### Supporting Types

```typescript
// Alpaca Time In Force Options
type TimeInForce = 
  | 'day'    // Day order - expires at end of trading day
  | 'gtc'    // Good Till Canceled - remains until filled or canceled
  | 'opg'    // Market on Open - executes at market open
  | 'cls'    // Market on Close - executes at market close
  | 'ioc'    // Immediate or Cancel - fills immediately or cancels
  | 'fok';   // Fill or Kill - fills completely or cancels entirely

// Alpaca Order Types
type OrderType = 
  | 'market'        // Execute immediately at current price
  | 'limit'         // Execute at specific price or better
  | 'stop'          // Trigger market order at stop price
  | 'stop_limit'    // Trigger limit order at stop price
  | 'trailing_stop'; // Dynamic stop that follows price

// Position Sizing Methods
type PositionSizingMethod = 
  | 'fixed_quantity'     // Fixed number of shares
  | 'fixed_dollar'       // Fixed dollar amount per trade
  | 'percentage'         // Percentage of portfolio
  | 'risk_based';        // Based on stop loss and risk tolerance

// Order Class (Advanced Orders)
type OrderClass = 
  | 'simple'   // Single order
  | 'bracket'  // Entry with take profit and stop loss
  | 'oco'      // One Cancels Other (take profit OR stop loss)
  | 'oto';     // One Triggers Other (entry triggers exit)
```

---

## Risk Management Settings

### Stop Loss Configuration

| Setting | Type | Range | Default | Description |
|---------|------|-------|---------|-------------|
| `stop_loss_percentage` | number | 0.01 - 0.50 | 0.05 | Percentage below entry price to trigger stop loss |
| `stop_loss_type` | enum | fixed, trailing | fixed | Whether stop loss adjusts with price |
| `trailing_stop_percentage` | number | 0.01 - 0.50 | 0.03 | Distance from high for trailing stop |

### Take Profit Configuration

| Setting | Type | Range | Default | Description |
|---------|------|-------|---------|-------------|
| `take_profit_percentage` | number | 0.01 - 1.00 | 0.15 | Percentage above entry price for profit target |
| `partial_take_profit_enabled` | boolean | - | false | Enable selling portions at different levels |
| `partial_take_profit_levels` | array | - | [] | Array of {percentage, sell_portion} objects |

### Portfolio Risk Limits

| Setting | Type | Range | Default | Description |
|---------|------|-------|---------|-------------|
| `max_position_size` | number | 0.01 - 1.00 | 0.20 | Max % of portfolio per position |
| `max_daily_loss` | number | 0.01 - 1.00 | 0.10 | Stop trading after this % daily loss |
| `max_drawdown` | number | 0.01 - 1.00 | 0.20 | Max portfolio drawdown allowed |
| `max_concurrent_positions` | number | 1 - 100 | 10 | Maximum open positions |

---

## Order Execution Settings

### Time In Force Options (Alpaca API)

| Option | Description | Use Case |
|--------|-------------|----------|
| `day` | Order expires at market close | Standard day trading |
| `gtc` | Good till canceled (max 90 days) | Swing trading, longer holds |
| `opg` | Execute at market open | Opening positions at market open |
| `cls` | Execute at market close | Closing positions at end of day |
| `ioc` | Immediate or cancel | Partial fills acceptable |
| `fok` | Fill or kill - all or nothing | Precise position sizing required |

### Fill Preferences

| Setting | Description |
|---------|-------------|
| `allow_partial_fill: true` | Use `day`, `gtc`, or `ioc` - accepts partial fills |
| `allow_partial_fill: false` | Use `fok` - order must fill completely or cancel |

### Extended Hours Trading

```typescript
{
  extended_hours_enabled: boolean;  // Allow pre/post market trading
  pre_market_start: string;         // e.g., "04:00" ET
  after_hours_end: string;          // e.g., "20:00" ET
}
```

**Note:** Extended hours orders must be `limit` orders per Alpaca requirements.

---

## Session Control Settings

### Session Timing

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `scheduled_start_time` | string | null | ISO timestamp to auto-start session |
| `scheduled_end_time` | string | null | ISO timestamp to auto-end session |
| `auto_close_positions_at_eod` | boolean | true | Close all positions at market close |
| `trading_days` | string[] | ['mon','tue','wed','thu','fri'] | Days to allow trading |

### Trading Frequency Limits

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `max_trades_per_day` | number | 100 | Maximum trades allowed per day |
| `max_trades_per_hour` | number | 20 | Maximum trades per hour |
| `min_trade_interval_seconds` | number | 30 | Minimum time between trades |
| `cooldown_after_loss` | number | 0 | Minutes to pause after losing trade |

---

## API Endpoints

### Session Settings Endpoints

```
GET    /api/trading/settings/:userId
       Get user's trading session settings

POST   /api/trading/settings/:userId
       Create or update trading session settings

PUT    /api/trading/settings/:userId
       Update specific settings fields

DELETE /api/trading/settings/:userId
       Reset to default settings
```

### Request/Response Examples

#### Get Settings
```http
GET /api/trading/settings/123
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "settings": {
    "id": 1,
    "user_id": 123,
    "stop_loss_percentage": 0.05,
    "take_profit_percentage": 0.15,
    "time_in_force": "day",
    "allow_partial_fill": true,
    "max_position_size": 0.20,
    "max_daily_loss": 0.10,
    "extended_hours_enabled": false,
    "auto_close_positions_at_eod": true,
    "trailing_stop_enabled": false,
    "notify_on_trade": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

#### Update Settings
```http
PUT /api/trading/settings/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "stop_loss_percentage": 0.08,
  "take_profit_percentage": 0.20,
  "time_in_force": "gtc",
  "trailing_stop_enabled": true,
  "trailing_stop_percentage": 0.05
}
```

### Session with Settings

When starting a trading session, include settings:

```http
POST /api/trading/sessions/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 123,
  "mode": "PAPER",
  "initialCash": 10000,
  "symbols": ["AAPL", "GOOGL", "MSFT"],
  "strategy": "MovingAverage",
  "settings": {
    "stop_loss_percentage": 0.05,
    "take_profit_percentage": 0.15,
    "time_in_force": "day",
    "allow_partial_fill": true,
    "trailing_stop_enabled": true,
    "trailing_stop_percentage": 0.03,
    "max_position_size": 0.25,
    "auto_close_positions_at_eod": true
  }
}
```

---

## Database Schema Changes

### New Table: trading_session_settings

```sql
CREATE TABLE IF NOT EXISTS trading_session_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Risk Management
  stop_loss_percentage DECIMAL(5,4) DEFAULT 0.05,
  take_profit_percentage DECIMAL(5,4) DEFAULT 0.15,
  max_position_size DECIMAL(5,4) DEFAULT 0.20,
  max_daily_loss DECIMAL(5,4) DEFAULT 0.10,
  max_drawdown DECIMAL(5,4) DEFAULT 0.20,
  trailing_stop_enabled BOOLEAN DEFAULT FALSE,
  trailing_stop_percentage DECIMAL(5,4),
  
  -- Order Execution
  time_in_force VARCHAR(10) DEFAULT 'day',
  allow_partial_fill BOOLEAN DEFAULT TRUE,
  order_type_preference VARCHAR(20) DEFAULT 'market',
  extended_hours_enabled BOOLEAN DEFAULT FALSE,
  
  -- Position Sizing
  position_sizing_method VARCHAR(20) DEFAULT 'percentage',
  fixed_quantity INTEGER,
  fixed_dollar_amount DECIMAL(12,2),
  risk_per_trade_percentage DECIMAL(5,4),
  
  -- Session Control
  auto_close_positions_at_eod BOOLEAN DEFAULT TRUE,
  max_concurrent_positions INTEGER DEFAULT 10,
  max_trades_per_day INTEGER DEFAULT 100,
  cooldown_after_loss INTEGER DEFAULT 0,
  
  -- Notifications
  notify_on_trade BOOLEAN DEFAULT TRUE,
  notify_on_stop_loss BOOLEAN DEFAULT TRUE,
  notify_on_take_profit BOOLEAN DEFAULT TRUE,
  notify_on_daily_loss_limit BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_session_settings_user ON trading_session_settings(user_id);
```

### Update trading_sessions table

```sql
ALTER TABLE trading_sessions
ADD COLUMN settings_id INTEGER REFERENCES trading_session_settings(id),
ADD COLUMN settings_snapshot JSONB; -- Store settings used for session
```

---

## Alpaca API Integration

### Order Submission with Settings

When submitting orders to Alpaca, apply user settings:

```typescript
async function submitOrderWithSettings(
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  settings: TradingSessionSettings
): Promise<AlpacaOrder> {
  const orderRequest: OrderRequest = {
    symbol,
    qty: quantity,
    side,
    type: settings.order_type_preference,
    time_in_force: settings.allow_partial_fill ? settings.time_in_force : 'fok',
    extended_hours: settings.extended_hours_enabled,
  };

  // For extended hours, force limit orders
  if (settings.extended_hours_enabled && orderRequest.type === 'market') {
    const quote = await alpacaService.getQuote(symbol);
    orderRequest.type = 'limit';
    orderRequest.limit_price = quote.ask;
  }

  return alpacaService.submitOrder(orderRequest);
}
```

### Bracket Orders (Entry with Stop Loss & Take Profit)

```typescript
async function submitBracketOrder(
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  entryPrice: number,
  settings: TradingSessionSettings
): Promise<AlpacaOrder> {
  const stopLossPrice = side === 'buy' 
    ? entryPrice * (1 - settings.stop_loss_percentage)
    : entryPrice * (1 + settings.stop_loss_percentage);
    
  const takeProfitPrice = side === 'buy'
    ? entryPrice * (1 + settings.take_profit_percentage)
    : entryPrice * (1 - settings.take_profit_percentage);

  const orderRequest = {
    symbol,
    qty: quantity,
    side,
    type: 'limit',
    limit_price: entryPrice,
    time_in_force: settings.time_in_force,
    order_class: 'bracket',
    take_profit: {
      limit_price: takeProfitPrice,
    },
    stop_loss: {
      stop_price: stopLossPrice,
      limit_price: stopLossPrice * 0.99, // Slight buffer for stop limit
    },
  };

  return alpacaService.submitOrder(orderRequest);
}
```

### Trailing Stop Orders

```typescript
async function submitTrailingStopOrder(
  symbol: string,
  quantity: number,
  settings: TradingSessionSettings
): Promise<AlpacaOrder> {
  if (!settings.trailing_stop_enabled || !settings.trailing_stop_percentage) {
    throw new Error('Trailing stop not configured');
  }

  const orderRequest: OrderRequest = {
    symbol,
    qty: quantity,
    side: 'sell',
    type: 'trailing_stop',
    trail_percent: settings.trailing_stop_percentage * 100, // Alpaca expects percentage
    time_in_force: 'gtc',
  };

  return alpacaService.submitOrder(orderRequest);
}
```

---

## UI Components

### Settings Form Structure

```
Trading Session Settings
├── Risk Management
│   ├── Stop Loss Percentage (slider: 1-50%)
│   ├── Take Profit Percentage (slider: 1-100%)
│   ├── Enable Trailing Stop (toggle)
│   │   └── Trailing Stop Percentage (slider: 1-50%)
│   ├── Max Position Size (slider: 1-100%)
│   ├── Max Daily Loss (slider: 1-100%)
│   └── Max Drawdown (slider: 1-100%)
│
├── Order Execution
│   ├── Time In Force (dropdown: day, gtc, opg, cls, ioc, fok)
│   ├── Allow Partial Fills (toggle)
│   ├── Order Type Preference (dropdown: market, limit, stop)
│   └── Extended Hours Trading (toggle)
│
├── Position Sizing
│   ├── Sizing Method (radio: fixed_quantity, fixed_dollar, percentage, risk_based)
│   ├── Fixed Quantity (number input)
│   ├── Fixed Dollar Amount (currency input)
│   └── Risk Per Trade % (slider)
│
├── Session Control
│   ├── Auto-Close at EOD (toggle)
│   ├── Max Concurrent Positions (number input)
│   ├── Max Trades Per Day (number input)
│   └── Cooldown After Loss (number input: minutes)
│
└── Notifications
    ├── Notify on Trade (toggle)
    ├── Notify on Stop Loss (toggle)
    ├── Notify on Take Profit (toggle)
    └── Notify on Daily Loss Limit (toggle)
```

---

## Future Alpaca Integrations

### 1. Portfolio Management

**Endpoint:** `GET /v2/account`

Integration features:
- Display account equity, buying power, and margin status
- Show pattern day trader (PDT) status and day trade count
- Track portfolio value over time
- Display maintenance margin requirements

```typescript
interface AlpacaPortfolioData {
  equity: number;
  buying_power: number;
  cash: number;
  portfolio_value: number;
  pattern_day_trader: boolean;
  daytrade_count: number;
  maintenance_margin: number;
  initial_margin: number;
  long_market_value: number;
  short_market_value: number;
}
```

**UI Features:**
- Portfolio summary dashboard widget
- Buying power indicator
- PDT warning system (warn at 3 day trades)
- Margin utilization chart

### 2. Order History

**Endpoint:** `GET /v2/orders`

Integration features:
- Full order history with filtering by date, symbol, status
- Order details including fills, cancellations, rejections
- Export order history to CSV
- Order analytics and statistics

```typescript
interface OrderHistoryFilters {
  status: 'open' | 'closed' | 'all';
  limit: number;
  after: string;  // ISO timestamp
  until: string;  // ISO timestamp
  direction: 'asc' | 'desc';
  symbols: string[];
}
```

**UI Features:**
- Sortable/filterable order history table
- Order detail modal with full execution info
- Fill vs requested quantity comparison
- Average fill price tracking
- Order status timeline visualization

### 3. Open Orders with Real-time Status

**Endpoints:**
- `GET /v2/orders?status=open` - Get open orders
- WebSocket `wss://stream.data.alpaca.markets` - Real-time updates

Integration features:
- Live order status updates via WebSocket
- Order modification capability
- Bulk order cancellation
- Order replacement

```typescript
interface OpenOrdersWebSocket {
  // Subscribe to trade updates
  subscribe: (symbols: string[]) => void;
  
  // Handle order events
  onOrderUpdate: (callback: (update: OrderUpdate) => void) => void;
  
  // Order update types
  // - new: Order submitted
  // - fill: Order filled (partial or full)
  // - partial_fill: Partial fill received
  // - canceled: Order canceled
  // - expired: Order expired
  // - replaced: Order replaced
  // - rejected: Order rejected
  // - pending_new: Order pending acceptance
}
```

**UI Features:**
- Real-time open orders panel
- Order modification inline editing
- Quick cancel buttons
- Visual status indicators (pending, partial, filled)
- Time remaining for day orders
- Notification on order status changes

### 4. Positions Management

**Endpoint:** `GET /v2/positions`

Integration features:
- Current positions with real-time P&L
- Position sizing recommendations
- One-click close position
- Partial position closing

```typescript
interface PositionManagement {
  positions: AlpacaPosition[];
  
  // Actions
  closePosition(symbol: string, qty?: number): Promise<AlpacaOrder>;
  closeAllPositions(): Promise<AlpacaOrder[]>;
  
  // Analytics
  getPositionPnL(symbol: string): number;
  getPositionWeight(symbol: string): number;
  getTotalExposure(): number;
}
```

**UI Features:**
- Positions grid with sortable columns
- Real-time P&L updates (color-coded)
- Position weight visualization (pie chart)
- One-click position management buttons
- Position alerts (configurable thresholds)

### 5. Market Data Streaming

**Endpoint:** `wss://stream.data.alpaca.markets`

Integration features:
- Real-time quotes and trades
- Bar data (minute, hour, day)
- Trade/quote snapshots

```typescript
interface MarketDataStream {
  // Subscribe to real-time data
  subscribeTrades(symbols: string[]): void;
  subscribeQuotes(symbols: string[]): void;
  subscribeBars(symbols: string[], timeframe: string): void;
  
  // Event handlers
  onTrade(callback: (trade: TradeData) => void): void;
  onQuote(callback: (quote: QuoteData) => void): void;
  onBar(callback: (bar: BarData) => void): void;
}
```

### 6. Account Activities & History

**Endpoint:** `GET /v2/account/activities`

Integration features:
- Dividend tracking
- Corporate actions (splits, mergers)
- Fee tracking
- Transfer history

### 7. Watchlists

**Endpoint:** `GET /v2/watchlists`

Integration features:
- Create and manage watchlists
- Sync watchlists with trading strategies
- Quick add to trading symbols

### 8. Assets Information

**Endpoint:** `GET /v2/assets`

Integration features:
- Asset tradability status
- Marginability
- Shortability
- Trading halts

---

## Implementation Priority

### Phase 1: Core Settings (MVP)
1. Risk management settings (stop loss, take profit, position size)
2. Basic order execution settings (time in force, order type)
3. Database schema and API endpoints
4. Settings UI component

### Phase 2: Advanced Features
1. Trailing stops integration
2. Bracket orders
3. Extended hours trading
4. Session scheduling

### Phase 3: Alpaca Deep Integration
1. Portfolio dashboard
2. Order history with analytics
3. Real-time open orders
4. Position management

### Phase 4: Enhanced Features
1. Market data streaming
2. Account activities
3. Watchlist integration
4. Advanced notifications

---

## Security Considerations

1. **API Key Encryption**: All Alpaca API keys must be encrypted at rest
2. **Paper Trading Default**: Default to paper trading mode in non-production
3. **Rate Limiting**: Implement rate limiting for API calls
4. **Validation**: Validate all settings ranges before submission
5. **Audit Logging**: Log all settings changes and order submissions

---

## Related Documentation

- [Alpaca Trading API](https://docs.alpaca.markets/docs/trading-api)
- [Alpaca Orders API](https://docs.alpaca.markets/reference/getallorders)
- [Alpaca WebSocket Streaming](https://docs.alpaca.markets/docs/real-time-stock-pricing-data)
- [Alpaca Account API](https://docs.alpaca.markets/reference/getaccount)
