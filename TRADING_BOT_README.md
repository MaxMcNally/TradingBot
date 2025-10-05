# Trading Bot

A comprehensive TypeScript trading bot that supports both paper trading (simulation) and live trading modes. The bot uses various trading strategies and saves all trade data to a SQLite database.

## Features

- **Paper Trading**: Simulate trades using real market data without risking real money
- **Live Trading**: Place actual trades through broker APIs (when implemented)
- **Multiple Strategies**: Support for various trading strategies (Moving Average, Bollinger Bands, etc.)
- **Database Integration**: All trades and portfolio data are saved to SQLite database
- **Real-time Data**: Live market data streaming via Polygon API
- **Risk Management**: Configurable risk management parameters
- **CLI Interface**: Command-line interface for bot management
- **Event-driven Architecture**: Real-time updates and notifications

## Quick Start

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
POLYGON_API_KEY=your_polygon_api_key_here
TRADING_MODE=paper
INITIAL_CASH=10000
SYMBOLS=SPY,QQQ,AAPL,TSLA
```

### 2. Initialize Database

```bash
npm run bot:db:init
```

### 3. Start the Bot

```bash
# Start in paper mode (default)
npm run bot:start

# Start with custom parameters
npm run bot:start -- --mode paper --cash 50000 --symbols AAPL,TSLA,MSFT

# Start in live mode (requires broker integration)
npm run bot:start -- --mode live
```

## Available Commands

### Bot Management

```bash
# Start the trading bot
npm run bot:start [options]

# Show bot status and recent trades
npm run bot:status

# Show current configuration
npm run bot:config

# Initialize database tables
npm run bot:db:init
```

### CLI Options

```bash
# Start command options
--mode <mode>        Trading mode (paper|live) [default: paper]
--cash <amount>      Initial cash amount [default: 10000]
--symbols <symbols>  Comma-separated list of symbols [default: SPY,QQQ,AAPL,TSLA]
--api-key <key>      Polygon API key (or set POLYGON_API_KEY env var)
```

## Configuration

The bot uses a comprehensive configuration system defined in `src/config/tradingConfig.ts`:

### Trading Configuration

```typescript
{
  mode: 'paper' | 'live',
  initialCash: 10000,
  symbols: ['SPY', 'QQQ', 'AAPL', 'TSLA'],
  strategies: [
    {
      name: 'MovingAverage',
      enabled: true,
      parameters: { shortWindow: 5, longWindow: 10 },
      symbols: ['SPY', 'QQQ', 'AAPL', 'TSLA']
    }
  ],
  riskManagement: {
    maxPositionSize: 0.2,    // 20% of portfolio per position
    stopLoss: 0.05,          // 5% stop loss
    takeProfit: 0.15,        // 15% take profit
    maxDailyLoss: 0.1,       // 10% max daily loss
    maxDrawdown: 0.2         // 20% max drawdown
  }
}
```

## Database Schema

The bot automatically creates and manages the following database tables:

### Trades Table
- `id`: Primary key
- `symbol`: Stock symbol
- `action`: BUY or SELL
- `quantity`: Number of shares
- `price`: Execution price
- `timestamp`: Trade timestamp
- `strategy`: Strategy used
- `mode`: PAPER or LIVE
- `pnl`: Profit/Loss (for SELL trades)

### Portfolio Snapshots Table
- `id`: Primary key
- `timestamp`: Snapshot timestamp
- `total_value`: Total portfolio value
- `cash`: Available cash
- `positions`: JSON string of current positions
- `mode`: PAPER or LIVE

### Trading Sessions Table
- `id`: Primary key
- `start_time`: Session start time
- `end_time`: Session end time
- `mode`: PAPER or LIVE
- `initial_cash`: Starting cash amount
- `final_cash`: Ending cash amount
- `total_trades`: Number of trades executed
- `winning_trades`: Number of profitable trades
- `total_pnl`: Total profit/loss
- `status`: ACTIVE, COMPLETED, or STOPPED

## Trading Strategies

### Moving Average Strategy
- Uses short and long moving averages to generate buy/sell signals
- Configurable window sizes
- Default: 5-day short, 10-day long

### Available Strategies
- Moving Average Crossover
- Bollinger Bands
- Mean Reversion
- Momentum
- Breakout

## Event System

The bot emits events for real-time monitoring:

```typescript
bot.on('trade', (trade) => {
  console.log(`Trade executed: ${trade.action} ${trade.symbol}`);
});

bot.on('portfolio-update', (status) => {
  console.log(`Portfolio value: $${status.totalValue}`);
});

bot.on('error', (error) => {
  console.error('Bot error:', error.message);
});
```

## Risk Management

The bot includes several risk management features:

- **Position Sizing**: Limits position size to a percentage of portfolio
- **Stop Loss**: Automatic stop loss orders
- **Take Profit**: Automatic take profit orders
- **Daily Loss Limits**: Stops trading if daily loss exceeds threshold
- **Maximum Drawdown**: Stops trading if drawdown exceeds threshold

## Data Providers

### Polygon API
- Real-time market data
- Historical data
- WebSocket streaming
- Requires API key

### Yahoo Finance (Alternative)
- Free historical data
- No real-time streaming
- Rate limited

## Development

### Project Structure

```
src/
├── bot/
│   ├── TradingBot.ts          # Main bot class
│   └── botCLI.ts              # CLI interface
├── config/
│   ├── config.ts              # Basic configuration
│   └── tradingConfig.ts       # Trading configuration
├── database/
│   └── tradingSchema.ts       # Database schema and models
├── dataProviders/
│   ├── baseProvider.ts        # Base provider interface
│   ├── PolygonProvider.ts     # Polygon API provider
│   └── yahooProvider.ts       # Yahoo Finance provider
├── strategies/
│   ├── movingAverage.ts       # Moving average strategy
│   └── index.ts               # Strategy exports
└── bot.ts                     # Main entry point
```

### Adding New Strategies

1. Create a new strategy file in `src/strategies/`
2. Implement the required interface
3. Export from `src/strategies/index.ts`
4. Add to configuration

### Adding New Data Providers

1. Extend `baseProvider.ts`
2. Implement required methods
3. Add to configuration

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure `POLYGON_API_KEY` is set correctly
2. **Database Error**: Run `npm run bot:db:init` to initialize tables
3. **No Data**: Check internet connection and API key validity
4. **Memory Issues**: Reduce number of symbols or increase system memory

### Logs

The bot provides detailed logging:
- Trade executions
- Portfolio updates
- Error messages
- Performance metrics

## Security

- Never commit API keys to version control
- Use environment variables for sensitive data
- Test thoroughly in paper mode before live trading
- Implement proper authentication for live trading

## License

This project is for educational and research purposes. Use at your own risk for live trading.
