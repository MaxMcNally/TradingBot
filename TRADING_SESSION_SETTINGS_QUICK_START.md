# Trading Session Settings - Quick Start Guide

## What Was Implemented

A complete trading session settings system that allows users to configure:
- **Risk Management**: Stop loss, take profit, position limits, daily loss limits
- **Order Execution**: Time in force, order types, extended hours
- **Position Management**: Max positions, sizing methods, rebalance frequency
- **Trading Windows**: Trading hours and days
- **Advanced Features**: Trailing stops, bracket orders, slippage, commission

## Key Features

✅ **Provider Agnostic**: Works with any trading provider through `ITradingProvider` interface  
✅ **Secure**: Authorization checks, input validation, error handling  
✅ **Type Safe**: Full TypeScript support with comprehensive types  
✅ **Database Agnostic**: Supports both PostgreSQL and SQLite  
✅ **Clean Architecture**: Separation of concerns, SOLID principles  

## Quick Usage

### 1. Run Migration

```bash
yarn migrate:run
```

This creates the `trading_session_settings` table.

### 2. Start a Session with Settings

```bash
POST /api/trading/sessions/start
{
  "userId": 1,
  "mode": "PAPER",
  "initialCash": 10000,
  "symbols": ["AAPL"],
  "strategy": "momentum",
  "settings": {
    "stop_loss_percentage": 5.0,
    "take_profit_percentage": 10.0,
    "max_position_size_percentage": 25.0
  }
}
```

Settings are automatically created with defaults if not provided.

### 3. Get Session Settings

```bash
GET /api/trading/sessions/:sessionId/settings
```

### 4. Update Settings

```bash
PATCH /api/trading/sessions/:sessionId/settings
{
  "stop_loss_percentage": 3.0,
  "max_daily_loss_percentage": 5.0
}
```

### 5. Use in Trading Logic

```typescript
import { AlpacaTradingProviderAdapter } from './api/services/adapters/alpacaTradingProviderAdapter';
import { OrderExecutionService } from './api/services/orderExecutionService';
import { TradingSessionSettingsDatabase } from './api/database/tradingSessionSettingsDatabase';

// Get settings
const settings = await TradingSessionSettingsDatabase.getSettingsBySessionId(sessionId);

// Initialize provider
const provider = new AlpacaTradingProviderAdapter(credentials);
await provider.initialize(credentials);

// Submit order (automatically applies settings and risk checks)
const result = await OrderExecutionService.submitOrder(
  provider,
  settings,
  { symbol: 'AAPL', side: 'buy', type: 'market' }
);
```

## File Structure

```
api/
├── interfaces/
│   └── ITradingProvider.ts          # Generic trading provider interface
├── types/
│   └── tradingSessionSettings.ts    # TypeScript types and defaults
├── database/
│   └── tradingSessionSettingsDatabase.ts  # Database operations
├── services/
│   ├── tradingSessionSettingsService.ts    # Validation and defaults
│   ├── riskManagementService.ts           # Risk rule enforcement
│   ├── orderExecutionService.ts           # Order submission with settings
│   └── adapters/
│       └── alpacaTradingProviderAdapter.ts # Alpaca adapter
└── controllers/
    └── tradingSessionSettingsController.ts # HTTP endpoints

scripts/migrations/
└── 003-add-trading-session-settings.ts    # Database migration
```

## API Endpoints

### Settings Management

- `GET /api/trading/sessions/:sessionId/settings` - Get settings
- `POST /api/trading/sessions/:sessionId/settings` - Create settings
- `PATCH /api/trading/sessions/:sessionId/settings` - Update settings

### Updated Endpoints

- `POST /api/trading/sessions/start` - Now accepts `settings` in request body
- `GET /api/trading/users/:userId/active-session` - Now includes `settings` in response

## Adding a New Trading Provider

1. Create an adapter implementing `ITradingProvider`:

```typescript
export class NewProviderAdapter implements ITradingProvider {
  // Implement all methods from ITradingProvider
}
```

2. Use it in your code:

```typescript
const provider = new NewProviderAdapter(credentials);
// All existing code works without changes!
```

## Security

- ✅ User authorization checks on all endpoints
- ✅ Settings validation before saving
- ✅ Input sanitization and type checking
- ✅ Error handling without exposing internals

## Next Steps

1. Run the migration: `yarn migrate:run`
2. Test the endpoints with your frontend
3. Integrate with your trading bot logic
4. Add unit tests for validation and risk management
5. Consider adding settings templates for common configurations

## Support

See `TRADING_SESSION_SETTINGS_IMPLEMENTATION.md` for detailed architecture documentation.

