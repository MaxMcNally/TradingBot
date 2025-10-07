/**
 * Base Strategy Interface
 * 
 * This file defines the common interface that all trading strategies must implement
 * for use in the live trading bot.
 */

export type Signal = 'BUY' | 'SELL' | null;

import { NewsArticle } from '../dataProviders/baseProvider';

export interface BaseStrategy {
  /**
   * Add a new price point to the strategy
   * @param price - The current price
   */
  addPrice(price: number): void;

  /**
   * Get the current trading signal
   * @returns Trading signal: 'BUY', 'SELL', or null
   */
  getSignal(): Signal;

  /**
   * Get the strategy name
   * @returns Strategy name
   */
  getStrategyName(): string;

  /**
   * Reset the strategy state
   */
  reset(): void;

  /**
   * Optional: Ingest recent news articles for sentiment-driven strategies
   */
  addNews?(articles: NewsArticle[]): void;
}

export abstract class AbstractStrategy implements BaseStrategy {
  protected prices: number[] = [];

  abstract addPrice(price: number): void;
  abstract getSignal(): Signal;
  abstract getStrategyName(): string;

  reset(): void {
    this.prices = [];
  }

  protected addPriceToHistory(price: number, maxHistory: number = 100): void {
    this.prices.push(price);
    if (this.prices.length > maxHistory) {
      this.prices.shift();
    }
  }

  protected getAverage(prices: number[]): number {
    if (prices.length === 0) return 0;
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }

  // Default no-op for strategies that don't use news
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addNews(_articles: NewsArticle[]): void {
    // no-op by default - articles parameter is intentionally unused
  }
}
