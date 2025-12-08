/**
 * Relative Strength Index (RSI) Indicator
 * 
 * Measures the speed and magnitude of price changes to identify
 * overbought (above 70) and oversold (below 30) conditions.
 */

import { BaseCondition } from './base';
import { Indicator, PriceData, IndicatorValue } from './types';

export interface RSIConfig {
  period: number;
  source?: 'close' | 'open' | 'high' | 'low';
}

/**
 * Calculate RSI for a given period using Wilder's smoothing method
 */
function calculateRSI(
  prices: PriceData[],
  period: number,
  source: 'close' | 'open' | 'high' | 'low' = 'close'
): number | null {
  if (prices.length < period + 1) {
    return null;
  }

  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i][source] - prices[i - 1][source];
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Apply Wilder's smoothing for remaining periods
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i][source] - prices[i - 1][source];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }

  if (avgLoss === 0) {
    return 100; // Avoid division by zero
  }

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Create an RSI indicator
 */
export function rsi(period: number = 14, source: 'close' | 'open' | 'high' | 'low' = 'close'): RSIIndicator {
  return new RSIIndicator({ period, source });
}

/**
 * RSI Indicator class with chainable conditions
 */
export class RSIIndicator implements Indicator {
  constructor(private config: RSIConfig) {}

  calculate(prices: PriceData[]): IndicatorValue {
    const value = calculateRSI(prices, this.config.period, this.config.source);
    return { value };
  }

  getMinPeriods(): number {
    return this.config.period + 1;
  }

  /**
   * Condition: RSI is above a threshold value (overbought)
   */
  above(threshold: number): BaseCondition {
    return new RSIAboveCondition(this, threshold);
  }

  /**
   * Condition: RSI is below a threshold value (oversold)
   */
  below(threshold: number): BaseCondition {
    return new RSIBelowCondition(this, threshold);
  }

  /**
   * Condition: RSI is overbought (above 70 by default)
   */
  overbought(threshold: number = 70): BaseCondition {
    return new RSIAboveCondition(this, threshold);
  }

  /**
   * Condition: RSI is oversold (below 30 by default)
   */
  oversold(threshold: number = 30): BaseCondition {
    return new RSIBelowCondition(this, threshold);
  }

  /**
   * Condition: RSI crosses above a threshold
   */
  crossesAbove(threshold: number): BaseCondition {
    return new RSICrossesAboveCondition(this, threshold);
  }

  /**
   * Condition: RSI crosses below a threshold
   */
  crossesBelow(threshold: number): BaseCondition {
    return new RSICrossesBelowCondition(this, threshold);
  }

  /**
   * Get the current RSI value
   */
  getValue(prices: PriceData[]): number | null {
    return calculateRSI(prices, this.config.period, this.config.source);
  }
}

/**
 * Condition: RSI is above threshold
 */
class RSIAboveCondition extends BaseCondition {
  constructor(
    private indicator: RSIIndicator,
    private threshold: number
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    return value !== null && value > this.threshold;
  }
}

/**
 * Condition: RSI is below threshold
 */
class RSIBelowCondition extends BaseCondition {
  constructor(
    private indicator: RSIIndicator,
    private threshold: number
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    return value !== null && value < this.threshold;
  }
}

/**
 * Condition: RSI crosses above threshold
 */
class RSICrossesAboveCondition extends BaseCondition {
  constructor(
    private indicator: RSIIndicator,
    private threshold: number
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const current = this.indicator.getValue(prices);
    const previous = this.indicator.getValue(prices.slice(0, -1));
    
    return current !== null && previous !== null && previous <= this.threshold && current > this.threshold;
  }
}

/**
 * Condition: RSI crosses below threshold
 */
class RSICrossesBelowCondition extends BaseCondition {
  constructor(
    private indicator: RSIIndicator,
    private threshold: number
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const current = this.indicator.getValue(prices);
    const previous = this.indicator.getValue(prices.slice(0, -1));
    
    return current !== null && previous !== null && previous >= this.threshold && current < this.threshold;
  }
}

