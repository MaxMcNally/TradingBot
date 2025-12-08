/**
 * Bollinger Bands Indicator
 * 
 * Consists of:
 * - Middle Band: SMA (Simple Moving Average)
 * - Upper Band: SMA + (Standard Deviation × Multiplier)
 * - Lower Band: SMA - (Standard Deviation × Multiplier)
 */

import { BaseCondition } from './base';
import { Indicator, PriceData, IndicatorValue } from './types';

export interface BollingerBandsConfig {
  period: number;
  multiplier: number;
  source?: 'close' | 'open' | 'high' | 'low';
}

export interface BollingerBandsValue {
  upper: number;
  middle: number;
  lower: number;
}

/**
 * Calculate SMA
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
 * Calculate standard deviation
 */
function calculateStdDev(
  prices: PriceData[],
  period: number,
  source: 'close' | 'open' | 'high' | 'low' = 'close'
): number | null {
  if (prices.length < period) {
    return null;
  }

  const sma = calculateSMA(prices, period, source);
  if (sma === null) return null;

  const relevantPrices = prices.slice(-period);
  const variance = relevantPrices.reduce((acc, price) => {
    const diff = price[source] - sma;
    return acc + (diff * diff);
  }, 0) / period;

  return Math.sqrt(variance);
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(
  prices: PriceData[],
  period: number,
  multiplier: number,
  source: 'close' | 'open' | 'high' | 'low' = 'close'
): BollingerBandsValue | null {
  if (prices.length < period) {
    return null;
  }

  const middle = calculateSMA(prices, period, source);
  const stdDev = calculateStdDev(prices, period, source);

  if (middle === null || stdDev === null) {
    return null;
  }

  return {
    upper: middle + (stdDev * multiplier),
    middle,
    lower: middle - (stdDev * multiplier)
  };
}

/**
 * Create a Bollinger Bands indicator
 */
export function bollingerBands(
  period: number = 20,
  multiplier: number = 2.0,
  source: 'close' | 'open' | 'high' | 'low' = 'close'
): BollingerBandsIndicator {
  return new BollingerBandsIndicator({ period, multiplier, source });
}

/**
 * Bollinger Bands Indicator class with chainable conditions
 */
export class BollingerBandsIndicator implements Indicator {
  constructor(private config: BollingerBandsConfig) {}

  calculate(prices: PriceData[]): IndicatorValue {
    const value = calculateBollingerBands(
      prices,
      this.config.period,
      this.config.multiplier,
      this.config.source
    );
    return { value: value ? value.middle : null };
  }

  getMinPeriods(): number {
    return this.config.period;
  }

  /**
   * Condition: Price touches or goes below lower band (oversold)
   */
  priceBelowLower(): BaseCondition {
    return new BBPriceBelowLowerCondition(this);
  }

  /**
   * Condition: Price touches or goes above upper band (overbought)
   */
  priceAboveUpper(): BaseCondition {
    return new BBPriceAboveUpperCondition(this);
  }

  /**
   * Condition: Price is between middle and upper band
   */
  priceBetweenMiddleAndUpper(): BaseCondition {
    return new BBPriceBetweenMiddleAndUpperCondition(this);
  }

  /**
   * Condition: Price is between middle and lower band
   */
  priceBetweenMiddleAndLower(): BaseCondition {
    return new BBPriceBetweenMiddleAndLowerCondition(this);
  }

  /**
   * Condition: Price crosses above middle band
   */
  priceCrossesAboveMiddle(): BaseCondition {
    return new BBPriceCrossesAboveMiddleCondition(this);
  }

  /**
   * Condition: Price crosses below middle band
   */
  priceCrossesBelowMiddle(): BaseCondition {
    return new BBPriceCrossesBelowMiddleCondition(this);
  }

  /**
   * Condition: Bands are expanding (increasing volatility)
   */
  bandsExpanding(): BaseCondition {
    return new BBBandsExpandingCondition(this);
  }

  /**
   * Condition: Bands are contracting (decreasing volatility)
   */
  bandsContracting(): BaseCondition {
    return new BBBandsContractingCondition(this);
  }

  /**
   * Get the current Bollinger Bands values
   */
  getValue(prices: PriceData[]): BollingerBandsValue | null {
    return calculateBollingerBands(
      prices,
      this.config.period,
      this.config.multiplier,
      this.config.source
    );
  }

  /**
   * Get the source field for price calculations
   */
  getSource(): 'close' | 'open' | 'high' | 'low' {
    return this.config.source || 'close';
  }
}

/**
 * Condition: Price is below lower band
 */
class BBPriceBelowLowerCondition extends BaseCondition {
  constructor(private indicator: BollingerBandsIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length === 0) return false;
    const bands = this.indicator.getValue(prices);
    const currentPrice = prices[prices.length - 1][this.indicator.getSource()];
    return bands !== null && currentPrice <= bands.lower;
  }
}

