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

// Moving Average Crossover Strategy
export {
  MovingAverageCrossoverStrategy,
  MovingAverageCrossoverConfig,
  MovingAverageCrossoverTrade,
  MovingAverageCrossoverResult,
  runMovingAverageCrossoverStrategy
} from './movingAverageCrossoverStrategy';

// Momentum Strategy
export {
  MomentumStrategy,
  MomentumConfig,
  MomentumTrade,
  MomentumResult,
  runMomentumStrategy
} from './momentumStrategy';

// Bollinger Bands Strategy
export {
  BollingerBandsStrategy,
  BollingerBandsConfig,
  BollingerBandsTrade,
  BollingerBandsResult,
  runBollingerBandsStrategy
} from './bollingerBandsStrategy';

// Breakout Strategy
export {
  BreakoutStrategy,
  BreakoutConfig,
  BreakoutTrade,
  BreakoutResult,
  runBreakoutStrategy
} from './breakoutStrategy';

// Legacy moving average strategy (if needed)
export { MovingAverageStrategy } from './movingAverage';

// Strategy runner
export { runStrategy, StrategyConfig, Trade, BacktestResult } from './runStrategy';
