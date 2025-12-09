# Trading Session Settings Implementation

## Overview

This document describes the implementation of the Trading Session Settings feature, which allows users to configure risk management, order execution, and position management parameters for their trading sessions.

## Architecture

### Design Principles

1. **Separation of Concerns**: Each component has a single, well-defined responsibility
2. **Provider Agnostic**: Trading logic works with any trading provider through the `ITradingProvider` interface
3. **Security First**: All settings are validated, and user authorization is enforced
4. **Clean Code**: Type-safe interfaces, proper error handling, and comprehensive validation

### Key Components

#### 1. Generic Trading Provider Interface (`api/interfaces/ITradingProvider.ts`)

The `ITradingProvider` interface abstracts trading operations, allowing easy swapping between different trading APIs (Alpaca, Interactive Brokers, etc.).

**Key Methods:**
- `initialize()` - Initialize provider with credentials
- `getAccount()` - Get account information
- `getPositions()` - Get all open positions
- `submitOrder()` - Submit an order
- `getMarketClock()` - Get market status
- And more...

**Benefits:**
- Easy to add new trading providers
- Trading logic is provider-agnostic
- Consistent API across all providers

#### 2. Type Definitions (`api/types/tradingSessionSettings.ts`)

Comprehensive TypeScript types for all session settings:
- `TradingSessionSettings` - Complete settings interface
- `DEFAULT_SESSION_SETTINGS` - Default values
- `SettingsValidationResult` - Validation response

#### 3. Settings Service (`api/services/tradingSessionSettingsService.ts`)

Handles validation and default value management:
- `validateSettings()` - Validates all settings with comprehensive rules
- `createDefaultSettings()` - Creates default settings for new sessions
- `mergeWithDefaults()` - Merges partial settings with defaults

#### 4. Database Layer (`api/database/tradingSessionSettingsDatabase.ts`)

Database operations for settings:
- `createSettings()` - Create new settings
- `getSettingsBySessionId()` - Retrieve settings
- `updateSettings()` - Update existing settings
- `deleteSettings()` - Delete settings

**Features:**
- Supports both PostgreSQL and SQLite
- Handles array serialization for SQLite
- Normalizes boolean values across databases

#### 5. Risk Management Service (`api/services/riskManagementService.ts`)

Enforces risk management rules:
- `checkPositionSizeLimit()` - Validates position size against limits
- `checkMaxOpenPositions()` - Checks maximum open positions
- `checkDailyLossLimit()` - Monitors daily loss limits
- `checkStopLoss()` - Evaluates stop loss triggers
- `checkTakeProfit()` - Evaluates take profit triggers
- `checkTradingWindow()` - Validates trading hours and days
- `calculatePositionSize()` - Calculates position size based on method

#### 6. Order Execution Service (`api/services/orderExecutionService.ts`)

Handles order submission with settings applied:
- `prepareOrderRequest()` - Applies session settings to order requests
- `submitOrder()` - Submits orders with risk checks

**Features:**
- Applies bracket orders if enabled
- Applies trailing stops if enabled
- Enforces trading windows
- Validates position limits before submission

#### 7. Alpaca Adapter (`api/services/adapters/alpacaTradingProviderAdapter.ts`)

Adapter that wraps `AlpacaService` to implement `ITradingProvider`:
- Maps Alpaca-specific types to generic types
- Handles credential conversion
- Provides consistent interface

#### 8. Controllers and Routes

**Settings Controller** (`api/controllers/tradingSessionSettingsController.ts`):
- `getSessionSettings` - GET `/api/trading/sessions/:sessionId/settings`
- `createSessionSettings` - POST `/api/trading/sessions/:sessionId/settings`
- `updateSessionSettings` - PATCH `/api/trading/sessions/:sessionId/settings`

**Trading Controller** (updated):
- `startTradingSession` - Now creates default settings automatically
- `getActiveTradingSession` - Now includes settings in response

## Database Schema

### Migration: `003-add-trading-session-settings.ts`

Creates the `trading_session_settings` table with:
- Risk management fields (stop loss, take profit, position limits, daily loss limits)
- Order execution fields (time in force, order types, extended hours)
- Position management fields (max positions, sizing method, rebalance frequency)
- Trading window fields (hours, days)
- Advanced fields (trailing stops, bracket orders, slippage, commission)

**Supports:**
- PostgreSQL (with native array support)
- SQLite (with JSON serialization for arrays)

## Security Features

1. **Authorization**: All endpoints verify user ownership of sessions
2. **Validation**: All settings are validated before saving
3. **Input Sanitization**: Type checking and range validation
4. **Error Handling**: Comprehensive error messages without exposing internals

## Usage Examples

### Starting a Session with Custom Settings

```typescript
POST /api/trading/sessions/start
{
  "userId": 1,
  "mode": "PAPER",
  "initialCash": 10000,
  "symbols": ["AAPL", "MSFT"],
  "strategy": "momentum",
  "settings": {
    "stop_loss_percentage": 5.0,
    "take_profit_percentage": 10.0,
    "max_position_size_percentage": 20.0,
    "max_open_positions": 5,
    "time_in_force": "day",
    "extended_hours": false
  }
}
```

### Updating Settings for Active Session

```typescript
PATCH /api/trading/sessions/123/settings
{
  "stop_loss_percentage": 3.0,
  "max_daily_loss_percentage": 5.0
}
```

### Using the Generic Trading Provider

```typescript
import { AlpacaTradingProviderAdapter } from './api/services/adapters/alpacaTradingProviderAdapter';
import { OrderExecutionService } from './api/services/orderExecutionService';
import { RiskManagementService } from './api/services/riskManagementService';

// Initialize provider
const provider = new AlpacaTradingProviderAdapter({
  apiKey: 'your-key',
  apiSecret: 'your-secret',
  isPaper: true
});

await provider.initialize({ apiKey: '...', apiSecret: '...', isPaper: true });

// Get settings
const settings = await TradingSessionSettingsDatabase.getSettingsBySessionId(sessionId);

// Submit order with risk checks
const result = await OrderExecutionService.submitOrder(
  provider,
  settings,
  {
    symbol: 'AAPL',
    side: 'buy',
    type: 'market'
  }
);
```

## Adding a New Trading Provider

To add support for a new trading provider (e.g., Interactive Brokers):

1. **Create an adapter** implementing `ITradingProvider`:
```typescript
export class InteractiveBrokersAdapter implements ITradingProvider {
  // Implement all required methods
}
```

2. **Use the adapter** in your trading logic:
```typescript
const provider = new InteractiveBrokersAdapter(credentials);
// All existing trading logic works without changes!
```

## Testing

### Unit Tests Needed

- Settings validation tests
- Risk management rule tests
- Order execution service tests
- Database operations tests

### Integration Tests Needed

- End-to-end session creation with settings
- Order submission with risk checks
- Settings update flow
- Provider adapter tests

## Future Enhancements

1. **Settings Templates**: Save and reuse common settings configurations
2. **Backtesting Integration**: Apply settings to backtesting scenarios
3. **Real-time Monitoring**: WebSocket updates for risk limit breaches
4. **Settings Analytics**: Track which settings perform best
5. **Multi-Provider Support**: Use multiple providers simultaneously

## Migration

To apply the database migration:

```bash
yarn migrate:run
```

This will create the `trading_session_settings` table with all required fields and indexes.

## Notes

- Settings are automatically created with defaults when a session starts
- Settings can only be updated for active sessions
- All settings are validated before saving
- Risk checks are performed before every order submission
- The system is designed to be easily extensible for new providers

