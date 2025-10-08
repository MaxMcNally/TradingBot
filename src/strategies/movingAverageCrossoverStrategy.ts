/**
 * Moving Average Crossover Strategy
 * 
 * This strategy implements a dual moving average crossover approach:
 * - BUY when the fast moving average crosses above the slow moving average (golden cross)
 * - SELL when the fast moving average crosses below the slow moving average (death cross)
 * 
 * The strategy is trend-following and works well in trending markets.
 * Common configurations: 10/30, 20/50, 50/200 day moving averages
 */

export interface MovingAverageCrossoverConfig {
  fastWindow: number;     // Fast moving average window (e.g., 10)
  slowWindow: number;     // Slow moving average window (e.g., 30)
  maType: 'SMA' | 'EMA'; // Type of moving average to use
}

export interface MovingAverageCrossoverTrade {
  symbol: string;
  date: string;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
  fastMA?: number;
  slowMA?: number;
  crossoverType?: 'GOLDEN' | 'DEATH';
}

export interface MovingAverageCrossoverResult {
  trades: MovingAverageCrossoverTrade[];
  finalPortfolioValue: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  portfolioHistory: Array<{
    date: string;
    portfolioValue: number;
    cash: number;
    shares: number;
    price: number;
  }>;
}

export class MovingAverageCrossoverStrategy {
  private config: MovingAverageCrossoverConfig;
  private prices: number[] = [];
  private currentPosition: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
  private entryPrice: number = 0;
  private previousFastMA: number | null = null;
  private previousSlowMA: number | null = null;

  constructor(config: MovingAverageCrossoverConfig) {
    this.config = config;
  }

  /**
   * Add a new price point to the strategy
   * @param price - The current price
   * @returns Trading signal: 'BUY', 'SELL', or null
   */
  addPrice(price: number): 'BUY' | 'SELL' | null {
    this.prices.push(price);
    
    // Keep only the last 'slowWindow' prices (need the longest window)
    if (this.prices.length > this.config.slowWindow) {
      this.prices.shift();
    }

    // Need at least 'slowWindow' prices to calculate both moving averages
    if (this.prices.length < this.config.slowWindow) {
      return null;
    }

    const fastMA = this.calculateMovingAverage(this.config.fastWindow);
    const slowMA = this.calculateMovingAverage(this.config.slowWindow);

    // Check for crossover signals
    let signal: 'BUY' | 'SELL' | null = null;
    // let crossoverType: 'GOLDEN' | 'DEATH' | undefined = undefined; // Unused variable

    if (this.previousFastMA !== null && this.previousSlowMA !== null) {
      // Golden Cross: Fast MA crosses above Slow MA
      if (this.previousFastMA <= this.previousSlowMA && fastMA > slowMA && this.currentPosition !== 'LONG') {
        signal = 'BUY';
        // crossoverType = 'GOLDEN'; // Unused variable
        this.currentPosition = 'LONG';
        this.entryPrice = price;
      }
      // Death Cross: Fast MA crosses below Slow MA
      else if (this.previousFastMA >= this.previousSlowMA && fastMA < slowMA && this.currentPosition === 'LONG') {
        signal = 'SELL';
        // crossoverType = 'DEATH'; // Unused variable
        this.currentPosition = 'NONE';
        this.entryPrice = 0;
      }
    }

    // Update previous values for next iteration
    this.previousFastMA = fastMA;
    this.previousSlowMA = slowMA;

    return signal;
  }

