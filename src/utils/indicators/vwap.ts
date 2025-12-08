/**
 * VWAP (Volume Weighted Average Price) Indicator
 * 
 * Calculates the average price weighted by volume over a specified period.
 * Typically calculated for a single trading day, but can be calculated
 * over any period.
 */

import { BaseCondition } from './base';
import { Indicator, PriceData, IndicatorValue } from './types';

export interface VWAPConfig {
  period?: number; // Optional: if not provided, calculates from start of data
}

/**
 * Calculate VWAP for a given period
 * If period is not specified, calculates from the beginning of the data
 */
function calculateVWAP(
  prices: PriceData[],
  period?: number
): number | null {
  if (prices.length === 0) {
    return null;
  }

  const relevantPrices = period 
    ? prices.slice(-period)
    : prices;

  if (relevantPrices.length === 0) {
    return null;
  }

  // VWAP = Sum(Price * Volume) / Sum(Volume)
  let totalPriceVolume = 0;
  let totalVolume = 0;

  for (const price of relevantPrices) {
    // Use typical price (high + low + close) / 3 for VWAP calculation
    const typicalPrice = (price.high + price.low + price.close) / 3;
    totalPriceVolume += typicalPrice * price.volume;
    totalVolume += price.volume;
  }

  if (totalVolume === 0) {
    return null;
  }

  return totalPriceVolume / totalVolume;
}

/**
 * Create a VWAP indicator
 */
export function vwap(period?: number): VWAPIndicator {
  return new VWAPIndicator({ period });
}

/**
 * VWAP Indicator class with chainable conditions
 */
export class VWAPIndicator implements Indicator {
  constructor(private config: VWAPConfig) {}

  calculate(prices: PriceData[]): IndicatorValue {
    const value = calculateVWAP(prices, this.config.period);
    return { value };
  }

  getMinPeriods(): number {
    return this.config.period || 1;
  }

  /**
   * Condition: Current price is above VWAP
   */
  priceAbove(): BaseCondition {
    return new VWAPPriceAboveCondition(this);
  }

  /**
   * Condition: Current price is below VWAP
   */
  priceBelow(): BaseCondition {
    return new VWAPPriceBelowCondition(this);
  }

  /**
   * Condition: Price crosses above VWAP
   */
  priceCrossesAbove(): BaseCondition {
    return new VWAPPriceCrossesAboveCondition(this);
  }

  /**
   * Condition: Price crosses below VWAP
   */
  priceCrossesBelow(): BaseCondition {
    return new VWAPPriceCrossesBelowCondition(this);
  }

  /**
   * Condition: VWAP is above a threshold
   */
  above(threshold: number): BaseCondition {
    return new VWAPAboveCondition(this, threshold);
  }

  /**
   * Condition: VWAP is below a threshold
   */
  below(threshold: number): BaseCondition {
    return new VWAPBelowCondition(this, threshold);
  }

  /**
   * Get the current VWAP value
   */
  getValue(prices: PriceData[]): number | null {
    return calculateVWAP(prices, this.config.period);
  }
}

/**
 * Condition: Price is above VWAP
 */
class VWAPPriceAboveCondition extends BaseCondition {
  constructor(private indicator: VWAPIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length === 0) return false;
    const vwapValue = this.indicator.getValue(prices);
    const currentPrice = prices[prices.length - 1].close;
    return vwapValue !== null && currentPrice > vwapValue;
  }
}

/**
 * Condition: Price is below VWAP
 */
class VWAPPriceBelowCondition extends BaseCondition {
  constructor(private indicator: VWAPIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length === 0) return false;
    const vwapValue = this.indicator.getValue(prices);
    const currentPrice = prices[prices.length - 1].close;
    return vwapValue !== null && currentPrice < vwapValue;
  }
}

/**
 * Condition: Price crosses above VWAP
 */
class VWAPPriceCrossesAboveCondition extends BaseCondition {
  constructor(private indicator: VWAPIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const currentVWAP = this.indicator.getValue(prices);
    const previousVWAP = this.indicator.getValue(prices.slice(0, -1));
    
    if (currentVWAP === null || previousVWAP === null) return false;
    
    const currentPrice = prices[prices.length - 1].close;
    const previousPrice = prices[prices.length - 2].close;
    
    return previousPrice <= previousVWAP && currentPrice > currentVWAP;
  }
}

/**
 * Condition: Price crosses below VWAP
 */
class VWAPPriceCrossesBelowCondition extends BaseCondition {
  constructor(private indicator: VWAPIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const currentVWAP = this.indicator.getValue(prices);
    const previousVWAP = this.indicator.getValue(prices.slice(0, -1));
    
    if (currentVWAP === null || previousVWAP === null) return false;
    
    const currentPrice = prices[prices.length - 1].close;
    const previousPrice = prices[prices.length - 2].close;
    
    return previousPrice >= previousVWAP && currentPrice < currentVWAP;
  }
}

/**
 * Condition: VWAP is above threshold
 */
class VWAPAboveCondition extends BaseCondition {
  constructor(
    private indicator: VWAPIndicator,
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
 * Condition: VWAP is below threshold
 */
class VWAPBelowCondition extends BaseCondition {
  constructor(
    private indicator: VWAPIndicator,
    private threshold: number
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    const value = this.indicator.getValue(prices);
    return value !== null && value < this.threshold;
  }
}

