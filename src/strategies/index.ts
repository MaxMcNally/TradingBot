/**
 * Trading Strategies Library
 * 
 * This file exports all available trading strategies for easy importing.
 * As you add more strategies, export them here to maintain a clean interface.
 */

// Mean Reversion Strategy
export {
  MeanReversionStrategy,
  MeanReversionConfig,
  MeanReversionTrade,
  MeanReversionResult,
  runMeanReversionStrategy
} from './meanReversionStrategy';

// Legacy moving average strategy (if needed)
export { MovingAverageStrategy } from './movingAverage';

// Strategy runner
export { runStrategy, StrategyConfig, Trade, BacktestResult } from './runStrategy';
