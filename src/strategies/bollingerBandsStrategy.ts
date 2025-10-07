/**
 * Bollinger Bands Strategy
 * 
 * This strategy implements a mean reversion approach using Bollinger Bands:
 * - BUY when price touches or goes below the lower band (oversold)
 * - SELL when price touches or goes above the upper band (overbought)
 * 
 * Bollinger Bands consist of:
 * - Middle Band: Simple Moving Average (SMA)
 * - Upper Band: SMA + (Standard Deviation × Multiplier)
 * - Lower Band: SMA - (Standard Deviation × Multiplier)
 * 
 * The strategy works well in ranging markets and assumes price will revert to the mean.
 */

export interface BollingerBandsConfig {
  window: number;        // SMA window (typically 20)
  multiplier: number;    // Standard deviation multiplier (typically 2.0)
  maType: 'SMA' | 'EMA'; // Type of moving average for middle band
}

export interface BollingerBandsTrade {
  symbol: string;
  date: string;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
  upperBand?: number;
  middleBand?: number;
  lowerBand?: number;
  bandPosition?: number; // Position within bands (0 = lower, 1 = upper)
}

export interface BollingerBandsResult {
  trades: BollingerBandsTrade[];
  finalPortfolioValue: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
}

import { AbstractStrategy, Signal } from './baseStrategy';

export class BollingerBandsStrategy extends AbstractStrategy {
  private config: BollingerBandsConfig;
  private currentPosition: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
  private entryPrice: number = 0;
  private lastSignal: Signal = null;
  private rollingMean: number | null = null;
  private rollingM2: number = 0; // For Welford variance

  constructor(config: BollingerBandsConfig) {
    super();
    this.config = config;
  }

