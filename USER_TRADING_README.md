# User-Based Trading Bot

The trading bot now supports user-specific trading with full database integration. Each trade, portfolio snapshot, and trading session is associated with a specific user, allowing for personalized trading experiences and data retrieval.

## Key Features

### 🔐 User Authentication
- User-based trading sessions
- Secure authentication system
- User-specific data isolation
- Multi-user support

### 📊 User-Specific Data
- Individual trade history per user
- Personal portfolio tracking
- User-specific trading statistics
- Session management per user

### 🌐 API Integration
- RESTful API endpoints for client access
- Real-time user data retrieval
- Portfolio and trade history APIs
- Trading session management

## Database Schema

### Updated Tables with User Association

#### Trades Table
```sql
CREATE TABLE trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,           -- NEW: User association
  symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
  quantity REAL NOT NULL,
  price REAL NOT NULL,
  timestamp TEXT NOT NULL,
  strategy TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
  pnl REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

#### Portfolio Snapshots Table
```sql
CREATE TABLE portfolio_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,           -- NEW: User association
  timestamp TEXT NOT NULL,
  total_value REAL NOT NULL,
  cash REAL NOT NULL,
  positions TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

#### Trading Sessions Table
```sql
CREATE TABLE trading_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,           -- NEW: User association
  start_time TEXT NOT NULL,
  end_time TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
  initial_cash REAL NOT NULL,
  final_cash REAL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  total_pnl REAL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'STOPPED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

## Usage

### 1. Environment Setup

Update your `.env` file to include user credentials:

```bash
# Trading Bot Configuration
POLYGON_API_KEY=your_polygon_api_key_here
TRADING_MODE=paper
INITIAL_CASH=10000
SYMBOLS=SPY,QQQ,AAPL,TSLA

# User Authentication
TRADING_USERNAME=admin
TRADING_PASSWORD=admin123
```

### 2. Initialize Database

```bash
npm run bot:db:init
```

### 3. Create Users

```bash
# Create a new user
npm run bot:user:create -- --username john --password secret123 --email john@example.com
```

### 4. Start Trading Bot

```bash
# Start with specific user credentials
npm run bot:start -- --username john --password secret123 --mode paper --cash 50000
```

### 5. Check User Status

```bash
# View user-specific trading data
npm run bot:status -- --username john --password secret123
```

## CLI Commands

### User Management

```bash
# Create a new user
npm run bot:user:create -- --username <username> --password <password> [--email <email>]

# Example
npm run bot:user:create -- --username trader1 --password mypassword --email trader1@example.com
```

### Trading Bot Commands

```bash
# Start bot with user authentication
npm run bot:start -- --username <username> --password <password> [options]

# Check user-specific status
npm run bot:status -- --username <username> --password <password> [--limit <number>]

# View configuration
npm run bot:config

# Initialize database
npm run bot:db:init
```

### CLI Options

```bash
# Start command options
--username <username>    Username for authentication [default: admin]
--password <password>    Password for authentication [default: admin123]
--mode <mode>           Trading mode (paper|live) [default: paper]
--cash <amount>         Initial cash amount [default: 10000]
--symbols <symbols>     Comma-separated list of symbols [default: SPY,QQQ,AAPL,TSLA]
--api-key <key>         Polygon API key (or set POLYGON_API_KEY env var)

# Status command options
--username <username>    Username for authentication [default: admin]
--password <password>    Password for authentication [default: admin123]
--limit <number>        Number of recent trades to show [default: 10]
```

## API Endpoints

The trading bot now provides RESTful API endpoints for client applications:

### User Trading Data

```bash
# Get user trading statistics
GET /api/trading/users/:userId/stats

# Get user portfolio summary
GET /api/trading/users/:userId/portfolio

# Get user recent trades
GET /api/trading/users/:userId/trades?limit=50

# Get user trading sessions
GET /api/trading/users/:userId/sessions?limit=20

# Get user portfolio history
GET /api/trading/users/:userId/portfolio-history?limit=100

