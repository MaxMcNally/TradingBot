/**
 * Momentum Strategy
 * 
 * This strategy implements a momentum-based approach using:
 * - RSI (Relative Strength Index) for overbought/oversold conditions
 * - Price momentum (rate of change) for trend confirmation
 * - Volume confirmation (if available)
 * 
 * The strategy buys on momentum confirmation and sells on momentum exhaustion.
 */

export interface MomentumConfig {
  rsiWindow: number;        // RSI calculation window (typically 14)
  rsiOverbought: number;    // RSI overbought threshold (typically 70)
  rsiOversold: number;      // RSI oversold threshold (typically 30)
  momentumWindow: number;   // Price momentum calculation window (typically 10)
  momentumThreshold: number; // Minimum momentum percentage (e.g., 0.02 for 2%)
}

export interface MomentumTrade {
  symbol: string;
  date: string;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
  rsi?: number;
  momentum?: number;
  signal?: 'RSI_OVERSOLD' | 'MOMENTUM_BREAKOUT' | 'RSI_OVERBOUGHT' | 'MOMENTUM_EXHAUSTION';
}

export interface MomentumResult {
  trades: MomentumTrade[];
  finalPortfolioValue: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
}

export class MomentumStrategy {
  private config: MomentumConfig;
  private prices: number[] = [];
  private currentPosition: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
  private entryPrice: number = 0;

  constructor(config: MomentumConfig) {
    this.config = config;
  }

