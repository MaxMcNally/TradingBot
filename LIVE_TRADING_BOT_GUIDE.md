# Live Trading Bot Guide

## Overview

The Live Trading Bot is a comprehensive trading system that supports real-time market data streaming, multiple trading strategies, and advanced risk management features. It's designed to work with Polygon.io's professional market data services.

## Features

### ✅ **Data Providers**
- **Polygon.io REST API**: Professional market data with real-time quotes
- **Polygon.io WebSocket**: Live trade data streaming
- **Yahoo Finance**: Free alternative for testing (limited real-time data)

### ✅ **Trading Strategies**
- **Moving Average Crossover**: Classic trend-following strategy
- **Mean Reversion**: Range-bound market strategy
- **Momentum**: RSI and momentum-based strategy
- **Bollinger Bands**: Volatility-based mean reversion

### ✅ **Risk Management**
- **Position Size Limits**: Maximum percentage of portfolio per position
- **Stop Loss**: Automatic loss-cutting at specified percentage
- **Take Profit**: Automatic profit-taking at specified percentage
- **Daily Loss Limits**: Maximum daily loss protection
- **Drawdown Protection**: Maximum portfolio drawdown limits

### ✅ **Real-time Features**
- **WebSocket Streaming**: Live market data from Polygon.io
- **Auto-reconnection**: Automatic reconnection on connection loss
- **Error Handling**: Comprehensive error handling and recovery
- **Live Monitoring**: Real-time portfolio and trade monitoring

## Quick Start

### 1. Environment Setup

Set the following environment variables:

```bash
# Required
export POLYGON_API_KEY="your_polygon_api_key_here"

# Trading Configuration
export TRADING_MODE="PAPER"  # or "LIVE" for real trading
export INITIAL_CASH="10000"
export SYMBOLS="AAPL,TSLA,SPY"
export STRATEGY_TYPE="MovingAverage"

# Data Provider
export DATA_PROVIDER="polygon"

# Strategy Parameters (optional)
export MA_SHORT_WINDOW="5"
export MA_LONG_WINDOW="10"

# User Authentication
export TRADING_USERNAME="admin"
export TRADING_PASSWORD="admin123"
```

### 2. Start the Bot

```bash
# Using the enhanced bot.ts
npx ts-node src/bot.ts

# Or using the test script
node test-live-bot.js
```

### 3. Monitor Trading Activity

The bot will display real-time information:
- 📡 WebSocket connection status
- 📈 Live trade data processing
- 🎯 Strategy signals and trade execution
- 💼 Portfolio updates and P&L tracking
- 🛡️ Risk management alerts

## Configuration Options

### Trading Modes

| Mode | Description | Risk Level |
|------|-------------|------------|
| `PAPER` | Simulated trading with real data | None |
| `LIVE` | Real money trading | High |

### Data Providers

| Provider | Real-time | Cost | Best For |
|----------|-----------|------|----------|
| `polygon` | ✅ Yes | Paid | Professional trading |
| `yahoo` | ❌ Limited | Free | Testing and development |

### Trading Strategies

#### Moving Average Crossover
```bash
export STRATEGY_TYPE="MovingAverage"
export MA_SHORT_WINDOW="5"    # Short MA period
export MA_LONG_WINDOW="10"    # Long MA period
```

#### Mean Reversion
```bash
export STRATEGY_TYPE="MeanReversion"
export MR_WINDOW="20"         # MA window
export MR_THRESHOLD="0.05"    # 5% threshold
```

#### Momentum
```bash
export STRATEGY_TYPE="Momentum"
export MOMENTUM_RSI_WINDOW="14"
export MOMENTUM_RSI_OVERBOUGHT="70"
export MOMENTUM_RSI_OVERSOLD="30"
export MOMENTUM_WINDOW="10"
export MOMENTUM_THRESHOLD="0.02"
```

#### Bollinger Bands
```bash
export STRATEGY_TYPE="BollingerBands"
export BB_WINDOW="20"         # MA window
export BB_MULTIPLIER="2.0"    # Standard deviation multiplier
```

## Risk Management

### Default Risk Settings

```typescript
riskManagement: {
  maxPositionSize: 0.2,    // 20% of portfolio per position
  stopLoss: 0.05,          // 5% stop loss
  takeProfit: 0.15,        // 15% take profit
  maxDailyLoss: 0.1,       // 10% max daily loss
  maxDrawdown: 0.2         // 20% max drawdown
}
```

### Risk Management Features

1. **Position Size Control**: Limits the maximum percentage of portfolio that can be allocated to a single position
2. **Stop Loss**: Automatically sells positions when they reach the specified loss threshold
3. **Take Profit**: Automatically sells positions when they reach the specified profit threshold
4. **Daily Loss Limits**: Prevents trading when daily losses exceed the limit
5. **Drawdown Protection**: Stops trading when portfolio drawdown exceeds the limit

## API Integration

### Backtesting API

The bot integrates with the existing backtesting API:

```bash
# Run backtest with specific provider
curl -X POST http://localhost:3001/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "start": "2023-01-01",
    "end": "2023-12-31",
    "strategy": "meanReversion",
    "provider": "polygon"
  }'
```

### Available Providers

```bash
# Get list of available data providers
curl http://localhost:3001/api/backtest/providers
```

## Monitoring and Logging

### Real-time Monitoring

The bot provides comprehensive real-time monitoring:

- **Connection Status**: WebSocket connection health
- **Trade Execution**: Real-time trade notifications
- **Portfolio Updates**: Live portfolio value and P&L
- **Risk Alerts**: Risk management notifications
- **Error Handling**: Automatic error recovery

### Logging Features

- **Console Output**: Real-time console logging with timestamps
- **Database Logging**: All trades and portfolio snapshots saved to database
- **Event System**: Comprehensive event emission for external monitoring
- **Error Tracking**: Detailed error logging and stack traces

## Testing

### Paper Trading Test

```bash
# Set up test environment
export TRADING_MODE="PAPER"
export POLYGON_API_KEY="your_api_key"

# Run test
node test-live-bot.js
```

### Strategy Testing

```bash
# Test different strategies
export STRATEGY_TYPE="MovingAverage" && npx ts-node src/bot.ts
export STRATEGY_TYPE="MeanReversion" && npx ts-node src/bot.ts
export STRATEGY_TYPE="Momentum" && npx ts-node src/bot.ts
export STRATEGY_TYPE="BollingerBands" && npx ts-node src/bot.ts
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check Polygon API key validity
   - Verify internet connection
   - Check Polygon service status

2. **No Trade Signals**
   - Verify strategy parameters
   - Check if symbols are actively trading
   - Review strategy logic

3. **Risk Management Blocking Trades**
   - Check daily loss limits
   - Verify position size limits
   - Review drawdown protection

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL="debug"
npx ts-node src/bot.ts
```

## Security Considerations

### API Key Management

- Store API keys in environment variables
- Never commit API keys to version control
- Use different keys for testing and production
- Regularly rotate API keys

### Trading Safety

- Always test with paper trading first
- Start with small position sizes
- Monitor risk management settings
- Keep detailed logs of all trading activity

## Performance Optimization

### WebSocket Optimization

- The bot uses efficient WebSocket streaming
- Automatic reconnection on connection loss
- Throttled portfolio updates to reduce overhead
- Symbol filtering to process only relevant data

### Database Optimization

- Efficient trade and portfolio snapshot storage
- Indexed database queries for fast retrieval
- Configurable logging levels to control database writes

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the console logs for error messages
3. Verify environment variable configuration
4. Test with paper trading mode first

## License

This trading bot is part of the TradingBot project. Please refer to the main project license for usage terms.
