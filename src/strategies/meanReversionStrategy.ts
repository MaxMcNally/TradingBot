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
  portfolioHistory: Array<{
    date: string;
    portfolioValue: number;
    cash: number;
    shares: number;
    price: number;
  }>;
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
 * Run the mean reversion strategy on historical data with session settings support
 * 
 * @param symbol - Stock symbol
 * @param data - Historical price data
 * @param config - Strategy configuration
 * @returns Backtest results
 */
export function runMeanReversionStrategy(
  symbol: string,
  data: { date: string; close: number, open: number, volume?: number }[],
  config: MeanReversionConfig & {
    initialCapital: number;
    sharesPerTrade: number;
    sessionSettings?: any; // TradingSessionSettings - avoid circular dependency
  }
): MeanReversionResult {
  const trades: MeanReversionTrade[] = [];
  const strategy = new MeanReversionStrategy({
    window: config.window,
    threshold: config.threshold
  });

  // Import here to avoid circular dependency
  const { BacktestPortfolio } = require('../backtest/BacktestPortfolio');
  const { OrderExecutionSimulator } = require('../backtest/OrderExecutionSimulator');
  const { TradingMode } = require('../config');
  const { DEFAULT_SESSION_SETTINGS } = require('../api/types/tradingSessionSettings');

  // Create session settings (use defaults if not provided)
  const settings = config.sessionSettings || {
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

  for (let i = 0; i < data.length; i++) {
    const dayData = data[i];
    
    // Reset daily P&L if new day
    portfolio.resetDailyPnL(dayData.date);
    
    strategy.addPrice(dayData.close);
    const signal = strategy.getSignal();
    const movingAverage = strategy.getCurrentMovingAverage();

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
            const deviation = movingAverage ? (execution.executedPrice - (movingAverage || 0)) / (movingAverage || 1) : undefined;
            trades.push({
              symbol,
              date: dayData.date,
              action: "SELL",
              price: execution.executedPrice,
              shares: sellResult.actualQuantity,
              movingAverage: movingAverage || undefined,
              deviation,
              reason: stopLossTakeProfit,
              commission: execution.commission,
              slippage: execution.slippage
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
            const deviation = movingAverage ? (execution.executedPrice - (movingAverage || 0)) / (movingAverage || 1) : undefined;
            trades.push({
              symbol,
              date: dayData.date,
              action: "BUY",
              price: execution.executedPrice,
              shares: buyResult.actualQuantity,
              movingAverage: movingAverage || undefined,
              deviation,
              commission: execution.commission,
              slippage: execution.slippage
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
            const deviation = movingAverage ? (execution.executedPrice - (movingAverage || 0)) / (movingAverage || 1) : undefined;
            
            trades.push({
              symbol,
              date: dayData.date,
              action: "SELL",
              price: execution.executedPrice,
              shares: sellResult.actualQuantity,
              movingAverage: movingAverage || undefined,
              deviation,
              commission: execution.commission,
              slippage: execution.slippage
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
