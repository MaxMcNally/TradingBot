/**
 * Example usage of chainable indicators
 * 
 * This file demonstrates how to use the chainable indicators to build
 * custom trading algorithms.
 */

import { rsi, sma, ema, macd, bollingerBands, vwap, ConditionSignalGenerator, PriceData } from './index';

/**
 * Example 1: Simple RSI-based strategy
 * Buy when RSI is oversold, sell when overbought
 */
export function createRSIStrategy() {
  const generator = new ConditionSignalGenerator();
  
  generator.whenBuy(
    rsi(14).oversold(30)
  );
  
  generator.whenSell(
    rsi(14).overbought(70)
  );
  
  return generator;
}

/**
 * Example 2: Moving Average Crossover Strategy
 * Buy when short MA crosses above long MA, sell when it crosses below
 */
export function createMACrossoverStrategy() {
  const generator = new ConditionSignalGenerator();
  const shortMA = sma(50);
  const longMA = sma(200);
  
  generator.whenBuy(
    shortMA.crossesAbove(longMA)
  );
  
  generator.whenSell(
    shortMA.crossesBelow(longMA)
  );
  
  return generator;
}

/**
 * Example 3: Complex multi-indicator strategy
 * Buy when:
 * - RSI is oversold AND
 * - Price is above VWAP AND
 * - MACD signal line crosses above
 * Sell when:
 * - RSI is overbought OR
 * - Price crosses below VWAP
 */
export function createComplexStrategy() {
  const generator = new ConditionSignalGenerator();
  
  generator.whenBuy(
    rsi(14).oversold(30)
      .and(vwap().priceAbove())
      .and(macd(12, 26, 9).crossesAboveSignal())
  );
  
  generator.whenSell(
    rsi(14).overbought(70)
      .or(vwap().priceCrossesBelow())
  );
  
  return generator;
}

/**
 * Example 4: Bollinger Bands mean reversion strategy
 * Buy when price touches lower band, sell when it touches upper band
 */
export function createBollingerStrategy() {
  const generator = new ConditionSignalGenerator();
  const bb = bollingerBands(20, 2.0);
  
  generator.whenBuy(
    bb.priceBelowLower()
  );
  
  generator.whenSell(
    bb.priceAboveUpper()
  );
  
  return generator;
}

/**
 * Example 5: EMA + RSI combination
 * Buy when EMA(12) > EMA(26) AND RSI < 40
 * Sell when EMA(12) < EMA(26) OR RSI > 60
 */
export function createEMARSIStrategy() {
  const generator = new ConditionSignalGenerator();
  const fastEMA = ema(12);
  const slowEMA = ema(26);
  
  generator.whenBuy(
    fastEMA.aboveIndicator(slowEMA)
      .and(rsi(14).below(40))
  );
  
  generator.whenSell(
    fastEMA.belowIndicator(slowEMA)
      .or(rsi(14).above(60))
  );
  
  return generator;
}

/**
 * Example usage with price data
 */
export function exampleUsage() {
  // Sample price data
  const priceData: PriceData[] = [
    { date: '2024-01-01', open: 100, high: 105, low: 99, close: 103, volume: 1000000 },
    { date: '2024-01-02', open: 103, high: 108, low: 102, close: 106, volume: 1200000 },
    { date: '2024-01-03', open: 106, high: 110, low: 104, close: 108, volume: 1100000 },
    // ... more data points
  ];

  // Create a strategy
  const strategy = createRSIStrategy();
  
  // Generate signal
  const signal = strategy.generateSignal(priceData);
  
  console.log('Trading signal:', signal); // 'BUY', 'SELL', or null
}

