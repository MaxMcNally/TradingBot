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

import { BacktestPortfolio } from '../backtest/BacktestPortfolio';
import { OrderExecutionSimulator } from '../backtest/OrderExecutionSimulator';
import { TradingSessionSettings, DEFAULT_SESSION_SETTINGS } from '../../api/types/tradingSessionSettings';
import { TradingMode } from '../config';

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
  portfolioHistory: Array<{
    date: string;
    portfolioValue: number;
    cash: number;
    shares: number;
    price: number;
  }>;
}

import { AbstractStrategy, Signal } from './baseStrategy';

export class MomentumStrategy extends AbstractStrategy {
  private config: MomentumConfig;
  private currentPosition: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
  private entryPrice: number = 0;
  private lastSignal: Signal = null;
  // Wilder's smoothing state for O(1) RSI updates
  private avgGain: number | null = null;
  private avgLoss: number | null = null;

  constructor(config: MomentumConfig) {
    super();
    this.config = config;
  }

  /**
   * Add a new price point to the strategy
   * @param price - The current price
   * @returns Trading signal: 'BUY', 'SELL', or null
   */
  addPrice(price: number): void {
    const maxWindow = Math.max(this.config.rsiWindow, this.config.momentumWindow);
    // Maintain rolling window without reduce; keep at most maxWindow+1 for momentum diff
    this.prices.push(price);
    if (this.prices.length > maxWindow + 1) {
      this.prices.shift();
    }

    // Need at least rsiWindow prices to start RSI smoothing
    if (this.prices.length < this.config.rsiWindow) {
      this.lastSignal = null;
      return;
    }

    // Initialize or update Wilder's RSI smoothing
    const n = this.config.rsiWindow;
    if (this.avgGain === null || this.avgLoss === null) {
      // Seed averages using first n periods
      let gains = 0;
      let losses = 0;
      for (let i = 1; i < Math.min(this.prices.length, n + 1); i++) {
        const change = this.prices[i] - this.prices[i - 1];
        if (change > 0) gains += change; else losses += -change;
      }
      this.avgGain = gains / n;
      this.avgLoss = losses / n;
    } else {
      // Wilder update with last change
      const change = this.prices[this.prices.length - 1] - this.prices[this.prices.length - 2];
      const gain = Math.max(change, 0);
      const loss = Math.max(-change, 0);
      this.avgGain = ((this.avgGain * (n - 1)) + gain) / n;
      this.avgLoss = ((this.avgLoss * (n - 1)) + loss) / n;
    }

    const rsi = this.computeRSIFromAverages();
    const momentum = this.calculateMomentum();

    // Buy signals
    if (this.currentPosition !== 'LONG') {
      // RSI oversold with positive momentum
      if (rsi <= this.config.rsiOversold && momentum > 0) {
        this.currentPosition = 'LONG';
        this.entryPrice = price;
        this.lastSignal = 'BUY';
        return;
      }
      // Strong momentum breakout
      if (momentum >= this.config.momentumThreshold && rsi < this.config.rsiOverbought) {
        this.currentPosition = 'LONG';
        this.entryPrice = price;
        this.lastSignal = 'BUY';
        return;
      }
    }

    // Sell signals
    if (this.currentPosition === 'LONG') {
      // RSI overbought
      if (rsi >= this.config.rsiOverbought) {
        this.currentPosition = 'NONE';
        this.entryPrice = 0;
        this.lastSignal = 'SELL';
        return;
      }
      // Momentum exhaustion (negative momentum)
      if (momentum <= -this.config.momentumThreshold) {
        this.currentPosition = 'NONE';
        this.entryPrice = 0;
        this.lastSignal = 'SELL';
        return;
      }
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
    return 'Momentum';
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(): number {
    // Retained for compatibility; delegate to smoothed averages if available
    if (this.avgGain !== null && this.avgLoss !== null) {
      return this.computeRSIFromAverages();
    }
    if (this.prices.length < this.config.rsiWindow + 1) {
      return 50;
    }
    // Fallback initialization path
    let gains = 0, losses = 0;
    const start = this.prices.length - (this.config.rsiWindow + 1);
    for (let i = start + 1; i < this.prices.length; i++) {
      const change = this.prices[i] - this.prices[i - 1];
      if (change > 0) gains += change; else losses += -change;
    }
    const avgGain = gains / this.config.rsiWindow;
    const avgLoss = losses / this.config.rsiWindow;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private computeRSIFromAverages(): number {
    if (this.avgGain === null || this.avgLoss === null) return 50;
    if (this.avgLoss === 0) return 100;
    const rs = this.avgGain / this.avgLoss;
    return 100 - (100 / (1 + rs));
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
    this.avgGain = null;
    this.avgLoss = null;
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
  data: { date: string; close: number, open: number, volume?: number }[],
  config: MomentumConfig & {
    initialCapital: number;
    sharesPerTrade: number;
    sessionSettings?: TradingSessionSettings | null;
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

  // Create session settings (use defaults if not provided)
  const settings: TradingSessionSettings = config.sessionSettings || {
    ...DEFAULT_SESSION_SETTINGS,
    session_id: 0, // Placeholder for backtest
  };
  
  // Initialize portfolio and order simulator
  const portfolio = new BacktestPortfolio(
    config.initialCapital,
    TradingMode.PAPER,
    [symbol],
    settings
  );
  
  const orderSimulator = new OrderExecutionSimulator(settings);
  
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
  const entryPrices: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const dayData = data[i];
    
    // Reset daily P&L if new day
    portfolio.resetDailyPnL(dayData.date);
    
    strategy.addPrice(dayData.close);
    const signal = strategy.getSignal();
    const { rsi, momentum } = strategy.getCurrentIndicators();

    // Check stop loss/take profit for existing positions
    const stopLossTakeProfit = portfolio.checkStopLossTakeProfit(symbol, dayData.close);
    if (stopLossTakeProfit) {
      const position = (portfolio as any).positions[symbol];
      if (position && position.shares > 0) {
        // Execute sell order due to stop loss or take profit
        const orderRequest = {
          symbol,
          side: 'SELL' as const,
          quantity: position.shares,
          orderType: settings.order_type_default,
          currentPrice: dayData.close,
          volume: dayData.volume,
          timestamp: dayData.date,
        };
        
        const execution = orderSimulator.executeOrder(orderRequest);
        if (execution.executed && execution.executedQuantity > 0) {
          const sellResult = portfolio.sell(symbol, execution.executedPrice, dayData.date, execution.executedQuantity);
          
          if (sellResult.success) {
            entryPrices.shift(); // Remove entry price from tracking
            
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
              price: execution.executedPrice,
              shares: sellResult.actualQuantity,
              rsi: rsi || undefined,
              momentum: momentum || undefined,
              signal: signalType
            });
            
            // Track winning trades
            if (sellResult.pnl > 0) {
              winningTrades++;
            }
            totalTrades++;
          }
        }
      }
    }

    // Check if we can trade (trading window, position limits, etc.)
    const canOpen = portfolio.canOpenPosition(symbol, dayData.close, dayData.date);
    
    if (signal === 'BUY' && canOpen.allowed) {
      // Calculate position size
      const targetQuantity = portfolio.calculatePositionSize(symbol, dayData.close, dayData.date);
      
      if (targetQuantity > 0) {
        // Execute buy order through order simulator
        const orderRequest = {
          symbol,
          side: 'BUY' as const,
          quantity: targetQuantity,
          orderType: settings.order_type_default,
          limitPrice: settings.limit_price_offset_percentage 
            ? dayData.close * (1 - settings.limit_price_offset_percentage / 100)
            : undefined,
          currentPrice: dayData.close,
          volume: dayData.volume,
          timestamp: dayData.date,
        };
        
        const execution = orderSimulator.executeOrder(orderRequest);
        if (execution.executed && execution.executedQuantity > 0) {
          const buyResult = portfolio.buy(symbol, execution.executedPrice, dayData.date, execution.executedQuantity);
          
          if (buyResult.success) {
            entryPrices.push(execution.executedPrice);
            
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
              price: execution.executedPrice,
              shares: buyResult.actualQuantity,
              rsi: rsi || undefined,
              momentum: momentum || undefined,
              signal: signalType
            });
          }
        }
      }
    } else if (signal === 'SELL') {
      const position = (portfolio as any).positions[symbol];
      if (position && position.shares > 0) {
        // Execute sell order
        const orderRequest = {
          symbol,
          side: 'SELL' as const,
          quantity: position.shares,
          orderType: settings.order_type_default,
          limitPrice: settings.limit_price_offset_percentage 
            ? dayData.close * (1 + settings.limit_price_offset_percentage / 100)
            : undefined,
          currentPrice: dayData.close,
          volume: dayData.volume,
          timestamp: dayData.date,
        };
        
        const execution = orderSimulator.executeOrder(orderRequest);
        if (execution.executed && execution.executedQuantity > 0) {
          const sellResult = portfolio.sell(symbol, execution.executedPrice, dayData.date, execution.executedQuantity);
          
          if (sellResult.success) {
            entryPrices.shift(); // Remove entry price from tracking
            
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
              price: execution.executedPrice,
              shares: sellResult.actualQuantity,
              rsi: rsi || undefined,
              momentum: momentum || undefined,
              signal: signalType
            });

            // Track winning trades for win rate calculation
            if (sellResult.pnl > 0) {
              winningTrades++;
            }
            totalTrades++;
          }
        }
      }
    }

    // Calculate current portfolio value
    const status = portfolio.status({ [symbol]: dayData.close });
    const currentPortfolioValue = status.totalValue;
    
    // Track detailed portfolio history
    portfolioHistory.push({
      date: dayData.date,
      portfolioValue: currentPortfolioValue,
      cash: status.cash,
      shares: status.positions[symbol]?.shares || 0,
      price: dayData.close
    });
    
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
  const finalStatus = portfolio.status({ [symbol]: finalPrice });
  const finalPortfolioValue = finalStatus.totalValue;
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

