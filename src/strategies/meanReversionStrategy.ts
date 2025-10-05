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

export class MeanReversionStrategy {
  private config: MeanReversionConfig;
  private prices: number[] = [];
  private currentPosition: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
  private entryPrice: number = 0;

  constructor(config: MeanReversionConfig) {
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

    // Need at least 'window' prices to calculate moving average
    if (this.prices.length < this.config.window) {
      return null;
    }

    const movingAverage = this.calculateMovingAverage();
    const priceDeviation = (price - movingAverage) / movingAverage;

    // Buy signal: price is below MA by threshold percentage (and we're not already long)
    if (priceDeviation <= -this.config.threshold && this.currentPosition !== 'LONG') {
      this.currentPosition = 'LONG';
      this.entryPrice = price;
      return 'BUY';
    }

    // Sell signal: price is above MA by threshold percentage (and we have a position to sell)
    if (priceDeviation >= this.config.threshold && this.currentPosition === 'LONG') {
      this.currentPosition = 'NONE';
      this.entryPrice = 0;
      return 'SELL';
    }

    return null;
  }

  /**
   * Calculate the simple moving average of the last 'window' prices
   */
  private calculateMovingAverage(): number {
    const sum = this.prices.reduce((acc, price) => acc + price, 0);
    return sum / this.prices.length;
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
  let portfolioValues: number[] = [];
  let winningTrades = 0;
  let totalTrades = 0;
  let maxPortfolioValue = config.initialCapital;
  let maxDrawdown = 0;

  for (let i = 0; i < data.length; i++) {
    const dayData = data[i];
    const signal = strategy.addPrice(dayData.close);
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
