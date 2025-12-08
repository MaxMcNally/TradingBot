/**
 * Base types for chainable technical indicators
 * 
 * These types support building custom trading algorithms by chaining
 * indicator conditions together to generate buy/sell signals.
 */

export type Signal = 'BUY' | 'SELL' | null;

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValue {
  value: number | null;
  timestamp?: number;
}

/**
 * Base interface for all indicators
 */
export interface Indicator {
  /**
   * Calculate the indicator value for the given price data
   * @param prices - Array of price data points
   * @returns The calculated indicator value(s)
   */
  calculate(prices: PriceData[]): IndicatorValue | IndicatorValue[];

  /**
   * Get the minimum number of data points required for calculation
   */
  getMinPeriods(): number;
}

/**
 * Condition interface for chaining indicator conditions
 */
export interface Condition {
  /**
   * Evaluate the condition against price data
   * @param prices - Array of price data points
   * @returns true if condition is met, false otherwise
   */
  evaluate(prices: PriceData[]): boolean;

  /**
   * Combine with another condition using AND logic
   */
  and(other: Condition): Condition;

  /**
   * Combine with another condition using OR logic
   */
  or(other: Condition): Condition;

  /**
   * Negate the condition
   */
  not(): Condition;
}

/**
 * Signal generator that combines conditions to produce trading signals
 */
export interface SignalGenerator {
  /**
   * Generate a trading signal based on the conditions
   * @param prices - Array of price data points
   * @returns 'BUY', 'SELL', or null
   */
  generateSignal(prices: PriceData[]): Signal;
}