  /**
   * Calculate moving average (SMA or EMA)
   */
  private calculateMovingAverage(window: number): number {
    if (this.config.maType === 'SMA') {
      return this.calculateSMA(window);
    } else {
      return this.calculateEMA(window);
    }
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(window: number): number {
    const relevantPrices = this.prices.slice(-window);
    const sum = relevantPrices.reduce((acc, price) => acc + price, 0);
    return sum / relevantPrices.length;
  }

  /**
   * Calculate Exponential Moving Average
   */
  private calculateEMA(window: number): number {
    const relevantPrices = this.prices.slice(-window);
    const multiplier = 2 / (window + 1);
    
    // Start with SMA for the first value
    let ema = relevantPrices[0];
    
    for (let i = 1; i < relevantPrices.length; i++) {
      ema = (relevantPrices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  /**
   * Get the current moving average values
   */
  getCurrentMovingAverages(): { fastMA: number | null; slowMA: number | null } {
    if (this.prices.length < this.config.slowWindow) {
      return { fastMA: null, slowMA: null };
    }
    
    return {
      fastMA: this.calculateMovingAverage(this.config.fastWindow),
      slowMA: this.calculateMovingAverage(this.config.slowWindow)
    };
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
    this.previousFastMA = null;
    this.previousSlowMA = null;
  }

  /**
   * Get strategy configuration
   */
  getConfig(): MovingAverageCrossoverConfig {
    return { ...this.config };
  }

  /**
   * Get strategy description
   */
  getDescription(): string {
    return `Moving Average Crossover Strategy: ${this.config.fastWindow}/${this.config.slowWindow}-day ${this.config.maType} crossover`;
  }
}

/**
 * Run the moving average crossover strategy on historical data
 * 
 * @param symbol - Stock symbol
 * @param data - Historical price data
 * @param config - Strategy configuration
 * @returns Backtest results
 */
export function runMovingAverageCrossoverStrategy(
  symbol: string,
  data: { date: string; close: number, open: number }[],
  config: MovingAverageCrossoverConfig & {
    initialCapital: number;
    sharesPerTrade: number;
  }
): MovingAverageCrossoverResult {
  const trades: MovingAverageCrossoverTrade[] = [];
  const strategy = new MovingAverageCrossoverStrategy({
    fastWindow: config.fastWindow,
    slowWindow: config.slowWindow,
    maType: config.maType
  });

  let currentShares = 0;
  let cash = config.initialCapital;
  let portfolioValues: number[] = [];
  let portfolioHistory: Array<{
    date: string;
    portfolioValue: number;
    cash: number;
    shares: number;
    price: number;
  }> = [];
  let winningTrades = 0;
  let totalTrades = 0;
  let maxPortfolioValue = config.initialCapital;
  let maxDrawdown = 0;

  for (let i = 0; i < data.length; i++) {
    const dayData = data[i];
    const signal = strategy.addPrice(dayData.close);
    const { fastMA, slowMA } = strategy.getCurrentMovingAverages();

    if (signal === 'BUY' && cash >= dayData.close) {
      // Execute buy order
      const sharesToBuy = Math.floor(cash / dayData.close);
      const actualShares = Math.min(sharesToBuy, config.sharesPerTrade);
      const cost = actualShares * dayData.close;
      
      cash -= cost;
      currentShares += actualShares;
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "BUY",
        price: dayData.close,
        shares: actualShares,
        fastMA: fastMA || undefined,
        slowMA: slowMA || undefined,
        crossoverType: 'GOLDEN'
      });
    } else if (signal === 'SELL' && currentShares > 0) {
      // Execute sell order
      const sharesToSell = Math.min(currentShares, config.sharesPerTrade);
      const proceeds = sharesToSell * dayData.close;
      
      cash += proceeds;
      currentShares -= sharesToSell;
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "SELL",
        price: dayData.close,
        shares: sharesToSell,
        fastMA: fastMA || undefined,
        slowMA: slowMA || undefined,
        crossoverType: 'DEATH'
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
    
    // Track detailed portfolio history
    portfolioHistory.push({
      date: dayData.date,
      portfolioValue: currentPortfolioValue,
      cash: cash,
      shares: currentShares,
      price: dayData.close
    });
    
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
    maxDrawdown,
    portfolioHistory
  };
}

/**
 * Strategy performance notes:
 * 
 * Best suited for:
 * - Trending markets (strong directional movement)
 * - Volatile stocks with clear trends
 * - Longer-term positions (weeks to months)
 * 
 * Common configurations:
 * - 10/30 day: More sensitive, more trades
 * - 20/50 day: Balanced approach
 * - 50/200 day: Long-term trend following
 * 
 * EMA vs SMA:
 * - EMA: More responsive to recent price changes
 * - SMA: Smoother, less whipsaws
 */
