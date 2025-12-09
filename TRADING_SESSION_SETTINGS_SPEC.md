# Trading Session Settings Specification

## Overview

This specification defines the requirements for adding configurable session settings to user trading sessions, based on the [Alpaca Trading API](https://docs.alpaca.markets/docs/trading-api). These settings will allow users to customize their trading behavior at the session level, providing risk management controls and order execution preferences.

## Current State

The system currently supports:
- Basic trading sessions with start/stop/pause/resume functionality
- Order submission through `AlpacaService` with basic order parameters
- Session tracking in the `trading_sessions` table
- User-specific trading statistics and portfolio management

**Current TradingSession Schema:**
```typescript
interface TradingSession {
  id?: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  mode: 'PAPER' | 'LIVE';
  initial_cash: number;
  final_cash?: number;
  total_trades: number;
  winning_trades: number;
  total_pnl?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'STOPPED';
  created_at?: string;
}
```

## Proposed Session Settings

### 1. Risk Management Settings

#### 1.1 Stop Loss Percentage
- **Type**: `number` (0-100)
- **Default**: `null` (disabled)
- **Description**: Automatically close positions when they reach a specified loss percentage from entry price
- **Alpaca Integration**: Implemented via bracket orders or trailing stop orders
- **Validation**: Must be between 0 and 100, or null
- **Example**: `5.0` = close position if it drops 5% from entry

#### 1.2 Take Profit Percentage
- **Type**: `number` (0-100)
- **Default**: `null` (disabled)
- **Description**: Automatically close positions when they reach a specified profit percentage from entry price
- **Alpaca Integration**: Implemented via bracket orders
- **Validation**: Must be between 0 and 100, or null
- **Example**: `10.0` = close position if it gains 10% from entry

#### 1.3 Maximum Position Size (Percentage)
- **Type**: `number` (0-100)
- **Default**: `25.0`
- **Description**: Maximum percentage of portfolio value that can be allocated to a single position
- **Validation**: Must be between 0 and 100
- **Example**: `25.0` = no single position can exceed 25% of portfolio value

#### 1.4 Maximum Daily Loss (Percentage)
- **Type**: `number` (0-100)
- **Default**: `null` (disabled)
- **Description**: Automatically stop trading session if daily loss exceeds this percentage
- **Validation**: Must be between 0 and 100, or null
- **Example**: `5.0` = stop session if daily loss exceeds 5% of initial cash

#### 1.5 Maximum Daily Loss (Absolute)
- **Type**: `number`
- **Default**: `null` (disabled)
- **Description**: Automatically stop trading session if daily loss exceeds this absolute dollar amount
- **Validation**: Must be positive number, or null
- **Example**: `500.0` = stop session if daily loss exceeds $500

### 2. Order Execution Settings

#### 2.1 Time in Force
- **Type**: `'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok'`
- **Default**: `'day'`
- **Description**: Determines how long the order remains active
  - `day`: Order expires at end of trading day (default)
  - `gtc`: Good-till-canceled (valid until manually canceled)
  - `opg`: Opening auction
  - `cls`: Closing auction
  - `ioc`: Immediate-or-cancel (partial fills allowed, remainder canceled)
  - `fok`: Fill-or-kill (entire order must fill immediately or be canceled)
- **Alpaca Integration**: Direct mapping to Alpaca `time_in_force` parameter

#### 2.2 Allow Partial Fills
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to allow partial order fills
- **Alpaca Integration**: 
  - `true` + `time_in_force: 'day'` = allows partial fills
  - `false` + `time_in_force: 'fok'` = fill-or-kill (no partial fills)
- **Note**: This setting interacts with `time_in_force`. If `allow_partial_fills` is `false`, `time_in_force` should be set to `'fok'` or `'ioc'`.

#### 2.3 Extended Hours Trading
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Allow trading during pre-market and after-hours sessions
- **Alpaca Integration**: Direct mapping to Alpaca `extended_hours` parameter
- **Validation**: Must be boolean

#### 2.4 Order Type Default
- **Type**: `'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'`
- **Default**: `'market'`
- **Description**: Default order type for trades executed during this session
- **Alpaca Integration**: Direct mapping to Alpaca `type` parameter
- **Note**: Can be overridden per-trade if needed

#### 2.5 Limit Price Offset (Percentage)
- **Type**: `number` (0-100)
- **Default**: `null` (disabled)
- **Description**: When using limit orders, set limit price as a percentage offset from current market price
- **Validation**: Must be between -100 and 100, or null
- **Example**: `-0.5` = limit buy orders at 0.5% below market price

### 3. Position Management Settings

#### 3.1 Maximum Open Positions
- **Type**: `number` (integer)
- **Default**: `10`
- **Description**: Maximum number of concurrent open positions allowed
- **Validation**: Must be positive integer
- **Example**: `5` = session will not open new positions if 5 positions are already open

#### 3.2 Position Sizing Method
- **Type**: `'fixed' | 'percentage' | 'kelly' | 'equal_weight'`
- **Default**: `'percentage'`
- **Description**: Method for calculating position sizes
  - `fixed`: Fixed dollar amount per position
  - `percentage`: Percentage of portfolio value
  - `kelly`: Kelly Criterion-based sizing (requires historical win rate)
  - `equal_weight`: Equal weight across all positions
- **Validation**: Must be one of the specified values

#### 3.3 Position Size Value
- **Type**: `number`
- **Default**: `10.0`
- **Description**: The value used for position sizing (interpreted based on `position_sizing_method`)
  - If `fixed`: Dollar amount (e.g., `1000.0` = $1,000 per position)
  - If `percentage`: Percentage (e.g., `10.0` = 10% of portfolio)
  - If `kelly`: Kelly fraction multiplier (e.g., `0.5` = half-Kelly)
  - If `equal_weight`: Ignored
- **Validation**: Must be positive number

#### 3.4 Rebalance Frequency
- **Type**: `'never' | 'daily' | 'weekly' | 'on_signal'`
- **Default**: `'never'`
- **Description**: How often to rebalance positions to target allocation
- **Validation**: Must be one of the specified values

### 4. Trading Window Settings

#### 4.1 Trading Hours Start
- **Type**: `string` (HH:mm format, UTC)
- **Default**: `'09:30'` (market open)
- **Description**: Start time for trading activity during the session
- **Validation**: Must be valid time format

#### 4.2 Trading Hours End
- **Type**: `string` (HH:mm format, UTC)
- **Default**: `'16:00'` (market close)
- **Description**: End time for trading activity during the session
- **Validation**: Must be valid time format, must be after start time

#### 4.3 Trading Days
- **Type**: `string[]` (day abbreviations)
- **Default**: `['MON', 'TUE', 'WED', 'THU', 'FRI']`
- **Description**: Days of the week when trading is allowed
- **Validation**: Must be array of valid day abbreviations

### 5. Advanced Settings

#### 5.1 Enable Trailing Stop
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Use trailing stop orders instead of fixed stop loss
- **Alpaca Integration**: Uses Alpaca `trailing_stop` order type

#### 5.2 Trailing Stop Percentage
- **Type**: `number` (0-100)
- **Default**: `null`
- **Description**: Percentage for trailing stop orders (only used if `enable_trailing_stop` is true)
- **Validation**: Must be between 0 and 100, or null
- **Example**: `2.0` = trailing stop 2% below highest price

#### 5.3 Enable Bracket Orders
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Use bracket orders (combines stop loss and take profit in single order)
- **Alpaca Integration**: Uses Alpaca `order_class: 'bracket'`
- **Note**: When enabled, automatically creates parent order with stop loss and take profit legs

#### 5.4 Enable OCO Orders
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Use One-Cancels-Other (OCO) orders for stop loss/take profit
- **Alpaca Integration**: Uses Alpaca `order_class: 'oco'`
- **Note**: Alternative to bracket orders for more complex scenarios

#### 5.5 Commission Rate
- **Type**: `number`
- **Default**: `0.0`
- **Description**: Commission rate per trade (for paper trading calculations)
- **Validation**: Must be non-negative number
- **Example**: `0.005` = 0.5% commission per trade

#### 5.6 Slippage Model
- **Type**: `'none' | 'fixed' | 'proportional'`
- **Default**: `'none'`
- **Description**: Model for simulating slippage in paper trading
  - `none`: No slippage
  - `fixed`: Fixed dollar amount per trade
  - `proportional`: Percentage of trade value
- **Validation**: Must be one of the specified values

#### 5.7 Slippage Value
- **Type**: `number`
- **Default**: `0.0`
- **Description**: Slippage value (interpreted based on `slippage_model`)
- **Validation**: Must be non-negative number

## Database Schema Changes

### New Table: `trading_session_settings`

```sql
CREATE TABLE IF NOT EXISTS trading_session_settings (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES trading_sessions(id) ON DELETE CASCADE,
  
  -- Risk Management
  stop_loss_percentage DOUBLE PRECISION,
  take_profit_percentage DOUBLE PRECISION,
  max_position_size_percentage DOUBLE PRECISION DEFAULT 25.0,
  max_daily_loss_percentage DOUBLE PRECISION,
  max_daily_loss_absolute DOUBLE PRECISION,
  
  -- Order Execution
  time_in_force TEXT NOT NULL DEFAULT 'day' CHECK (time_in_force IN ('day', 'gtc', 'opg', 'cls', 'ioc', 'fok')),
  allow_partial_fills BOOLEAN DEFAULT TRUE,
  extended_hours BOOLEAN DEFAULT FALSE,
  order_type_default TEXT DEFAULT 'market' CHECK (order_type_default IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop')),
  limit_price_offset_percentage DOUBLE PRECISION,
  
  -- Position Management
  max_open_positions INTEGER DEFAULT 10,
  position_sizing_method TEXT DEFAULT 'percentage' CHECK (position_sizing_method IN ('fixed', 'percentage', 'kelly', 'equal_weight')),
  position_size_value DOUBLE PRECISION DEFAULT 10.0,
  rebalance_frequency TEXT DEFAULT 'never' CHECK (rebalance_frequency IN ('never', 'daily', 'weekly', 'on_signal')),
  
  -- Trading Window
  trading_hours_start TEXT DEFAULT '09:30',
  trading_hours_end TEXT DEFAULT '16:00',
  trading_days TEXT[] DEFAULT ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI'],
  
  -- Advanced
  enable_trailing_stop BOOLEAN DEFAULT FALSE,
  trailing_stop_percentage DOUBLE PRECISION,
  enable_bracket_orders BOOLEAN DEFAULT FALSE,
  enable_oco_orders BOOLEAN DEFAULT FALSE,
  commission_rate DOUBLE PRECISION DEFAULT 0.0,
  slippage_model TEXT DEFAULT 'none' CHECK (slippage_model IN ('none', 'fixed', 'proportional')),
  slippage_value DOUBLE PRECISION DEFAULT 0.0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(session_id)
);

CREATE INDEX IF NOT EXISTS idx_trading_session_settings_session_id 
ON trading_session_settings(session_id);
```

### Updated TradingSession Interface

```typescript
interface TradingSession {
  id?: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  mode: 'PAPER' | 'LIVE';
  initial_cash: number;
  final_cash?: number;
  total_trades: number;
  winning_trades: number;
  total_pnl?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'STOPPED';
  settings?: TradingSessionSettings; // New field
  created_at?: string;
}

interface TradingSessionSettings {
  id?: number;
  session_id: number;
  
  // Risk Management
  stop_loss_percentage?: number;
  take_profit_percentage?: number;
  max_position_size_percentage: number;
  max_daily_loss_percentage?: number;
  max_daily_loss_absolute?: number;
  
  // Order Execution
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  allow_partial_fills: boolean;
  extended_hours: boolean;
  order_type_default: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  limit_price_offset_percentage?: number;
  
  // Position Management
  max_open_positions: number;
  position_sizing_method: 'fixed' | 'percentage' | 'kelly' | 'equal_weight';
  position_size_value: number;
  rebalance_frequency: 'never' | 'daily' | 'weekly' | 'on_signal';
  
  // Trading Window
  trading_hours_start: string;
  trading_hours_end: string;
  trading_days: string[];
  
  // Advanced
  enable_trailing_stop: boolean;
  trailing_stop_percentage?: number;
  enable_bracket_orders: boolean;
  enable_oco_orders: boolean;
  commission_rate: number;
  slippage_model: 'none' | 'fixed' | 'proportional';
  slippage_value: number;
  
  created_at?: string;
  updated_at?: string;
}
```

## API Changes

### 1. Start Trading Session Endpoint

**Endpoint**: `POST /api/trading/sessions/start`

**Request Body** (updated):
```typescript
{
  userId: number;
  mode: 'PAPER' | 'LIVE';
  initialCash: number;
  symbols: string[];
  strategy: string;
  customStrategyId?: number;
  scheduledEndTime?: string;
  settings?: Partial<TradingSessionSettings>; // New optional field
}
```

**Response**:
```typescript
{
  success: boolean;
  sessionId: number;
  message: string;
  session: TradingSession & { settings: TradingSessionSettings };
}
```

### 2. Update Session Settings Endpoint

**Endpoint**: `PATCH /api/trading/sessions/:sessionId/settings`

**Request Body**:
```typescript
{
  // Any subset of TradingSessionSettings fields
  stop_loss_percentage?: number;
  take_profit_percentage?: number;
  // ... other settings
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  settings: TradingSessionSettings;
}
```

### 3. Get Session Settings Endpoint

**Endpoint**: `GET /api/trading/sessions/:sessionId/settings`

**Response**:
```typescript
{
  success: boolean;
  settings: TradingSessionSettings;
}
```

### 4. Get Active Session (updated response)

**Endpoint**: `GET /api/trading/users/:userId/active-session`

**Response** (updated):
```typescript
{
  id: number;
  user_id: number;
  start_time: string;
  // ... other TradingSession fields
  settings: TradingSessionSettings; // New field
}
```

## Implementation Details

### 1. Order Submission Logic

When submitting orders through `AlpacaService`, the system should:

1. **Load session settings** for the active trading session
2. **Apply default values** from settings to order requests:
   ```typescript
   const orderRequest: OrderRequest = {
     symbol: symbol,
     qty: calculatePositionSize(settings, portfolioValue),
     side: side,
     type: settings.order_type_default,
     time_in_force: settings.allow_partial_fills 
       ? settings.time_in_force 
       : 'fok', // Force FOK if partial fills disabled
     extended_hours: settings.extended_hours,
     // ... other parameters
   };
   ```

3. **Apply bracket orders** if enabled:
   ```typescript
   if (settings.enable_bracket_orders && settings.stop_loss_percentage && settings.take_profit_percentage) {
     orderRequest.order_class = 'bracket';
     // Calculate stop_price and limit_price based on percentages
   }
   ```

4. **Apply trailing stops** if enabled:
   ```typescript
   if (settings.enable_trailing_stop && settings.trailing_stop_percentage) {
     orderRequest.type = 'trailing_stop';
     orderRequest.trail_percent = settings.trailing_stop_percentage;
   }
   ```

### 2. Risk Management Enforcement

The system should enforce risk management settings:

1. **Position Size Limits**: Before opening a new position, check:
   ```typescript
   const currentPositionValue = getPositionValue(symbol);
   const maxPositionValue = portfolioValue * (settings.max_position_size_percentage / 100);
   if (currentPositionValue + newPositionValue > maxPositionValue) {
     throw new Error('Position size limit exceeded');
   }
   ```

2. **Maximum Open Positions**: Before opening a new position:
   ```typescript
   const openPositions = await getOpenPositions(userId);
   if (openPositions.length >= settings.max_open_positions) {
     throw new Error('Maximum open positions limit reached');
   }
   ```

3. **Daily Loss Limits**: After each trade, check:
   ```typescript
   const dailyPnL = calculateDailyPnL(session);
   if (settings.max_daily_loss_percentage) {
     const maxLoss = session.initial_cash * (settings.max_daily_loss_percentage / 100);
     if (dailyPnL <= -maxLoss) {
       await stopTradingSession(sessionId, 'Daily loss limit exceeded');
     }
   }
   if (settings.max_daily_loss_absolute) {
     if (dailyPnL <= -settings.max_daily_loss_absolute) {
       await stopTradingSession(sessionId, 'Daily loss limit exceeded');
     }
   }
   ```

4. **Stop Loss/Take Profit**: Monitor positions and execute stop loss/take profit orders:
   ```typescript
   // This should run periodically or on price updates
   for (const position of openPositions) {
     const entryPrice = position.avg_entry_price;
     const currentPrice = await getCurrentPrice(position.symbol);
     const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
     
     if (settings.stop_loss_percentage && pnlPercent <= -settings.stop_loss_percentage) {
       await closePosition(position.symbol, 'Stop loss triggered');
     }
     if (settings.take_profit_percentage && pnlPercent >= settings.take_profit_percentage) {
       await closePosition(position.symbol, 'Take profit triggered');
     }
   }
   ```

### 3. Trading Window Enforcement

Before executing any trade, check:
```typescript
const currentTime = new Date();
const currentDay = getDayAbbreviation(currentTime);
const currentHour = currentTime.getUTCHours();
const currentMinute = currentTime.getUTCMinutes();
const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

if (!settings.trading_days.includes(currentDay)) {
  throw new Error('Trading not allowed on this day');
}

if (currentTimeString < settings.trading_hours_start || currentTimeString > settings.trading_hours_end) {
  throw new Error('Trading not allowed outside trading hours');
}
```

## Suggested Additional Alpaca Integrations

### 1. Portfolio Integration

#### 1.1 Real-time Portfolio Value
- **Endpoint**: `GET /api/trading/users/:userId/portfolio/realtime`
- **Description**: Get real-time portfolio value from Alpaca account
- **Alpaca API**: `GET /v2/account`
- **Response**: Current account equity, buying power, positions, etc.

#### 1.2 Position Details
- **Endpoint**: `GET /api/trading/users/:userId/positions`
- **Description**: Get all open positions with real-time data
- **Alpaca API**: `GET /v2/positions`
- **Response**: Array of positions with current prices, P&L, etc.

#### 1.3 Position History
- **Endpoint**: `GET /api/trading/users/:userId/positions/history`
- **Description**: Get historical position data
- **Alpaca API**: `GET /v2/positions` (with date filters)
- **Response**: Historical positions with entry/exit data

### 2. Order History Integration

#### 2.1 Complete Order History
- **Endpoint**: `GET /api/trading/users/:userId/orders/history`
- **Description**: Get all orders (open, filled, canceled, etc.)
- **Alpaca API**: `GET /v2/orders` with status filters
- **Response**: Complete order history with status, fills, timestamps

#### 2.2 Order Details
- **Endpoint**: `GET /api/trading/orders/:orderId`
- **Description**: Get detailed information about a specific order
- **Alpaca API**: `GET /v2/orders/{order_id}`
- **Response**: Full order details including fill information

#### 2.3 Order Fills
- **Endpoint**: `GET /api/trading/orders/:orderId/fills`
- **Description**: Get fill information for a specific order
- **Alpaca API**: `GET /v2/orders/{order_id}` (includes fill_qty, filled_avg_price)
- **Response**: Fill details including price, quantity, timestamp

### 3. Real-time Order Status

#### 3.1 WebSocket Integration for Order Updates
- **Description**: Subscribe to real-time order status updates via Alpaca WebSocket
- **Alpaca API**: Alpaca WebSocket API (`wss://stream.data.alpaca.markets/v2/iex`)
- **Implementation**: 
  - Subscribe to order updates channel
  - Update order status in database in real-time
  - Push updates to frontend via WebSocket or Server-Sent Events

#### 3.2 Open Orders with Real-time Status
- **Endpoint**: `GET /api/trading/users/:userId/orders/open`
- **Description**: Get all open orders with current status
- **Alpaca API**: `GET /v2/orders?status=open`
- **Response**: Array of open orders with real-time status

#### 3.3 Order Status Polling
- **Description**: Poll Alpaca API periodically to update order statuses
- **Implementation**: Background job that:
  - Fetches open orders from Alpaca
  - Updates local database with latest status
  - Triggers notifications for status changes

### 4. Account Information

#### 4.1 Account Status
- **Endpoint**: `GET /api/trading/users/:userId/account`
- **Description**: Get account information and status
- **Alpaca API**: `GET /v2/account`
- **Response**: Account details including:
  - Buying power
  - Cash balance
  - Portfolio value
  - Account status (trading_blocked, etc.)
  - Pattern day trader status

#### 4.2 Account History
- **Endpoint**: `GET /api/trading/users/:userId/account/history`
- **Description**: Get account value history
- **Alpaca API**: `GET /v2/account/portfolio/history` (if available)
- **Response**: Historical account values over time

### 5. Market Data Integration

#### 5.1 Real-time Quotes
- **Endpoint**: `GET /api/trading/market/quotes/:symbol`
- **Description**: Get real-time quote for a symbol
- **Alpaca API**: `GET /v2/stocks/{symbol}/quotes/latest`
- **Response**: Latest bid/ask prices

#### 5.2 Market Clock
- **Endpoint**: `GET /api/trading/market/clock`
- **Description**: Get current market status (open/closed)
- **Alpaca API**: `GET /v2/clock`
- **Response**: Market status, next open/close times

#### 5.3 Trading Calendar
- **Endpoint**: `GET /api/trading/market/calendar`
- **Description**: Get trading calendar
- **Alpaca API**: `GET /v2/calendar`
- **Response**: Trading days and market hours

### 6. Advanced Order Types

#### 6.1 Bracket Orders
- **Description**: Support for bracket orders (parent order with stop loss and take profit legs)
- **Alpaca API**: `POST /v2/orders` with `order_class: 'bracket'`
- **Implementation**: Already partially supported in settings, needs full implementation

#### 6.2 OCO Orders
- **Description**: Support for One-Cancels-Other orders
- **Alpaca API**: `POST /v2/orders` with `order_class: 'oco'`
- **Implementation**: Add support for OCO order creation

#### 6.3 Trailing Stop Orders
- **Description**: Support for trailing stop orders
- **Alpaca API**: `POST /v2/orders` with `type: 'trailing_stop'`
- **Implementation**: Already partially supported in settings, needs full implementation

### 7. Performance Analytics

#### 7.1 Trade Analysis
- **Endpoint**: `GET /api/trading/users/:userId/analytics/trades`
- **Description**: Analyze trade performance
- **Data Sources**: Combine Alpaca order data with local trade records
- **Response**: Trade statistics, win rate, average P&L, etc.

#### 7.2 Position Analytics
- **Endpoint**: `GET /api/trading/users/:userId/analytics/positions`
- **Description**: Analyze position performance
- **Data Sources**: Alpaca positions API + local data
- **Response**: Position statistics, holding times, etc.

## Migration Strategy

### Phase 1: Database Schema
1. Create `trading_session_settings` table
2. Add migration script
3. Update TypeScript interfaces

### Phase 2: API Endpoints
1. Add settings endpoints (GET, PATCH)
2. Update session start endpoint to accept settings
3. Add validation for settings

### Phase 3: Order Integration
1. Update `AlpacaService` to use session settings
2. Implement bracket order logic
3. Implement trailing stop logic
4. Add position size calculation

### Phase 4: Risk Management
1. Implement position size limits
2. Implement daily loss limits
3. Implement stop loss/take profit monitoring
4. Add trading window enforcement

### Phase 5: Additional Integrations
1. Implement portfolio endpoints
2. Implement order history endpoints
3. Add WebSocket support for real-time updates
4. Implement market data endpoints

## Testing Requirements

### Unit Tests
- Settings validation
- Position size calculations
- Risk limit enforcement
- Order parameter application

### Integration Tests
- Session creation with settings
- Order submission with settings
- Risk management enforcement
- Alpaca API integration

### E2E Tests
- Complete trading session with all settings
- Stop loss/take profit execution
- Daily loss limit enforcement
- Trading window enforcement

## Security Considerations

1. **Settings Validation**: All settings must be validated before saving
2. **User Authorization**: Users can only modify settings for their own sessions
3. **Live Trading Restrictions**: Additional validation for live trading sessions
4. **Rate Limiting**: Protect Alpaca API endpoints from abuse
5. **Credential Security**: Ensure Alpaca credentials are securely stored and encrypted

## Future Enhancements

1. **Settings Templates**: Allow users to save and reuse settings configurations
2. **Backtesting with Settings**: Apply settings to backtesting scenarios
3. **Settings Presets**: Provide pre-configured settings for different trading styles
4. **Settings Analytics**: Track which settings perform best
5. **Multi-Account Support**: Support settings for multiple Alpaca accounts per user

## References

- [Alpaca Trading API Documentation](https://docs.alpaca.markets/docs/trading-api)
- [Alpaca Orders API](https://docs.alpaca.markets/docs/orders)
- [Alpaca Positions API](https://docs.alpaca.markets/docs/positions)
- [Alpaca Account API](https://docs.alpaca.markets/docs/account)
- [Alpaca WebSocket API](https://docs.alpaca.markets/docs/streaming)