# Get active trading session
GET /api/trading/users/:userId/active-session
```

### Session-Specific Data

```bash
# Get trades for a specific session
GET /api/trading/sessions/:sessionId/trades
```

### Example API Responses

#### User Trading Stats
```json
{
  "userId": 1,
  "username": "admin",
  "totalTrades": 45,
  "winningTrades": 28,
  "totalPnL": 1250.75,
  "winRate": 62.22,
  "activeSessions": 1,
  "lastTradeDate": "2024-01-15T14:30:00.000Z"
}
```

#### User Portfolio Summary
```json
{
  "userId": 1,
  "username": "admin",
  "currentValue": 11250.75,
  "cash": 8500.00,
  "totalPositions": 3,
  "mode": "PAPER",
  "lastUpdate": "2024-01-15T14:30:00.000Z"
}
```

#### Recent Trades
```json
[
  {
    "id": 123,
    "user_id": 1,
    "symbol": "AAPL",
    "action": "BUY",
    "quantity": 1,
    "price": 185.50,
    "timestamp": "2024-01-15T14:30:00.000Z",
    "strategy": "MovingAverage",
    "mode": "PAPER",
    "pnl": null,
    "created_at": "2024-01-15T14:30:00.000Z"
  }
]
```

## Client Integration

### Frontend Usage

```typescript
// Fetch user trading statistics
const fetchUserStats = async (userId: number) => {
  const response = await fetch(`/api/trading/users/${userId}/stats`);
  return await response.json();
};

// Fetch user recent trades
const fetchUserTrades = async (userId: number, limit = 50) => {
  const response = await fetch(`/api/trading/users/${userId}/trades?limit=${limit}`);
  return await response.json();
};

// Fetch user portfolio summary
const fetchUserPortfolio = async (userId: number) => {
  const response = await fetch(`/api/trading/users/${userId}/portfolio`);
  return await response.json();
};
```

### React Component Example

```tsx
import React, { useState, useEffect } from 'react';

interface UserTradingStats {
  userId: number;
  username: string;
  totalTrades: number;
  winningTrades: number;
  totalPnL: number;
  winRate: number;
  activeSessions: number;
  lastTradeDate?: string;
}

const UserTradingDashboard: React.FC<{ userId: number }> = ({ userId }) => {
  const [stats, setStats] = useState<UserTradingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/trading/users/${userId}/stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="trading-dashboard">
      <h2>Trading Dashboard - {stats.username}</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Trades</h3>
          <p>{stats.totalTrades}</p>
        </div>
        <div className="stat-card">
          <h3>Win Rate</h3>
          <p>{stats.winRate.toFixed(2)}%</p>
        </div>
        <div className="stat-card">
          <h3>Total P&L</h3>
          <p>${stats.totalPnL.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Active Sessions</h3>
          <p>{stats.activeSessions}</p>
        </div>
      </div>
    </div>
  );
};

export default UserTradingDashboard;
```

## Security Considerations

### Authentication
- Users must authenticate before starting trading sessions
- All API endpoints require valid user identification
- User data is isolated and cannot be accessed by other users

### Data Privacy
- Each user's trades and portfolio data are completely separate
- Foreign key constraints ensure data integrity
- CASCADE delete removes all user data when user is deleted

### Production Recommendations
- Implement proper password hashing (bcrypt)
- Add JWT token authentication for API endpoints
- Implement rate limiting on API endpoints
- Add input validation and sanitization
- Use HTTPS in production

## Migration from Previous Version

If you have existing trading data without user association:

1. **Backup your database** before migration
2. **Create users** for existing trading sessions
3. **Update existing records** to associate with users (manual process)
4. **Test thoroughly** before deploying to production

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify username and password are correct
   - Check if user exists in database
   - Ensure database is properly initialized

2. **No User Data Found**
   - Verify user ID is correct
   - Check if user has any trading history
   - Ensure database tables are created

3. **API Endpoint Errors**
   - Verify user ID is a valid number
   - Check database connection
   - Ensure proper error handling in client code

### Debug Commands

```bash
# Check database tables
npm run bot:db:init

# View user status with detailed output
npm run bot:status -- --username admin --password admin123 --limit 100

# Test API endpoints
curl http://localhost:8001/api/trading/users/1/stats
```

## Next Steps

1. **Implement proper password hashing** for production use
2. **Add JWT authentication** for API endpoints
3. **Create user management UI** in the client application
4. **Add real-time updates** via WebSocket connections
5. **Implement user preferences** and settings management
6. **Add trading performance analytics** and reporting
