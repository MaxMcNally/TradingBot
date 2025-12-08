/**
 * Exponential Moving Average (EMA) Indicator
 * 
 * Calculates the exponentially weighted average price over a specified period.
 * EMA gives more weight to recent prices.
 */

import { BaseCondition } from './base';
import { Indicator, PriceData, IndicatorValue } from './types';
import { SMAIndicator } from './sma';

export interface EMAConfig {
  period: number;
  source?: 'close' | 'open' | 'high' | 'low';
}

/**
 * Calculate EMA for a given period
 */
function calculateEMA(
  prices: PriceData[],
  period: number,
  source: 'close' | 'open' | 'high' | 'low' = 'close'
): number | null {
  if (prices.length < period) {
    return null;
  }

  const multiplier = 2 / (period + 1);
  const relevantPrices = prices.slice(-period);
  
  // Start with SMA for the first value
  let ema = relevantPrices[0][source];
  
  // Calculate EMA using the formula: EMA = (Price - EMA_prev) * multiplier + EMA_prev
  for (let i = 1; i < relevantPrices.length; i++) {
    ema = (relevantPrices[i][source] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

/**
 * Create an EMA indicator
 */
export function ema(period: number, source: 'close' | 'open' | 'high' | 'low' = 'close'): EMAIndicator {
  return new EMAIndicator({ period, source });
}

/**
 * EMA Indicator class with chainable conditions
 */
export class EMAIndicator implements Indicator {
  constructor(private config: EMAConfig) {}

  calculate(prices: PriceData[]): IndicatorValue {
    const value = calculateEMA(prices, this.config.period, this.config.source);
    return { value };
  }

  getMinPeriods(): number {
    return this.config.period;
  }

  /**
   * Condition: EMA is above a threshold value
   */
  above(threshold: number): BaseCondition {
    return new EMAAboveCondition(this, threshold);
  }

  /**
   * Condition: EMA is below a threshold value
   */
  below(threshold: number): BaseCondition {
    return new EMABelowCondition(this, threshold);
  }

  /**
   * Condition: EMA crosses above another EMA or threshold
   */
  crossesAbove(other: EMAIndicator | SMAIndicator | number): BaseCondition {
    return new EMACrossesAboveCondition(this, other);
  }

  /**
   * Condition: EMA crosses below another EMA or threshold
   */
  crossesBelow(other: EMAIndicator | SMAIndicator | number): BaseCondition {
    return new EMACrossesBelowCondition(this, other);
  }

  /**
   * Condition: EMA is above another EMA
   */
  aboveIndicator(other: EMAIndicator | SMAIndicator): BaseCondition {
    return new EMAAboveIndicatorCondition(this, other);
  }

  /**
   * Condition: EMA is below another EMA
   */
  belowIndicator(other: EMAIndicator | SMAIndicator): BaseCondition {
    return new EMABelowIndicatorCondition(this, other);
  }

  /**
   * Get the current EMA value
   */
  getValue(prices: PriceData[]): number | null {
    return calculateEMA(prices, this.config.period, this.config.source);
  }
}

/**
 * Condition: EMA is above threshold
 */
class EMAAboveCondition extends BaseCondition {
  constructor(
    private indicator: EMAIndicator,
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
 * Condition: EMA is below threshold
 */
class EMABelowCondition extends BaseCondition {
  constructor(
    private indicator: EMAIndicator,
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
 * Condition: EMA crosses above another indicator or threshold
 */
class EMACrossesAboveCondition extends BaseCondition {
  constructor(
    private indicator: EMAIndicator,
    private other: EMAIndicator | SMAIndicator | number
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const current = this.indicator.getValue(prices);
    const previous = this.indicator.getValue(prices.slice(0, -1));
    
    if (current === null || previous === null) return false;

    let otherCurrent: number | null;
    let otherPrevious: number | null;

    if (typeof this.other === 'number') {
      otherCurrent = this.other;
      otherPrevious = this.other;
    } else {
      otherCurrent = this.other.getValue(prices);
      otherPrevious = this.other.getValue(prices.slice(0, -1));
    }

    if (otherCurrent === null || otherPrevious === null) return false;

    return previous <= otherPrevious && current > otherCurrent;
  }
}

/**
 * Condition: EMA crosses below another indicator or threshold
 */
class EMACrossesBelowCondition extends BaseCondition {
  constructor(
    private indicator: EMAIndicator,
    private other: EMAIndicator | SMAIndicator | number
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const current = this.indicator.getValue(prices);
    const previous = this.indicator.getValue(prices.slice(0, -1));
    
    if (current === null || previous === null) return false;

    let otherCurrent: number | null;
    let otherPrevious: number | null;

    if (typeof this.other === 'number') {
      otherCurrent = this.other;
      otherPrevious = this.other;
    } else {
      otherCurrent = this.other.getValue(prices);
      otherPrevious = this.other.getValue(prices.slice(0, -1));
    }

    if (otherCurrent === null || otherPrevious === null) return false;

    return previous >= otherPrevious && current < otherCurrent;
  }
}

/**
 * Condition: EMA is above another indicator
 */
class EMAAboveIndicatorCondition extends BaseCondition {
  constructor(
    private indicator: EMAIndicator,
    private other: EMAIndicator | SMAIndicator
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    const otherValue = this.other.getValue(prices);
    return value !== null && otherValue !== null && value > otherValue;
  }
}

/**
 * Condition: EMA is below another indicator
 */
class EMABelowIndicatorCondition extends BaseCondition {
  constructor(
    private indicator: EMAIndicator,
    private other: EMAIndicator | SMAIndicator
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    const otherValue = this.other.getValue(prices);
    return value !== null && otherValue !== null && value < otherValue;
  }
}

