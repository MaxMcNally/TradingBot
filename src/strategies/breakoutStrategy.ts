/**
 * Breakout Strategy
 * 
 * This strategy implements a breakout approach that identifies:
 * - Support and resistance levels based on recent price history
 * - Breakout signals when price moves beyond these levels with volume confirmation
 * - Trend continuation patterns
 * 
 * The strategy buys on upward breakouts and sells on downward breakouts,
 * assuming that breakouts will continue in the breakout direction.
 */

export interface BreakoutConfig {
  lookbackWindow: number;     // Window to identify support/resistance levels (typically 20-50)
  breakoutThreshold: number;  // Minimum percentage move to confirm breakout (e.g., 0.01 for 1%)
  minVolumeRatio: number;     // Minimum volume ratio vs average (e.g., 1.5 for 50% above average)
  confirmationPeriod: number; // Days to hold position after breakout (typically 1-3)
}

export interface BreakoutTrade {
  symbol: string;
  date: string;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
  supportLevel?: number;
  resistanceLevel?: number;
  breakoutType?: 'UPWARD' | 'DOWNWARD';
  volumeRatio?: number;
}

export interface BreakoutResult {
  trades: BreakoutTrade[];
  finalPortfolioValue: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
}

export class BreakoutStrategy {
  private config: BreakoutConfig;
  private prices: number[] = [];
  private volumes: number[] = [];
  private currentPosition: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
  private entryPrice: number = 0;
  private positionHeldDays: number = 0;
  private lastSupportLevel: number = 0;
  private lastResistanceLevel: number = 0;

  constructor(config: BreakoutConfig) {
    this.config = config;
  }

  /**
   * Add a new price point to the strategy
   * @param price - The current price
   * @param volume - The current volume (optional, defaults to 1)
   * @returns Trading signal: 'BUY', 'SELL', or null
   */
  addPrice(price: number, volume: number = 1): 'BUY' | 'SELL' | null {
    this.prices.push(price);
    this.volumes.push(volume);
    
    // Keep only the last 'lookbackWindow' prices
    if (this.prices.length > this.config.lookbackWindow) {
      this.prices.shift();
      this.volumes.shift();
    }

    // Need at least 'lookbackWindow' prices to identify levels
    if (this.prices.length < this.config.lookbackWindow) {
      return null;
    }

    // Update support and resistance levels
    this.updateSupportResistanceLevels();

    // Check for position exit (time-based)
    if (this.currentPosition !== 'NONE') {
      this.positionHeldDays++;
      if (this.positionHeldDays >= this.config.confirmationPeriod) {
        const previousPosition = this.currentPosition;
        this.currentPosition = 'NONE';
        this.entryPrice = 0;
        this.positionHeldDays = 0;
        return previousPosition === 'LONG' ? 'SELL' : 'BUY';
      }
    }

    // Check for breakout signals
    const signal = this.checkBreakoutSignals(price, volume);
    return signal;
  }

  /**
   * Update support and resistance levels based on recent price history
   */
  private updateSupportResistanceLevels(): void {
    if (this.prices.length < this.config.lookbackWindow) {
      return;
    }

    const recentPrices = this.prices.slice(-this.config.lookbackWindow);
    
    // Find local minima (support) and maxima (resistance)
    const minima: number[] = [];
    const maxima: number[] = [];

    for (let i = 1; i < recentPrices.length - 1; i++) {
      // Local minimum (support)
      if (recentPrices[i] < recentPrices[i - 1] && recentPrices[i] < recentPrices[i + 1]) {
        minima.push(recentPrices[i]);
      }
      // Local maximum (resistance)
      if (recentPrices[i] > recentPrices[i - 1] && recentPrices[i] > recentPrices[i + 1]) {
        maxima.push(recentPrices[i]);
      }
    }

    // Use the most recent significant levels
    if (minima.length > 0) {
      this.lastSupportLevel = Math.min(...minima);
    }
    if (maxima.length > 0) {
      this.lastResistanceLevel = Math.max(...maxima);
    }
  }

