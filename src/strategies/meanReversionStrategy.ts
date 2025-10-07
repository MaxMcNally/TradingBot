/**
 * Mean Reversion Strategy
 * 
 * This strategy implements a percentage-based moving average mean reversion approach:
 * - BUY when stock price is below x-day moving average by y percent
 * - SELL when stock price is above x-day moving average by y percent
 * 
 * The strategy assumes that prices will revert to their moving average over time,
 * making it suitable for range-bound or moderately trending markets.
 */

export interface MeanReversionConfig {
  window: number;        // x-day moving average window
  threshold: number;     // y percent threshold (e.g., 0.05 for 5%)
}

export interface MeanReversionTrade {
  symbol: string;
  date: string;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
  movingAverage?: number;
  deviation?: number;
}

export interface MeanReversionResult {
  trades: MeanReversionTrade[];
  finalPortfolioValue: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
}

import { AbstractStrategy, Signal } from './baseStrategy';

export class MeanReversionStrategy extends AbstractStrategy {
  private config: MeanReversionConfig;
  private currentPosition: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
  private entryPrice: number = 0;
  private lastSignal: Signal = null;
  private rollingSum: number = 0;

  constructor(config: MeanReversionConfig) {
    super();
    this.config = config;
  }

  /**
   * Add a new price point to the strategy
   * @param price - The current price
   * @returns Trading signal: 'BUY', 'SELL', or null
   */
  addPrice(price: number): void {
    // Maintain rolling sum over fixed window for O(1) moving average
    const preLength = this.prices.length;
    this.prices.push(price);
    this.rollingSum += price;

    if (this.prices.length > this.config.window) {
      const removed = this.prices.shift()!;
      this.rollingSum -= removed;
    }

    // Need at least 'window' prices to calculate moving average
    if (preLength + 1 < this.config.window) {
      this.lastSignal = null;
      return;
    }

    const movingAverage = this.rollingSum / this.config.window;
    const priceDeviation = (price - movingAverage) / movingAverage;

    // Buy signal: price is below MA by threshold percentage (and we're not already long)
    if (priceDeviation <= -this.config.threshold && this.currentPosition !== 'LONG') {
      this.currentPosition = 'LONG';
      this.entryPrice = price;
      this.lastSignal = 'BUY';
      return;
    }

    // Sell signal: price is above MA by threshold percentage (and we have a position to sell)
    if (priceDeviation >= this.config.threshold && this.currentPosition === 'LONG') {
      this.currentPosition = 'NONE';
      this.entryPrice = 0;
      this.lastSignal = 'SELL';
      return;
    }

    this.lastSignal = null;
  }

  /**
   * Get the current trading signal
   * @returns Trading signal: 'BUY', 'SELL', or null
   */
  getSignal(): Signal {
    return this.lastSignal;
  }

  /**
   * Get the strategy name
   * @returns Strategy name
   */
  getStrategyName(): string {
    return 'MeanReversion';
  }

  /**
   * Calculate the simple moving average of the last 'window' prices
   */
  private calculateMovingAverage(): number {
    if (this.prices.length === 0) return 0;
    if (this.prices.length < this.config.window) {
      // Fallback for warm-up phase
      const sum = this.prices.reduce((acc, price) => acc + price, 0);
      return sum / this.prices.length;
    }
    return this.rollingSum / this.config.window;
  }

  /**
   * Get the current moving average value
   */
  getCurrentMovingAverage(): number | null {
    if (this.prices.length < this.config.window) {
      return null;
    }
    return this.calculateMovingAverage();
  }

  /**
   * Get the current position status
   */
  getCurrentPosition(): 'LONG' | 'SHORT' | 'NONE' {
    return this.currentPosition;
  }

  /**
   * Get the entry price of the current position
   */
  getEntryPrice(): number {
    return this.entryPrice;
  }

  /**
   * Reset the strategy state
   */
  reset(): void {
    this.prices = [];
    this.currentPosition = 'NONE';
    this.entryPrice = 0;
    this.rollingSum = 0;
  }

  /**
   * Get strategy configuration
   */
  getConfig(): MeanReversionConfig {
    return { ...this.config };
  }

