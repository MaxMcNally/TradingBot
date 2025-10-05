# Trading Strategies Overview

This document provides an overview of all available trading strategies in the TradingBot system, designed to work with daily data.

## Available Strategies

### 1. Mean Reversion Strategy (Existing)
**File:** `src/strategies/meanReversionStrategy.ts`

**Description:** Buys when price is below moving average by a threshold percentage, sells when above.

**Best For:**
- Range-bound markets
- Volatile stocks with mean-reverting tendencies
- Higher thresholds (3-5%) generally perform better

**Configuration:**
- `window`: Moving average window (e.g., 20 days)
- `threshold`: Percentage threshold (e.g., 0.05 for 5%)

### 2. Moving Average Crossover Strategy (New)
**File:** `src/strategies/movingAverageCrossoverStrategy.ts`

**Description:** Buys when fast MA crosses above slow MA (golden cross), sells when fast MA crosses below slow MA (death cross).

**Best For:**
- Trending markets with strong directional movement
- Volatile stocks with clear trends
- Longer-term positions (weeks to months)

**Configuration:**
- `fastWindow`: Fast moving average window (e.g., 10)
- `slowWindow`: Slow moving average window (e.g., 30)
- `maType`: 'SMA' or 'EMA'

**Common Configurations:**
- 10/30 day: More sensitive, more trades
- 20/50 day: Balanced approach
- 50/200 day: Long-term trend following

### 3. Momentum Strategy (New)
**File:** `src/strategies/momentumStrategy.ts`

**Description:** Uses RSI and price momentum to identify overbought/oversold conditions and momentum breakouts.

**Best For:**
- Trending markets with clear momentum
- Volatile stocks with strong directional moves
- Medium-term positions (days to weeks)

**Configuration:**
- `rsiWindow`: RSI calculation window (typically 14)
- `rsiOverbought`: RSI overbought threshold (typically 70)
- `rsiOversold`: RSI oversold threshold (typically 30)
- `momentumWindow`: Price momentum calculation window (typically 10)
- `momentumThreshold`: Minimum momentum percentage (e.g., 0.02 for 2%)

### 4. Bollinger Bands Strategy (New)
**File:** `src/strategies/bollingerBandsStrategy.ts`

**Description:** Buys when price touches lower band (oversold), sells when price touches upper band (overbought).

**Best For:**
- Ranging/sideways markets
- Mean-reverting stocks
- Volatile stocks with clear support/resistance

**Configuration:**
- `window`: SMA window (typically 20)
- `multiplier`: Standard deviation multiplier (typically 2.0)
- `maType`: 'SMA' or 'EMA'

**Common Configurations:**
- 20-day SMA with 2.0 standard deviation (default)
- 20-day SMA with 2.5 standard deviation (wider bands, fewer signals)
- 10-day SMA with 1.5 standard deviation (tighter bands, more signals)

### 5. Breakout Strategy (New)
**File:** `src/strategies/breakoutStrategy.ts`

**Description:** Identifies support/resistance levels and trades breakouts with volume confirmation.

**Best For:**
- Trending markets with clear breakouts
- Volatile stocks with defined support/resistance
- High-volume stocks for volume confirmation

**Configuration:**
- `lookbackWindow`: Window to identify support/resistance levels (typically 20-50)
- `breakoutThreshold`: Minimum percentage move to confirm breakout (e.g., 0.01 for 1%)
- `minVolumeRatio`: Minimum volume ratio vs average (e.g., 1.5 for 50% above average)
- `confirmationPeriod`: Days to hold position after breakout (typically 1-3)

## Strategy Selection Guide

### For Trending Markets:
- **Moving Average Crossover** - Best for strong trends
- **Momentum Strategy** - Good for momentum-driven moves
- **Breakout Strategy** - Excellent for trend continuation

### For Ranging Markets:
- **Mean Reversion** - Classic range-bound strategy
- **Bollinger Bands** - Volatility-based mean reversion

### For Volatile Stocks:
- **All strategies** can work, but adjust parameters:
  - Higher thresholds for mean reversion
  - Wider bands for Bollinger Bands
  - Longer confirmation periods for breakouts

## Usage Examples

```typescript
import { 
  runMeanReversionStrategy,
  runMovingAverageCrossoverStrategy,
  runMomentumStrategy,
  runBollingerBandsStrategy,
  runBreakoutStrategy
} from './src/strategies';

// Mean Reversion
const meanReversionResult = runMeanReversionStrategy('AAPL', data, {
  window: 20,
  threshold: 0.05,
  initialCapital: 10000,
  sharesPerTrade: 100
});

// Moving Average Crossover
const crossoverResult = runMovingAverageCrossoverStrategy('AAPL', data, {
  fastWindow: 10,
  slowWindow: 30,
  maType: 'SMA',
  initialCapital: 10000,
  sharesPerTrade: 100
});

// Momentum
const momentumResult = runMomentumStrategy('AAPL', data, {
  rsiWindow: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  momentumWindow: 10,
  momentumThreshold: 0.02,
  initialCapital: 10000,
  sharesPerTrade: 100
});

// Bollinger Bands
const bollingerResult = runBollingerBandsStrategy('AAPL', data, {
  window: 20,
  multiplier: 2.0,
  maType: 'SMA',
  initialCapital: 10000,
  sharesPerTrade: 100
});

// Breakout
const breakoutResult = runBreakoutStrategy('AAPL', data, {
  lookbackWindow: 20,
  breakoutThreshold: 0.01,
  minVolumeRatio: 1.5,
  confirmationPeriod: 2,
  initialCapital: 10000,
  sharesPerTrade: 100
});
```

## Future Enhancements

When you gain access to minute-by-minute data, consider implementing:

1. **Scalping Strategies** - Very short-term trades (minutes to hours)
2. **High-Frequency Strategies** - Algorithmic trading with sub-minute timeframes
3. **Arbitrage Strategies** - Price differences between exchanges
4. **Market Making** - Providing liquidity with bid-ask spreads
5. **News-Based Strategies** - Trading on news events and sentiment
6. **Machine Learning Strategies** - AI-driven pattern recognition

## Performance Considerations

- **Backtesting**: Always backtest strategies on historical data before live trading
- **Risk Management**: Implement stop-losses and position sizing
- **Market Conditions**: Different strategies work better in different market environments
- **Transaction Costs**: Consider trading fees and slippage in performance calculations
- **Diversification**: Use multiple strategies to reduce risk

## Testing

Each strategy includes comprehensive backtesting capabilities with metrics:
- Total return
- Win rate
- Maximum drawdown
- Trade history
- Portfolio value tracking

Run tests with different parameters to find optimal configurations for your specific use case.
