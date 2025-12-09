/**
 * BacktestPortfolio - Enhanced portfolio for backtesting with session settings
 * 
 * Extends basic portfolio functionality with:
 * - Position sizing methods (fixed, percentage, Kelly, equal weight)
 * - Risk management (stop loss, take profit, position limits)
 * - Trading window restrictions
 * - Daily loss tracking
 */

import { Portfolio, Position, PortfolioStatus } from '../portfolio';
import { TradingSessionSettings, PositionSizingMethod, TradingDay } from '../../api/types/tradingSessionSettings';
import { TradingMode, TradingModeType } from '../config';

export interface BacktestPosition extends Position {
  entryDate: string;
  entryPrice: number;
  highestPrice?: number; // For trailing stops
}

export interface BacktestPortfolioStatus extends PortfolioStatus {
  dailyPnL: number;
  totalPnL: number;
  openPositionsCount: number;
}

export class BacktestPortfolio extends Portfolio {
  private settings: TradingSessionSettings | null;
  private initialCapital: number;
  private dailyPnL: number = 0;
  private totalPnL: number = 0;
  private lastTradeDate: string = '';
  private positions: Record<string, BacktestPosition>;
  private dailyLossLimitReached: boolean = false;

  constructor(
    initialCash: number = 10000,
    mode: TradingModeType = TradingMode.PAPER,
    symbols: string[] = [],
    settings: TradingSessionSettings | null = null
  ) {
    super(initialCash, mode, symbols);
    this.settings = settings;
    this.initialCapital = initialCash;
    this.positions = {};
    symbols.forEach((symbol) => {
      this.positions[symbol] = { shares: 0, avgPrice: 0, entryDate: '', entryPrice: 0 };
    });
  }

  /**
   * Calculate position size based on sizing method
   */
  calculatePositionSize(
    symbol: string,
    price: number,
    currentDate: string
  ): number {
    if (!this.settings) {
      // Default: use fixed shares (legacy behavior)
      return 100;
    }

    const status = this.status({ [symbol]: price });
    const totalValue = status.totalValue;
    const method = this.settings.position_sizing_method;

    switch (method) {
      case 'fixed':
        return this.settings.position_size_value;

      case 'percentage':
        const targetValue = totalValue * (this.settings.position_size_value / 100);
        const maxValue = totalValue * (this.settings.max_position_size_percentage / 100);
        const actualValue = Math.min(targetValue, maxValue);
        return Math.floor(actualValue / price);

      case 'equal_weight':
        const openPositions = this.getOpenPositionsCount();
        const maxPositions = this.settings.max_open_positions;
        if (openPositions >= maxPositions) {
          return 0; // Can't open new position
        }
        const availableCapital = totalValue / maxPositions;
        return Math.floor(availableCapital / price);

      case 'kelly':
        // Simplified Kelly Criterion
        // In a real implementation, this would use win rate and average win/loss
        const kellyFraction = this.settings.position_size_value / 100; // Use position_size_value as Kelly fraction
        const kellyValue = totalValue * kellyFraction;
        const maxValueKelly = totalValue * (this.settings.max_position_size_percentage / 100);
        const actualValueKelly = Math.min(kellyValue, maxValueKelly);
        return Math.floor(actualValueKelly / price);

      default:
        return 100;
    }
  }

  /**
   * Check if we can open a new position
   */
  canOpenPosition(symbol: string, price: number, currentDate: string): { allowed: boolean; reason?: string } {
    if (!this.settings) {
      return { allowed: true };
    }

    // Check daily loss limit
    if (this.dailyLossLimitReached) {
      // Reset if new day
      if (currentDate !== this.lastTradeDate) {
        this.dailyLossLimitReached = false;
        this.dailyPnL = 0;
        this.lastTradeDate = currentDate;
      } else {
        return { allowed: false, reason: 'Daily loss limit reached' };
      }
    }

    // Check max open positions
    const openPositions = this.getOpenPositionsCount();
    if (openPositions >= this.settings.max_open_positions) {
      return { allowed: false, reason: `Max open positions limit reached (${this.settings.max_open_positions})` };
    }

    // Check position size limit
    const status = this.status({ [symbol]: price });
    const currentPosition = this.positions[symbol];
    const currentPositionValue = (currentPosition?.shares || 0) * price;
    const maxPositionValue = status.totalValue * (this.settings.max_position_size_percentage / 100);
    
    if (currentPositionValue >= maxPositionValue) {
      return { allowed: false, reason: `Position size limit reached for ${symbol}` };
    }

    // Check trading window
    if (!this.isWithinTradingWindow(currentDate)) {
      return { allowed: false, reason: 'Outside trading window' };
    }

    return { allowed: true };
  }

  /**
   * Check if stop loss or take profit should trigger
   */
  checkStopLossTakeProfit(symbol: string, currentPrice: number): 'STOP_LOSS' | 'TAKE_PROFIT' | null {
    if (!this.settings) {
      return null;
    }

    const position = this.positions[symbol];
    if (!position || position.shares === 0) {
      return null;
    }

    const entryPrice = position.entryPrice || position.avgPrice;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

    // Check stop loss
    if (this.settings.stop_loss_percentage && pnlPercent <= -this.settings.stop_loss_percentage) {
      return 'STOP_LOSS';
    }

    // Check take profit
    if (this.settings.take_profit_percentage && pnlPercent >= this.settings.take_profit_percentage) {
      return 'TAKE_PROFIT';
    }

    // Check trailing stop
    if (this.settings.enable_trailing_stop && this.settings.trailing_stop_percentage) {
      if (!position.highestPrice || currentPrice > position.highestPrice) {
        position.highestPrice = currentPrice;
      }
      
      if (position.highestPrice) {
        const trailingStopPrice = position.highestPrice * (1 - this.settings.trailing_stop_percentage / 100);
        if (currentPrice <= trailingStopPrice) {
          return 'STOP_LOSS';
        }
      }
    }

    return null;
  }

