# User Strategy Management Feature

## Overview

This feature allows users to save winning strategies from backtests and persist them to the database for later use in trading mode or additional backtests. Users can manage their strategies through a comprehensive CRUD API.

## Database Schema

### `user_strategies` Table

```sql
CREATE TABLE user_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL,
  config TEXT NOT NULL,              -- JSON string of strategy configuration
  backtest_results TEXT,             -- JSON string of backtest results
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(user_id, name)
);
```

## API Endpoints

### Base URL: `/api/strategies`

### 1. Create Strategy
**POST** `/users/:userId/strategies`

Creates a new strategy for a user.

**Request Body:**
```json
{
  "name": "My Moving Average Strategy",
  "description": "A simple moving average crossover strategy",
  "strategy_type": "moving_average_crossover",
  "config": {
    "fastWindow": 10,
    "slowWindow": 30,
    "maType": "SMA",
    "initialCapital": 10000,
    "sharesPerTrade": 100
  },
  "backtest_results": {
    "totalReturn": 0.15,
    "winRate": 0.65,
    "maxDrawdown": 0.08,
    "finalPortfolioValue": 11500
  }
}
```

**Response:**
```json
{
  "message": "Strategy created successfully",
  "strategy": {
    "id": 1,
    "user_id": 1,
    "name": "My Moving Average Strategy",
    "description": "A simple moving average crossover strategy",
    "strategy_type": "moving_average_crossover",
    "config": { /* parsed config object */ },
    "backtest_results": { /* parsed results object */ },
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get User Strategies
**GET** `/users/:userId/strategies`

Retrieves all strategies for a user.

**Query Parameters:**
- `includeInactive` (optional): Set to `true` to include inactive strategies

**Response:**
```json
{
  "strategies": [
    {
      "id": 1,
      "user_id": 1,
      "name": "My Moving Average Strategy",
      "description": "A simple moving average crossover strategy",
      "strategy_type": "moving_average_crossover",
      "config": { /* parsed config object */ },
      "backtest_results": { /* parsed results object */ },
      "is_active": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. Get Strategy by ID
**GET** `/strategies/:strategyId`

Retrieves a specific strategy by its ID.

**Response:**
```json
{
  "strategy": {
    "id": 1,
    "user_id": 1,
    "name": "My Moving Average Strategy",
    "description": "A simple moving average crossover strategy",
    "strategy_type": "moving_average_crossover",
    "config": { /* parsed config object */ },
    "backtest_results": { /* parsed results object */ },
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Strategy
**PUT** `/strategies/:strategyId`

Updates an existing strategy.

**Request Body:**
```json
{
  "name": "Updated Strategy Name",
  "description": "Updated description",
  "config": {
    "fastWindow": 15,
    "slowWindow": 35
  }
}
```

**Response:**
```json
{
  "message": "Strategy updated successfully",
  "strategy": { /* updated strategy object */ }
}
```

### 5. Delete Strategy
**DELETE** `/strategies/:strategyId`

Permanently deletes a strategy.

**Response:**
```json
{
  "message": "Strategy deleted successfully"
}
```

### 6. Deactivate Strategy
**PATCH** `/strategies/:strategyId/deactivate`

Deactivates a strategy (soft delete).

**Response:**
```json
{
  "message": "Strategy deactivated successfully"
}
```

### 7. Activate Strategy
**PATCH** `/strategies/:strategyId/activate`

Activates a previously deactivated strategy.

**Response:**
```json
{
  "message": "Strategy activated successfully"
}
```

### 8. Save Strategy from Backtest
**POST** `/users/:userId/strategies/from-backtest`

Convenience endpoint to save a strategy directly from backtest results.

**Request Body:**
```json
{
  "name": "Backtest Strategy",
  "description": "Strategy saved from backtest",
  "strategy_type": "bollinger_bands",
  "config": {
    "multiplier": 2.0,
    "window": 20,
    "initialCapital": 10000
  },
  "backtest_results": {
    "totalReturn": 0.22,
    "winRate": 0.70,
    "maxDrawdown": 0.12,
    "finalPortfolioValue": 12200
  }
}
```

## Strategy Types

The system supports the following strategy types:

- `moving_average_crossover`
- `bollinger_bands`
- `mean_reversion`
- `momentum`
- `breakout`

## Configuration Examples

### Moving Average Crossover
```json
{
  "fastWindow": 10,
  "slowWindow": 30,
  "maType": "SMA",
  "initialCapital": 10000,
  "sharesPerTrade": 100
}
```

### Bollinger Bands
```json
{
  "multiplier": 2.0,
  "window": 20,
  "initialCapital": 10000,
  "sharesPerTrade": 100
}
```

### Mean Reversion
```json
{
  "window": 20,
  "threshold": 0.05,
  "initialCapital": 10000,
  "sharesPerTrade": 100
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `409` - Conflict (duplicate strategy name)
- `500` - Internal Server Error

Error responses include a descriptive message:
```json
{
  "message": "Strategy with this name already exists for this user"
}
```

## Usage Examples

### Frontend Integration

```javascript
// Save a strategy from backtest results
const saveStrategy = async (backtestResults, strategyConfig) => {
  const response = await fetch('/api/strategies/users/1/strategies/from-backtest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'My Winning Strategy',
      description: 'Strategy that performed well in backtest',
      strategy_type: 'moving_average_crossover',
      config: strategyConfig,
      backtest_results: backtestResults
    })
  });
  
  return await response.json();
};

// Get all user strategies
const getUserStrategies = async (userId) => {
  const response = await fetch(`/api/strategies/users/${userId}/strategies`);
  return await response.json();
};

// Use a saved strategy in trading mode
const useStrategyForTrading = async (strategyId) => {
  const response = await fetch(`/api/strategies/strategies/${strategyId}`);
  const { strategy } = await response.json();
  
  // Use strategy.config for trading parameters
  return strategy.config;
};
```

## Testing

Run the test script to verify all endpoints work correctly:

```bash
cd api
node test-strategy-endpoints.js
```

## Future Enhancements

1. **Strategy Versioning**: Track multiple versions of the same strategy
2. **Strategy Sharing**: Allow users to share strategies with others
3. **Strategy Performance Tracking**: Track real-time performance of saved strategies
4. **Strategy Templates**: Pre-built strategy templates for common patterns
5. **Strategy Validation**: Validate strategy configurations before saving
6. **Bulk Operations**: Import/export multiple strategies
7. **Strategy Categories**: Organize strategies by category or tags

## Database Migration

The new `user_strategies` table is automatically created when the server starts. No manual migration is required.

## Security Considerations

- All endpoints require valid user authentication
- Users can only access their own strategies
- Strategy names must be unique per user
- Input validation prevents SQL injection and XSS attacks