  /**
   * Check for breakout signals
   */
  private checkBreakoutSignals(price: number, volume: number): 'BUY' | 'SELL' | null {
    // Calculate average volume for volume confirmation
    const avgVolume = this.volumes.reduce((sum, vol) => sum + vol, 0) / this.volumes.length;
    const volumeRatio = volume / avgVolume;

    // Upward breakout: price breaks above resistance with volume confirmation
    if (price > this.lastResistanceLevel * (1 + this.config.breakoutThreshold) && 
        volumeRatio >= this.config.minVolumeRatio && 
        this.currentPosition !== 'LONG') {
      this.currentPosition = 'LONG';
      this.entryPrice = price;
      this.positionHeldDays = 0;
      return 'BUY';
    }

    // Downward breakout: price breaks below support with volume confirmation
    if (price < this.lastSupportLevel * (1 - this.config.breakoutThreshold) && 
        volumeRatio >= this.config.minVolumeRatio && 
        this.currentPosition !== 'SHORT') {
      this.currentPosition = 'SHORT';
      this.entryPrice = price;
      this.positionHeldDays = 0;
      return 'SELL';
    }

    return null;
  }

  /**
   * Get the current support and resistance levels
   */
  getCurrentLevels(): { support: number; resistance: number } {
    return {
      support: this.lastSupportLevel,
      resistance: this.lastResistanceLevel
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
    this.volumes = [];
    this.currentPosition = 'NONE';
    this.entryPrice = 0;
    this.positionHeldDays = 0;
    this.lastSupportLevel = 0;
    this.lastResistanceLevel = 0;
  }

  /**
   * Get strategy configuration
   */
  getConfig(): BreakoutConfig {
    return { ...this.config };
  }

  /**
   * Get strategy description
   */
  getDescription(): string {
    return `Breakout Strategy: ${this.config.lookbackWindow}-day levels, ${(this.config.breakoutThreshold * 100).toFixed(1)}% threshold, ${this.config.confirmationPeriod}-day hold`;
  }
}

/**
 * Run the breakout strategy on historical data
 * 
 * @param symbol - Stock symbol
 * @param data - Historical price data with volume
 * @param config - Strategy configuration
 * @returns Backtest results
 */
export function runBreakoutStrategy(
  symbol: string,
  data: { date: string; close: number, open: number, volume?: number }[],
  config: BreakoutConfig & {
    initialCapital: number;
    sharesPerTrade: number;
  }
): BreakoutResult {
  const trades: BreakoutTrade[] = [];
  const strategy = new BreakoutStrategy({
    lookbackWindow: config.lookbackWindow,
    breakoutThreshold: config.breakoutThreshold,
    minVolumeRatio: config.minVolumeRatio,
    confirmationPeriod: config.confirmationPeriod
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
    const volume = dayData.volume || 1; // Default volume if not provided
    const signal = strategy.addPrice(dayData.close, volume);
    const { support, resistance } = strategy.getCurrentLevels();

    if (signal === 'BUY' && cash >= dayData.close) {
      // Execute buy order
      const sharesToBuy = Math.floor(cash / dayData.close);
      const actualShares = Math.min(sharesToBuy, config.sharesPerTrade);
      const cost = actualShares * dayData.close;
      
      cash -= cost;
      currentShares += actualShares;
      
      // Calculate volume ratio
      const avgVolume = data.slice(Math.max(0, i - config.lookbackWindow), i + 1)
        .reduce((sum, d) => sum + (d.volume || 1), 0) / Math.min(i + 1, config.lookbackWindow);
      const volumeRatio = volume / avgVolume;
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "BUY",
        price: dayData.close,
        shares: actualShares,
        supportLevel: support || undefined,
        resistanceLevel: resistance || undefined,
        breakoutType: 'UPWARD',
        volumeRatio
      });
    } else if (signal === 'SELL' && currentShares > 0) {
      // Execute sell order
      const sharesToSell = Math.min(currentShares, config.sharesPerTrade);
      const proceeds = sharesToSell * dayData.close;
      
      cash += proceeds;
      currentShares -= sharesToSell;
      
      // Calculate volume ratio
      const avgVolume = data.slice(Math.max(0, i - config.lookbackWindow), i + 1)
        .reduce((sum, d) => sum + (d.volume || 1), 0) / Math.min(i + 1, config.lookbackWindow);
      const volumeRatio = volume / avgVolume;
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "SELL",
        price: dayData.close,
        shares: sharesToSell,
        supportLevel: support || undefined,
        resistanceLevel: resistance || undefined,
        breakoutType: 'DOWNWARD',
        volumeRatio
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
 * - Trending markets with clear breakouts
 * - Volatile stocks with defined support/resistance
 * - High-volume stocks for volume confirmation
 * 
 * Common configurations:
 * - 20-50 day lookback window
 * - 1-3% breakout threshold
 * - 1.5-2.0x volume ratio
 * - 1-3 day confirmation period
 * 
 * Risk considerations:
 * - False breakouts can lead to losses
 * - Requires volume data for best performance
 * - May miss early trend entries
 * - Works best with proper risk management
 */