/**
 * Condition: Price is above upper band
 */
class BBPriceAboveUpperCondition extends BaseCondition {
  constructor(private indicator: BollingerBandsIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length === 0) return false;
    const bands = this.indicator.getValue(prices);
    const currentPrice = prices[prices.length - 1][this.indicator.getSource()];
    return bands !== null && currentPrice >= bands.upper;
  }
}

/**
 * Condition: Price is between middle and upper band
 */
class BBPriceBetweenMiddleAndUpperCondition extends BaseCondition {
  constructor(private indicator: BollingerBandsIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length === 0) return false;
    const bands = this.indicator.getValue(prices);
    const currentPrice = prices[prices.length - 1][this.indicator.getSource()];
    return bands !== null && currentPrice > bands.middle && currentPrice < bands.upper;
  }
}

/**
 * Condition: Price is between middle and lower band
 */
class BBPriceBetweenMiddleAndLowerCondition extends BaseCondition {
  constructor(private indicator: BollingerBandsIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length === 0) return false;
    const bands = this.indicator.getValue(prices);
    const currentPrice = prices[prices.length - 1][this.indicator.getSource()];
    return bands !== null && currentPrice < bands.middle && currentPrice > bands.lower;
  }
}

/**
 * Condition: Price crosses above middle band
 */
class BBPriceCrossesAboveMiddleCondition extends BaseCondition {
  constructor(private indicator: BollingerBandsIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const currentBands = this.indicator.getValue(prices);
    const previousBands = this.indicator.getValue(prices.slice(0, -1));
    
    if (currentBands === null || previousBands === null) return false;
    
    const source = this.indicator.getSource();
    const currentPrice = prices[prices.length - 1][source];
    const previousPrice = prices[prices.length - 2][source];
    
    return previousPrice <= previousBands.middle && currentPrice > currentBands.middle;
  }
}

/**
 * Condition: Price crosses below middle band
 */
class BBPriceCrossesBelowMiddleCondition extends BaseCondition {
  constructor(private indicator: BollingerBandsIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const currentBands = this.indicator.getValue(prices);
    const previousBands = this.indicator.getValue(prices.slice(0, -1));
    
    if (currentBands === null || previousBands === null) return false;
    
    const source = this.indicator.getSource();
    const currentPrice = prices[prices.length - 1][source];
    const previousPrice = prices[prices.length - 2][source];
    
    return previousPrice >= previousBands.middle && currentPrice < currentBands.middle;
  }
}

/**
 * Condition: Bands are expanding
 */
class BBBandsExpandingCondition extends BaseCondition {
  constructor(private indicator: BollingerBandsIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const currentBands = this.indicator.getValue(prices);
    const previousBands = this.indicator.getValue(prices.slice(0, -1));
    
    if (currentBands === null || previousBands === null) return false;
    
    const currentWidth = currentBands.upper - currentBands.lower;
    const previousWidth = previousBands.upper - previousBands.lower;
    
    return currentWidth > previousWidth;
  }
}

/**
 * Condition: Bands are contracting
 */
class BBBandsContractingCondition extends BaseCondition {
  constructor(private indicator: BollingerBandsIndicator) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    if (prices.length < 2) return false;
    
    const currentBands = this.indicator.getValue(prices);
    const previousBands = this.indicator.getValue(prices.slice(0, -1));
    
    if (currentBands === null || previousBands === null) return false;
    
    const currentWidth = currentBands.upper - currentBands.lower;
    const previousWidth = previousBands.upper - previousBands.lower;
    
    return currentWidth < previousWidth;
  }
}