  /**
   * Add a new price point to the strategy
   * @param price - The current price
   * @returns Trading signal: 'BUY', 'SELL', or null
   */
  addPrice(price: number): 'BUY' | 'SELL' | null {
    this.prices.push(price);
    
    // Keep only the last 'rsiWindow' prices (need the longest window)
    const maxWindow = Math.max(this.config.rsiWindow, this.config.momentumWindow);
    if (this.prices.length > maxWindow) {
      this.prices.shift();
    }

    // Need at least 'rsiWindow' prices to calculate RSI
    if (this.prices.length < this.config.rsiWindow) {
      return null;
    }

    const rsi = this.calculateRSI();
    const momentum = this.calculateMomentum();

    // Buy signals
    if (this.currentPosition !== 'LONG') {
      // RSI oversold with positive momentum
      if (rsi <= this.config.rsiOversold && momentum > 0) {
        this.currentPosition = 'LONG';
        this.entryPrice = price;
        return 'BUY';
      }
      // Strong momentum breakout
      if (momentum >= this.config.momentumThreshold && rsi < this.config.rsiOverbought) {
        this.currentPosition = 'LONG';
        this.entryPrice = price;
        return 'BUY';
      }
    }

    // Sell signals
    if (this.currentPosition === 'LONG') {
      // RSI overbought
      if (rsi >= this.config.rsiOverbought) {
        this.currentPosition = 'NONE';
        this.entryPrice = 0;
        return 'SELL';
      }
      // Momentum exhaustion (negative momentum)
      if (momentum <= -this.config.momentumThreshold) {
        this.currentPosition = 'NONE';
        this.entryPrice = 0;
        return 'SELL';
      }
    }

    return null;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(): number {
    if (this.prices.length < this.config.rsiWindow + 1) {
      return 50; // Neutral RSI if not enough data
    }

    const relevantPrices = this.prices.slice(-this.config.rsiWindow - 1);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < relevantPrices.length; i++) {
      const change = relevantPrices[i] - relevantPrices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / this.config.rsiWindow;
    const avgLoss = losses / this.config.rsiWindow;

    if (avgLoss === 0) {
      return 100; // All gains, no losses
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  }

  /**
   * Calculate price momentum (rate of change)
   */
  private calculateMomentum(): number {
    if (this.prices.length < this.config.momentumWindow + 1) {
      return 0; // No momentum if not enough data
    }

    const currentPrice = this.prices[this.prices.length - 1];
    const pastPrice = this.prices[this.prices.length - 1 - this.config.momentumWindow];
    
    return (currentPrice - pastPrice) / pastPrice;
  }

  /**
   * Get the current RSI and momentum values
   */
  getCurrentIndicators(): { rsi: number | null; momentum: number | null } {
    if (this.prices.length < this.config.rsiWindow) {
      return { rsi: null, momentum: null };
    }
    
    return {
      rsi: this.calculateRSI(),
      momentum: this.calculateMomentum()
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
  }

  /**
   * Get strategy configuration
   */
  getConfig(): MomentumConfig {
    return { ...this.config };
  }

  /**
   * Get strategy description
   */
  getDescription(): string {
    return `Momentum Strategy: RSI(${this.config.rsiWindow}) ${this.config.rsiOversold}/${this.config.rsiOverbought}, Momentum(${this.config.momentumWindow}) ${(this.config.momentumThreshold * 100).toFixed(1)}%`;
  }
}

/**
 * Run the momentum strategy on historical data
 * 
 * @param symbol - Stock symbol
 * @param data - Historical price data
 * @param config - Strategy configuration
 * @returns Backtest results
 */
export function runMomentumStrategy(
  symbol: string,
  data: { date: string; close: number, open: number }[],
  config: MomentumConfig & {
    initialCapital: number;
    sharesPerTrade: number;
  }
): MomentumResult {
  const trades: MomentumTrade[] = [];
  const strategy = new MomentumStrategy({
    rsiWindow: config.rsiWindow,
    rsiOverbought: config.rsiOverbought,
    rsiOversold: config.rsiOversold,
    momentumWindow: config.momentumWindow,
    momentumThreshold: config.momentumThreshold
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
    const { rsi, momentum } = strategy.getCurrentIndicators();

    if (signal === 'BUY' && cash >= dayData.close) {
      // Execute buy order
      const sharesToBuy = Math.floor(cash / dayData.close);
      const actualShares = Math.min(sharesToBuy, config.sharesPerTrade);
      const cost = actualShares * dayData.close;
      
      cash -= cost;
      currentShares += actualShares;
      
      let signalType: 'RSI_OVERSOLD' | 'MOMENTUM_BREAKOUT' | undefined = undefined;
      if (rsi && rsi <= config.rsiOversold) {
        signalType = 'RSI_OVERSOLD';
      } else if (momentum && momentum >= config.momentumThreshold) {
        signalType = 'MOMENTUM_BREAKOUT';
      }
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "BUY",
        price: dayData.close,
        shares: actualShares,
        rsi: rsi || undefined,
        momentum: momentum || undefined,
        signal: signalType
      });
    } else if (signal === 'SELL' && currentShares > 0) {
      // Execute sell order
      const sharesToSell = Math.min(currentShares, config.sharesPerTrade);
      const proceeds = sharesToSell * dayData.close;
      
      cash += proceeds;
      currentShares -= sharesToSell;
      
      let signalType: 'RSI_OVERBOUGHT' | 'MOMENTUM_EXHAUSTION' | undefined = undefined;
      if (rsi && rsi >= config.rsiOverbought) {
        signalType = 'RSI_OVERBOUGHT';
      } else if (momentum && momentum <= -config.momentumThreshold) {
        signalType = 'MOMENTUM_EXHAUSTION';
      }
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "SELL",
        price: dayData.close,
        shares: sharesToSell,
        rsi: rsi || undefined,
        momentum: momentum || undefined,
        signal: signalType
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
 * - Trending markets with clear momentum
 * - Volatile stocks with strong directional moves
 * - Medium-term positions (days to weeks)
 * 
 * Common configurations:
 * - RSI: 14-day window, 30/70 thresholds
 * - Momentum: 10-day window, 2-5% threshold
 * 
 * Risk considerations:
 * - Can be whipsawed in sideways markets
 * - Requires strong trend confirmation
 * - May miss early trend entries
 */
