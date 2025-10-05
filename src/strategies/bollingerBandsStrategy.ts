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

export class BollingerBandsStrategy {
  private config: BollingerBandsConfig;
  private prices: number[] = [];
  private currentPosition: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
  private entryPrice: number = 0;

  constructor(config: BollingerBandsConfig) {
    this.config = config;
  }

  /**
   * Add a new price point to the strategy
   * @param price - The current price
   * @returns Trading signal: 'BUY', 'SELL', or null
   */
  addPrice(price: number): 'BUY' | 'SELL' | null {
    this.prices.push(price);
    
    // Keep only the last 'window' prices
    if (this.prices.length > this.config.window) {
      this.prices.shift();
    }

    // Need at least 'window' prices to calculate Bollinger Bands
    if (this.prices.length < this.config.window) {
      return null;
    }

    const bands = this.calculateBollingerBands();
    const { upperBand, middleBand, lowerBand } = bands;

    // Buy signal: price touches or goes below lower band (and we're not already long)
    if (price <= lowerBand && this.currentPosition !== 'LONG') {
      this.currentPosition = 'LONG';
      this.entryPrice = price;
      return 'BUY';
    }

    // Sell signal: price touches or goes above upper band (and we have a position to sell)
    if (price >= upperBand && this.currentPosition === 'LONG') {
      this.currentPosition = 'NONE';
      this.entryPrice = 0;
      return 'SELL';
    }

    return null;
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(): { upperBand: number; middleBand: number; lowerBand: number } {
    const relevantPrices = this.prices.slice(-this.config.window);
    
    // Calculate middle band (SMA or EMA)
    let middleBand: number;
    if (this.config.maType === 'SMA') {
      middleBand = relevantPrices.reduce((sum, price) => sum + price, 0) / relevantPrices.length;
    } else {
      // EMA calculation
      const multiplier = 2 / (this.config.window + 1);
      let ema = relevantPrices[0];
      for (let i = 1; i < relevantPrices.length; i++) {
        ema = (relevantPrices[i] * multiplier) + (ema * (1 - multiplier));
      }
      middleBand = ema;
    }

    // Calculate standard deviation
    const variance = relevantPrices.reduce((sum, price) => {
      return sum + Math.pow(price - middleBand, 2);
    }, 0) / relevantPrices.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate upper and lower bands
    const upperBand = middleBand + (standardDeviation * this.config.multiplier);
    const lowerBand = middleBand - (standardDeviation * this.config.multiplier);

    return { upperBand, middleBand, lowerBand };
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
  let portfolioValues: number[] = [];
  let winningTrades = 0;
  let totalTrades = 0;
  let maxPortfolioValue = config.initialCapital;
  let maxDrawdown = 0;

  for (let i = 0; i < data.length; i++) {
    const dayData = data[i];
    const signal = strategy.addPrice(dayData.close);
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
    portfolioValues.push(currentPortfolioValue);
    
    // Track maximum drawdown
    if (currentPortfolioValue > maxPortfolioValue) {
      maxPortfolioValue = currentPortfolioValue;
    }
    const currentDrawdown = (maxPortfolioValue - currentPortfolioValue) / maxPortfolioValue;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
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
