/**
 * MACD (Moving Average Convergence Divergence) Indicator
 * 
 * Consists of:
 * - MACD Line: Fast EMA - Slow EMA
 * - Signal Line: EMA of the MACD Line
 * - Histogram: MACD Line - Signal Line
 */

import { BaseCondition } from './base';
import { Indicator, PriceData, IndicatorValue } from './types';

export interface MACDConfig {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  source?: 'close' | 'open' | 'high' | 'low';
}

export interface MACDValue {
  macd: number;
  signal: number;
  histogram: number;
}

/**
 * Calculate EMA helper (reused from EMA indicator)
 */
function calculateEMAValue(
  prices: PriceData[],
  period: number,
  source: 'close' | 'open' | 'high' | 'low' = 'close'
): number | null {
  if (prices.length < period) {
    return null;
  }

  const multiplier = 2 / (period + 1);
  const relevantPrices = prices.slice(-period);
  
  let ema = relevantPrices[0][source];
  
  for (let i = 1; i < relevantPrices.length; i++) {
    ema = (relevantPrices[i][source] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

/**
 * Calculate MACD for given periods
 */
function calculateMACD(
  prices: PriceData[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
  source: 'close' | 'open' | 'high' | 'low' = 'close'
): MACDValue | null {
  if (prices.length < slowPeriod + signalPeriod) {
    return null;
  }

  // Calculate fast and slow EMAs
  const fastEMA = calculateEMAValue(prices, fastPeriod, source);
  const slowEMA = calculateEMAValue(prices, slowPeriod, source);

  if (fastEMA === null || slowEMA === null) {
    return null;
  }

  const macdLine = fastEMA - slowEMA;

  // Calculate signal line (EMA of MACD line)
  // We need to build MACD line history first
  const macdHistory: number[] = [];
  const minPeriod = Math.max(fastPeriod, slowPeriod);
  
  for (let i = minPeriod; i < prices.length; i++) {
    const fast = calculateEMAValue(prices.slice(0, i + 1), fastPeriod, source);
    const slow = calculateEMAValue(prices.slice(0, i + 1), slowPeriod, source);
    if (fast !== null && slow !== null) {
      macdHistory.push(fast - slow);
    }
  }

  if (macdHistory.length < signalPeriod) {
    return null;
  }

  // Calculate EMA of MACD line for signal
  const multiplier = 2 / (signalPeriod + 1);
  let signalLine = macdHistory[0];
  
  for (let i = 1; i < macdHistory.length; i++) {
    signalLine = (macdHistory[i] * multiplier) + (signalLine * (1 - multiplier));
  }

  const histogram = macdLine - signalLine;

  return {
    macd: macdLine,
    signal: signalLine,
    histogram
  };
}

/**
 * Create a MACD indicator
 */
export function macd(
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
  source: 'close' | 'open' | 'high' | 'low' = 'close'
): MACDIndicator {
  return new MACDIndicator({ fastPeriod, slowPeriod, signalPeriod, source });
}

/**
 * MACD Indicator class with chainable conditions
 */
export class MACDIndicator implements Indicator {
  constructor(private config: MACDConfig) {}

  calculate(prices: PriceData[]): IndicatorValue {
    const value = calculateMACD(
      prices,
      this.config.fastPeriod,
      this.config.slowPeriod,
      this.config.signalPeriod,
      this.config.source
    );
    return { value: value ? value.macd : null };
  }

  getMinPeriods(): number {
    return this.config.slowPeriod + this.config.signalPeriod;
  }

  /**
   * Condition: MACD line is above a threshold
   */
  above(threshold: number = 0): BaseCondition {
    return new MACDAboveCondition(this, threshold);
  }

  /**
   * Condition: MACD line is below a threshold
   */
  below(threshold: number = 0): BaseCondition {
    return new MACDBelowCondition(this, threshold);
  }

  /**
   * Condition: MACD line crosses above signal line
   */
  signalAbove(): BaseCondition {
    return new MACDSignalAboveCondition(this);
  }

  /**
   * Condition: MACD line crosses below signal line
   */
  signalBelow(): BaseCondition {
    return new MACDSignalBelowCondition(this);
  }

  /**
   * Condition: MACD line crosses above signal line (bullish crossover)
   */
  crossesAboveSignal(): BaseCondition {
    return new MACDCrossesAboveSignalCondition(this);
  }

  /**
   * Condition: MACD line crosses below signal line (bearish crossover)
   */
  crossesBelowSignal(): BaseCondition {
    return new MACDCrossesBelowSignalCondition(this);
  }

  /**
   * Condition: MACD histogram is positive
   */
  histogramPositive(): BaseCondition {
    return new MACDHistogramPositiveCondition(this);
  }

  /**
   * Condition: MACD histogram is negative
   */
  histogramNegative(): BaseCondition {
    return new MACDHistogramNegativeCondition(this);
  }

  /**
   * Get the current MACD values
   */
  getValue(prices: PriceData[]): MACDValue | null {
    return calculateMACD(
      prices,
      this.config.fastPeriod,
      this.config.slowPeriod,
      this.config.signalPeriod,
      this.config.source
    );
  }
}

/**
 * Condition: MACD line is above threshold
 */
class MACDAboveCondition extends BaseCondition {
  constructor(
    private indicator: MACDIndicator,
    private threshold: number
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    return value !== null && value.macd > this.threshold;
  }
}

/**
 * Condition: MACD line is below threshold
 */
class MACDBelowCondition extends BaseCondition {
  constructor(
    private indicator: MACDIndicator,
    private threshold: number
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    return value !== null && value.macd < this.threshold;
  }
}

/**
 * Condition: MACD line is above signal line
 */
class MACDSignalAboveCondition extends BaseCondition {
  constructor(private indicator: MACDIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    return value !== null && value.macd > value.signal;
  }
}

/**
 * Condition: MACD line is below signal line
 */
class MACDSignalBelowCondition extends BaseCondition {
  constructor(private indicator: MACDIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    return value !== null && value.macd < value.signal;
  }
}

/**
 * Condition: MACD line crosses above signal line
 */
class MACDCrossesAboveSignalCondition extends BaseCondition {
  constructor(private indicator: MACDIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const current = this.indicator.getValue(prices);
    const previous = this.indicator.getValue(prices.slice(0, -1));
    
    if (current === null || previous === null) return false;
    
    return previous.macd <= previous.signal && current.macd > current.signal;
  }
}

/**
 * Condition: MACD line crosses below signal line
 */
class MACDCrossesBelowSignalCondition extends BaseCondition {
  constructor(private indicator: MACDIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const current = this.indicator.getValue(prices);
    const previous = this.indicator.getValue(prices.slice(0, -1));
    
    if (current === null || previous === null) return false;
    
    return previous.macd >= previous.signal && current.macd < current.signal;
  }
}

/**
 * Condition: MACD histogram is positive
 */
class MACDHistogramPositiveCondition extends BaseCondition {
  constructor(private indicator: MACDIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    return value !== null && value.histogram > 0;
  }
}

/**
 * Condition: MACD histogram is negative
 */
class MACDHistogramNegativeCondition extends BaseCondition {
  constructor(private indicator: MACDIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    return value !== null && value.histogram < 0;
  }
}

