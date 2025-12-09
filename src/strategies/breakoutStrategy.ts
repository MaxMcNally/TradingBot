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

import { BacktestPortfolio } from '../backtest/BacktestPortfolio';
import { OrderExecutionSimulator } from '../backtest/OrderExecutionSimulator';
import { TradingSessionSettings, DEFAULT_SESSION_SETTINGS } from '../../api/types/tradingSessionSettings';
import { TradingMode } from '../config';

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
  // Deques for O(1) sliding window min/max
  private minDeque: number[] = []; // stores indices
  private maxDeque: number[] = []; // stores indices
  private baseIndex: number = 0; // absolute index of prices[0]

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
    const idx = this.baseIndex + this.prices.length; // absolute index of the incoming sample
    this.prices.push(price);
    this.volumes.push(volume);

    // Maintain deques with absolute indices
    this.pushToMinDeque(idx, price);
    this.pushToMaxDeque(idx, price);

    // Trim window size by removing the oldest element when exceeded
    const window = this.config.lookbackWindow;
    if (this.prices.length > window) {
      this.prices.shift();
      this.volumes.shift();
      this.baseIndex += 1;
    }

    const cutoff = idx - (window - 1);
    this.popOutdatedFromDeques(cutoff);

    // Need at least 'lookbackWindow' prices to identify levels
    if (idx - this.baseIndex + 1 < window) {
      return null;
    }

    // Update support and resistance levels from deques (values via absolute index)
    this.lastSupportLevel = this.valueAt(this.minDeque[0]);
    this.lastResistanceLevel = this.valueAt(this.maxDeque[0]);

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
    // Retained for compatibility; not used in fast path with deques
    if (this.prices.length < this.config.lookbackWindow) return;
    const recentPrices = this.prices.slice(-this.config.lookbackWindow);
    this.lastSupportLevel = Math.min(...recentPrices);
    this.lastResistanceLevel = Math.max(...recentPrices);
  }

  private pushToMinDeque(idx: number, value: number): void {
    const window = this.config.lookbackWindow;
    const cutoff = idx - (window - 1);
    while (this.minDeque.length && this.minDeque[0] < cutoff) this.minDeque.shift();
    while (this.minDeque.length && this.valueAt(this.minDeque[this.minDeque.length - 1]) >= value) this.minDeque.pop();
    this.minDeque.push(idx);
  }

  private pushToMaxDeque(idx: number, value: number): void {
    const window = this.config.lookbackWindow;
    const cutoff = idx - (window - 1);
    while (this.maxDeque.length && this.maxDeque[0] < cutoff) this.maxDeque.shift();
    while (this.maxDeque.length && this.valueAt(this.maxDeque[this.maxDeque.length - 1]) <= value) this.maxDeque.pop();
    this.maxDeque.push(idx);
  }

  private popOutdatedFromDeques(cutoff: number): void {
    while (this.minDeque.length && this.minDeque[0] < cutoff) this.minDeque.shift();
    while (this.maxDeque.length && this.maxDeque[0] < cutoff) this.maxDeque.shift();
  }

  private valueAt(absIndex: number): number {
    const rel = absIndex - this.baseIndex;
    if (rel < 0 || rel >= this.prices.length) {
      // Should not happen if deques are maintained correctly; fallback to edge values
      if (this.prices.length === 0) {
        return 0; // Return 0 as fallback when no prices are available
      }
      return this.prices[Math.max(0, Math.min(this.prices.length - 1, rel))];
    }
    return this.prices[rel];
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
    this.minDeque = [];
    this.maxDeque = [];
    this.baseIndex = 0;
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
    sessionSettings?: TradingSessionSettings | null;
  }
): BreakoutResult {
  const trades: BreakoutTrade[] = [];
  const strategy = new BreakoutStrategy({
    lookbackWindow: config.lookbackWindow,
    breakoutThreshold: config.breakoutThreshold,
    minVolumeRatio: config.minVolumeRatio,
    confirmationPeriod: config.confirmationPeriod
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
  
  let winningTrades = 0;
  let totalTrades = 0;
  let maxPortfolioValue = config.initialCapital;
  let maxDrawdown = 0;
  const entryPrices: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const dayData = data[i];
    const volume = dayData.volume || 1; // Default volume if not provided
    
    // Reset daily P&L if new day
    portfolio.resetDailyPnL(dayData.date);
    
    const signal = strategy.addPrice(dayData.close, volume);
    const { support, resistance } = strategy.getCurrentLevels();

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
            
            // Calculate volume ratio
            const avgVolume = data.slice(Math.max(0, i - config.lookbackWindow), i + 1)
              .reduce((sum, d) => sum + (d.volume || 1), 0) / Math.min(i + 1, config.lookbackWindow);
            const volumeRatio = volume / avgVolume;
            
            trades.push({
              symbol,
              date: dayData.date,
              action: "SELL",
              price: execution.executedPrice,
              shares: sellResult.actualQuantity,
              supportLevel: support || undefined,
              resistanceLevel: resistance || undefined,
              breakoutType: 'DOWNWARD',
              volumeRatio
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
            
            // Calculate volume ratio
            const avgVolume = data.slice(Math.max(0, i - config.lookbackWindow), i + 1)
              .reduce((sum, d) => sum + (d.volume || 1), 0) / Math.min(i + 1, config.lookbackWindow);
            const volumeRatio = volume / avgVolume;
            
            trades.push({
              symbol,
              date: dayData.date,
              action: "BUY",
              price: execution.executedPrice,
              shares: buyResult.actualQuantity,
              supportLevel: support || undefined,
              resistanceLevel: resistance || undefined,
              breakoutType: 'UPWARD',
              volumeRatio
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
            
            // Calculate volume ratio
            const avgVolume = data.slice(Math.max(0, i - config.lookbackWindow), i + 1)
              .reduce((sum, d) => sum + (d.volume || 1), 0) / Math.min(i + 1, config.lookbackWindow);
            const volumeRatio = volume / avgVolume;
            
            trades.push({
              symbol,
              date: dayData.date,
              action: "SELL",
              price: execution.executedPrice,
              shares: sellResult.actualQuantity,
              supportLevel: support || undefined,
              resistanceLevel: resistance || undefined,
              breakoutType: 'DOWNWARD',
              volumeRatio
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
