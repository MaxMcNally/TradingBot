/**
 * Chainable Technical Indicators
 * 
 * This module exports all chainable technical indicators for building
 * custom trading algorithms. Each indicator can be chained with conditions
 * and combined with logical operators (AND, OR, NOT) to create complex
 * trading signals.
 * 
 * Example usage:
 * ```typescript
 * import { rsi, sma, ConditionSignalGenerator } from './utils/indicators';
 * 
 * const generator = new ConditionSignalGenerator();
 * generator.whenBuy(
 *   rsi(14).below(30).and(sma(50).above(sma(200)))
 * );
 * generator.whenSell(
 *   rsi(14).above(70)
 * );
 * 
 * const signal = generator.generateSignal(priceData);
 * ```
 */

// Base types and classes
export * from './types';
export { BaseCondition, ConditionSignalGenerator } from './base';

// Indicators
export { sma, SMAIndicator } from './sma';
export { ema, EMAIndicator } from './ema';
export { rsi, RSIIndicator } from './rsi';
export { macd, MACDIndicator, MACDValue } from './macd';
export { bollingerBands, BollingerBandsIndicator, BollingerBandsValue } from './bollingerBands';
export { vwap, VWAPIndicator } from './vwap';

// Custom strategy executor
export { CustomStrategyExecutor, ConditionNode } from './executor';