  /**
   * Add a new price point to the strategy
   * @param price - The current price
   * @returns Trading signal: 'BUY', 'SELL', or null
   */
  addPrice(price: number): void {
    // Maintain rolling mean and variance with Welford; keep window size = config.window
    this.prices.push(price);
    if (this.prices.length > this.config.window) {
      this.prices.shift();
      // Reset rolling stats if full recompute is easier than complex removal handling
      // (Simpler and still O(window) only on boundary; acceptable in practice)
      this.recomputeRollingStats();
    } else {
      this.updateRollingStats(price);
    }

    // Need at least 'window' prices to calculate Bollinger Bands
    if (this.prices.length < this.config.window) {
      this.lastSignal = null;
      return;
    }

    const bands = this.calculateBollingerBands();
    const { upperBand, middleBand, lowerBand } = bands;

    // Buy signal: price touches or goes below lower band (and we're not already long)
    if (price <= lowerBand && this.currentPosition !== 'LONG') {
      this.currentPosition = 'LONG';
      this.entryPrice = price;
      this.lastSignal = 'BUY';
      return;
    }

    // Sell signal: price touches or goes above upper band (and we have a position to sell)
    if (price >= upperBand && this.currentPosition === 'LONG') {
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
    return 'BollingerBands';
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(): { upperBand: number; middleBand: number; lowerBand: number } {
    const n = this.config.window;
    let middleBand: number;
    if (this.config.maType === 'SMA') {
      // Use rolling mean if available, else compute
      middleBand = this.rollingMean ?? (this.prices.reduce((s, v) => s + v, 0) / Math.min(this.prices.length, n));
    } else {
      // EMA calculation using last n samples
      const relevantPrices = this.prices.slice(-n);
      const multiplier = 2 / (n + 1);
      let ema = relevantPrices[0];
      for (let i = 1; i < relevantPrices.length; i++) {
        ema = (relevantPrices[i] * multiplier) + (ema * (1 - multiplier));
      }
      middleBand = ema;
    }

    // Standard deviation from Welford (population)
    const variance = this.rollingMean !== null && this.prices.length >= n
      ? (this.rollingM2 / n)
      : (() => {
          const relevant = this.prices.slice(-n);
          const mu = relevant.reduce((s, v) => s + v, 0) / relevant.length;
          return relevant.reduce((sum, v) => sum + (v - mu) * (v - mu), 0) / relevant.length;
        })();
    const standardDeviation = Math.sqrt(variance);

    const upperBand = middleBand + (standardDeviation * this.config.multiplier);
    const lowerBand = middleBand - (standardDeviation * this.config.multiplier);
    return { upperBand, middleBand, lowerBand };
  }

  private updateRollingStats(newValue: number): void {
    const n = Math.min(this.prices.length, this.config.window);
    if (this.rollingMean === null) {
      // initialize
      let mean = 0;
      for (let i = 0; i < this.prices.length; i++) {
        const x = this.prices[i];
        const delta = x - mean;
        mean += delta / (i + 1);
        this.rollingM2 += delta * (x - mean);
      }
      this.rollingMean = mean;
      return;
    }
    // Online update when simply appending within window
    // (Note: When window exceeds and we remove, we recompute via recomputeRollingStats.)
    const mean = this.rollingMean;
    const delta = newValue - mean;
    const newMean = mean + delta / n;
    this.rollingM2 += delta * (newValue - newMean);
    this.rollingMean = newMean;
  }

  private recomputeRollingStats(): void {
    // Recompute mean and M2 over the last window values
    const relevant = this.prices.slice(-this.config.window);
    let mean = 0;
    let m2 = 0;
    for (let i = 0; i < relevant.length; i++) {
      const x = relevant[i];
      const delta = x - mean;
      mean += delta / (i + 1);
      m2 += delta * (x - mean);
    }
    this.rollingMean = mean;
    this.rollingM2 = m2;
  }

  /**
   * Get the current Bollinger Bands values
   */
  getCurrentBands(): { upperBand: number | null; middleBand: number | null; lowerBand: number | null } {
    if (this.prices.length < this.config.window) {
      return { upperBand: null, middleBand: null, lowerBand: null };
    }
    
    const bands = this.calculateBollingerBands();
    return bands;
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
    this.rollingMean = null;
    this.rollingM2 = 0;
  }

  /**
   * Get strategy configuration
   */
  getConfig(): BollingerBandsConfig {
    return { ...this.config };
  }

  /**
   * Get strategy description
   */
  getDescription(): string {
    return `Bollinger Bands Strategy: ${this.config.window}-day ${this.config.maType} with ${this.config.multiplier}x standard deviation`;
  }
}

/**
 * Run the Bollinger Bands strategy on historical data
 * 
 * @param symbol - Stock symbol
 * @param data - Historical price data
 * @param config - Strategy configuration
 * @returns Backtest results
 */
export function runBollingerBandsStrategy(
  symbol: string,
  data: { date: string; close: number, open: number }[],
  config: BollingerBandsConfig & {
    initialCapital: number;
    sharesPerTrade: number;
  }
): BollingerBandsResult {
  const trades: BollingerBandsTrade[] = [];
  const strategy = new BollingerBandsStrategy({
    window: config.window,
    multiplier: config.multiplier,
    maType: config.maType
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
    const { upperBand, middleBand, lowerBand } = strategy.getCurrentBands();

    if (signal === 'BUY' && cash >= dayData.close) {
      // Execute buy order
      const sharesToBuy = Math.floor(cash / dayData.close);
      const actualShares = Math.min(sharesToBuy, config.sharesPerTrade);
      const cost = actualShares * dayData.close;
      
      cash -= cost;
      currentShares += actualShares;
      
      // Calculate position within bands (0 = lower band, 1 = upper band)
      const bandPosition = lowerBand && upperBand ? 
        (dayData.close - lowerBand) / (upperBand - lowerBand) : undefined;
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "BUY",
        price: dayData.close,
        shares: actualShares,
        upperBand: upperBand || undefined,
        middleBand: middleBand || undefined,
        lowerBand: lowerBand || undefined,
        bandPosition
      });
    } else if (signal === 'SELL' && currentShares > 0) {
      // Execute sell order
      const sharesToSell = Math.min(currentShares, config.sharesPerTrade);
      const proceeds = sharesToSell * dayData.close;
      
      cash += proceeds;
      currentShares -= sharesToSell;
      
      // Calculate position within bands
      const bandPosition = lowerBand && upperBand ? 
        (dayData.close - lowerBand) / (upperBand - lowerBand) : undefined;
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "SELL",
        price: dayData.close,
        shares: sharesToSell,
        upperBand: upperBand || undefined,
        middleBand: middleBand || undefined,
        lowerBand: lowerBand || undefined,
        bandPosition
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
 * Strategy performance notes:
 * 
 * Best suited for:
 * - Ranging/sideways markets
 * - Mean-reverting stocks
 * - Volatile stocks with clear support/resistance
 * 
 * Common configurations:
 * - 20-day SMA with 2.0 standard deviation (default)
 * - 20-day SMA with 2.5 standard deviation (wider bands, fewer signals)
 * - 10-day SMA with 1.5 standard deviation (tighter bands, more signals)
 * 
 * Risk considerations:
 * - Can generate false signals in trending markets
 * - Works best when bands are expanding (high volatility)
 * - May miss strong trends that break through bands
 */