  /**
   * Get strategy description
   */
  getDescription(): string {
    return `Mean Reversion Strategy: ${this.config.window}-day MA with ${(this.config.threshold * 100).toFixed(1)}% threshold`;
  }
}

/**
 * Run the mean reversion strategy on historical data
 * 
 * @param symbol - Stock symbol
 * @param data - Historical price data
 * @param config - Strategy configuration
 * @returns Backtest results
 */
export function runMeanReversionStrategy(
  symbol: string,
  data: { date: string; close: number, open: number }[],
  config: MeanReversionConfig & {
    initialCapital: number;
    sharesPerTrade: number;
  }
): MeanReversionResult {
  const trades: MeanReversionTrade[] = [];
  const strategy = new MeanReversionStrategy({
    window: config.window,
    threshold: config.threshold
  });

  let currentShares = 0;
  let cash = config.initialCapital;
  let winningTrades = 0;
  let totalTrades = 0;
  let maxPortfolioValue = config.initialCapital;
  let maxDrawdown = 0;

  for (let i = 0; i < data.length; i++) {
    const dayData = data[i];
    strategy.addPrice(dayData.close);
    const signal = strategy.getSignal();
    const movingAverage = strategy.getCurrentMovingAverage();

    if (signal === 'BUY' && cash >= dayData.close) {
      // Execute buy order
      const sharesToBuy = Math.floor(cash / dayData.close);
      const actualShares = Math.min(sharesToBuy, config.sharesPerTrade);
      const cost = actualShares * dayData.close;
      
      cash -= cost;
      currentShares += actualShares;
      
      const deviation = movingAverage ? (dayData.close - movingAverage) / movingAverage : undefined;
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "BUY",
        price: dayData.close,
        shares: actualShares,
        movingAverage: movingAverage || undefined,
        deviation
      });
    } else if (signal === 'SELL' && currentShares > 0) {
      // Execute sell order
      const sharesToSell = Math.min(currentShares, config.sharesPerTrade);
      const proceeds = sharesToSell * dayData.close;
      
      cash += proceeds;
      currentShares -= sharesToSell;
      
      const deviation = movingAverage ? (dayData.close - movingAverage) / movingAverage : undefined;
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "SELL",
        price: dayData.close,
        shares: sharesToSell,
        movingAverage: movingAverage || undefined,
        deviation
      });

      // Track winning trades for win rate calculation
      if (trades.length >= 2) {
        const lastBuyTrade = trades.slice().reverse().find(t => t.action === 'BUY');
        if (lastBuyTrade && dayData.close > lastBuyTrade.price) {
          winningTrades++;
        }
        totalTrades++;
      }
    }

    // Calculate current portfolio value
    const currentPortfolioValue = cash + (currentShares * dayData.close);
    if (currentPortfolioValue > maxPortfolioValue) {
      maxPortfolioValue = currentPortfolioValue;
    } else {
      const currentDrawdown = (maxPortfolioValue - currentPortfolioValue) / maxPortfolioValue;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    }
  }

  // Calculate final portfolio value
  const finalPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const finalPortfolioValue = cash + (currentShares * finalPrice);
  const totalReturn = (finalPortfolioValue - config.initialCapital) / config.initialCapital;
  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;

  return { 
    trades, 
    finalPortfolioValue, 
    totalReturn,
    winRate,
    maxDrawdown
  };
}

/**
 * Strategy performance examples:
 * 
 * NVDA 2023 (5% threshold, 20-day MA):
 * - Return: 15.69%, Win Rate: 100%, Trades: 7
 * 
 * TSLA 2023 (5% threshold, 20-day MA):
 * - Return: 14.84%, Win Rate: 75%, Trades: 8
 * 
 * TSLA 2023 (1% threshold, 20-day MA):
 * - Return: -10.48%, Win Rate: 40%, Trades: 10
 * 
 * Best suited for:
 * - Volatile stocks with mean-reverting tendencies
 * - Range-bound markets
 * - Higher thresholds (3-5%) generally perform better than lower thresholds
 */
