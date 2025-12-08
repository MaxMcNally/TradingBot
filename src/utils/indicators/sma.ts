/**
 * Simple Moving Average (SMA) Indicator
 * 
 * Calculates the average price over a specified period.
 */

import { BaseCondition } from './base';
import { Indicator, PriceData, IndicatorValue } from './types';

export interface SMAConfig {
  period: number;
  source?: 'close' | 'open' | 'high' | 'low';
}

/**
 * Calculate SMA for a given period
 */
function calculateSMA(
  prices: PriceData[],
  period: number,
  source: 'close' | 'open' | 'high' | 'low' = 'close'
): number | null {
  if (prices.length < period) {
    return null;
  }

  const relevantPrices = prices.slice(-period);
  const sum = relevantPrices.reduce((acc, price) => acc + price[source], 0);
  return sum / period;
}

/**
 * Create an SMA indicator
 */
export function sma(period: number, source: 'close' | 'open' | 'high' | 'low' = 'close'): SMAIndicator {
  return new SMAIndicator({ period, source });
}

/**
 * SMA Indicator class with chainable conditions
 */
export class SMAIndicator implements Indicator {
  constructor(private config: SMAConfig) {}

  calculate(prices: PriceData[]): IndicatorValue {
    const value = calculateSMA(prices, this.config.period, this.config.source);
    return { value };
  }

  getMinPeriods(): number {
    return this.config.period;
  }

  /**
   * Condition: SMA is above a threshold value
   */
  above(threshold: number): BaseCondition {
    return new SMAAboveCondition(this, threshold);
  }

  /**
   * Condition: SMA is below a threshold value
   */
  below(threshold: number): BaseCondition {
    return new SMABelowCondition(this, threshold);
  }

  /**
   * Condition: SMA crosses above another SMA or threshold
   */
  crossesAbove(other: SMAIndicator | number): BaseCondition {
    return new SMACrossesAboveCondition(this, other);
  }

  /**
   * Condition: SMA crosses below another SMA or threshold
   */
  crossesBelow(other: SMAIndicator | number): BaseCondition {
    return new SMACrossesBelowCondition(this, other);
  }

  /**
   * Condition: SMA is above another SMA
   */
  aboveIndicator(other: SMAIndicator): BaseCondition {
    return new SMAAboveIndicatorCondition(this, other);
  }

  /**
   * Condition: SMA is below another SMA
   */
  belowIndicator(other: SMAIndicator): BaseCondition {
    return new SMABelowIndicatorCondition(this, other);
  }

  /**
   * Get the current SMA value
   */
  getValue(prices: PriceData[]): number | null {
    return calculateSMA(prices, this.config.period, this.config.source);
  }
}

/**
 * Condition: SMA is above threshold
 */
class SMAAboveCondition extends BaseCondition {
  constructor(
    private indicator: SMAIndicator,
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
 * Condition: SMA is below threshold
 */
class SMABelowCondition extends BaseCondition {
  constructor(
    private indicator: SMAIndicator,
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
 * Condition: SMA crosses above another SMA or threshold
 */
class SMACrossesAboveCondition extends BaseCondition {
  constructor(
    private indicator: SMAIndicator,
    private other: SMAIndicator | number
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
 * Condition: SMA crosses below another SMA or threshold
 */
class SMACrossesBelowCondition extends BaseCondition {
  constructor(
    private indicator: SMAIndicator,
    private other: SMAIndicator | number
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
 * Condition: SMA is above another SMA
 */
class SMAAboveIndicatorCondition extends BaseCondition {
  constructor(
    private indicator: SMAIndicator,
    private other: SMAIndicator
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
 * Condition: SMA is below another SMA
 */
class SMABelowIndicatorCondition extends BaseCondition {
  constructor(
    private indicator: SMAIndicator,
    private other: SMAIndicator
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    const otherValue = this.other.getValue(prices);
    return value !== null && otherValue !== null && value < otherValue;
  }
}