  /**
   * Enhanced buy with position sizing and risk checks
   */
  buy(symbol: string, price: number, currentDate: string, quantity?: number): { success: boolean; actualQuantity: number; reason?: string } {
    // Check if we can open position
    const canOpen = this.canOpenPosition(symbol, price, currentDate);
    if (!canOpen.allowed) {
      return { success: false, actualQuantity: 0, reason: canOpen.reason };
    }

    // Calculate position size if not provided
    const targetQuantity = quantity || this.calculatePositionSize(symbol, price, currentDate);
    if (targetQuantity === 0) {
      return { success: false, actualQuantity: 0, reason: 'Position size calculation returned 0' };
    }

    // Execute buy
    const cost = price * targetQuantity;
    const status = this.status({ [symbol]: price });
    
    if (status.cash >= cost) {
      const pos = this.positions[symbol] || { shares: 0, avgPrice: 0, entryDate: currentDate, entryPrice: price };
      pos.avgPrice = (pos.avgPrice * pos.shares + cost) / (pos.shares + targetQuantity);
      pos.shares += targetQuantity;
      pos.entryDate = currentDate;
      pos.entryPrice = price;
      pos.highestPrice = price;
      
      // Update cash (accessing private field via any for now)
      (this as any).cash -= cost;
      (this as any).positions[symbol] = pos;
      
      this.lastTradeDate = currentDate;
      return { success: true, actualQuantity: targetQuantity };
    }

    return { success: false, actualQuantity: 0, reason: 'Insufficient cash' };
  }

  /**
   * Enhanced sell with P&L tracking
   */
  sell(symbol: string, price: number, currentDate: string, quantity?: number): { success: boolean; actualQuantity: number; pnl: number } {
    const pos = this.positions[symbol];
    if (!pos || pos.shares === 0) {
      return { success: false, actualQuantity: 0, pnl: 0 };
    }

    const sellQuantity = quantity || pos.shares;
    const actualQuantity = Math.min(sellQuantity, pos.shares);
    const proceeds = price * actualQuantity;
    const entryPrice = pos.entryPrice || pos.avgPrice;
    const pnl = (price - entryPrice) * actualQuantity;

    // Update position
    pos.shares -= actualQuantity;
    if (pos.shares === 0) {
      pos.avgPrice = 0;
      pos.entryPrice = 0;
      pos.entryDate = '';
      pos.highestPrice = undefined;
    }

    // Update cash
    (this as any).cash += proceeds;
    
    // Track P&L
    this.totalPnL += pnl;
    this.dailyPnL += pnl;
    this.lastTradeDate = currentDate;

    // Check daily loss limit
    if (this.settings) {
      const status = this.status({ [symbol]: price });
      const dailyLossPercent = Math.abs(this.dailyPnL) / this.initialCapital * 100;
      
      if (this.settings.max_daily_loss_percentage && dailyLossPercent >= this.settings.max_daily_loss_percentage) {
        this.dailyLossLimitReached = true;
      }
      
      if (this.settings.max_daily_loss_absolute && Math.abs(this.dailyPnL) >= this.settings.max_daily_loss_absolute) {
        this.dailyLossLimitReached = true;
      }
    }

    return { success: true, actualQuantity, pnl };
  }

  /**
   * Check if current date/time is within trading window
   */
  isWithinTradingWindow(currentDate: string): boolean {
    if (!this.settings) {
      return true; // No restrictions
    }

    const date = new Date(currentDate);
    const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()] as TradingDay;
    
    // Check trading days
    if (!this.settings.trading_days.includes(dayOfWeek)) {
      return false;
    }

    // Check trading hours (simplified - assumes UTC)
    if (!this.settings.extended_hours) {
      const [startHour, startMin] = this.settings.trading_hours_start.split(':').map(Number);
      const [endHour, endMin] = this.settings.trading_hours_end.split(':').map(Number);
      const currentHour = date.getUTCHours();
      const currentMin = date.getUTCMinutes();
      const currentTime = currentHour * 60 + currentMin;
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (currentTime < startTime || currentTime > endTime) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get count of open positions
   */
  getOpenPositionsCount(): number {
    let count = 0;
    for (const symbol in this.positions) {
      if (this.positions[symbol].shares > 0) {
        count++;
      }
    }
    return count;
  }

  /**
   * Enhanced status with additional metrics
   */
  status(latestPrices: Record<string, number> = {}): BacktestPortfolioStatus {
    const baseStatus = super.status(latestPrices);
    return {
      ...baseStatus,
      dailyPnL: this.dailyPnL,
      totalPnL: this.totalPnL,
      openPositionsCount: this.getOpenPositionsCount()
    };
  }

  /**
   * Reset daily P&L (called at start of new trading day)
   */
  resetDailyPnL(currentDate: string): void {
    if (currentDate !== this.lastTradeDate) {
      this.dailyPnL = 0;
      this.dailyLossLimitReached = false;
      this.lastTradeDate = currentDate;
    }
  }
}

