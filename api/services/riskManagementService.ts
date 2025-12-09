/**
 * Risk Management Service
 * 
 * Enforces risk management rules based on session settings
 * This service is provider-agnostic and works with any trading provider
 */

import { TradingSessionSettings } from '../types/tradingSessionSettings';
import { ITradingProvider, Position, AccountInfo } from '../interfaces/ITradingProvider';
import { TradingDatabase } from '../../src/database/tradingSchema';

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
}

export class RiskManagementService {
  /**
   * Check if a new position can be opened based on risk limits
   */
  static async checkPositionSizeLimit(
    provider: ITradingProvider,
    settings: TradingSessionSettings,
    symbol: string,
    positionValue: number
  ): Promise<RiskCheckResult> {
    try {
      const account = await provider.getAccount();
      const currentPosition = await provider.getPosition(symbol);
      
      const maxPositionValue = account.portfolioValue * (settings.max_position_size_percentage / 100);
      const currentPositionValue = currentPosition ? currentPosition.marketValue : 0;
      const newTotalValue = currentPositionValue + positionValue;

      if (newTotalValue > maxPositionValue) {
        return {
          allowed: false,
          reason: `Position size limit exceeded. Maximum allowed: $${maxPositionValue.toFixed(2)}, Attempted: $${newTotalValue.toFixed(2)}`,
        };
      }

      return { allowed: true };
    } catch (error) {
      return {
        allowed: false,
        reason: `Error checking position size limit: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if maximum open positions limit is reached
   */
  static async checkMaxOpenPositions(
    provider: ITradingProvider,
    settings: TradingSessionSettings
  ): Promise<RiskCheckResult> {
    try {
      const positions = await provider.getPositions();
      const openPositionsCount = positions.length;

      if (openPositionsCount >= settings.max_open_positions) {
        return {
          allowed: false,
          reason: `Maximum open positions limit reached. Current: ${openPositionsCount}, Maximum: ${settings.max_open_positions}`,
        };
      }

      return { allowed: true };
    } catch (error) {
      return {
        allowed: false,
        reason: `Error checking max open positions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if daily loss limit has been exceeded
   */
  static async checkDailyLossLimit(
    sessionId: number,
    settings: TradingSessionSettings
  ): Promise<RiskCheckResult & { shouldStop: boolean }> {
    try {
      const session = await TradingDatabase.getTradingSessionById(sessionId);
      if (!session) {
        return {
          allowed: false,
          shouldStop: false,
          reason: 'Session not found',
        };
      }

      const currentCash = session.final_cash ?? session.initial_cash;
      const dailyPnL = currentCash - session.initial_cash;

      // Check percentage limit
      if (settings.max_daily_loss_percentage !== null && settings.max_daily_loss_percentage !== undefined) {
        const maxLoss = session.initial_cash * (settings.max_daily_loss_percentage / 100);
        if (dailyPnL <= -maxLoss) {
          return {
            allowed: false,
            shouldStop: true,
            reason: `Daily loss percentage limit exceeded. Loss: ${((dailyPnL / session.initial_cash) * 100).toFixed(2)}%, Limit: ${settings.max_daily_loss_percentage}%`,
          };
        }
      }

      // Check absolute limit
      if (settings.max_daily_loss_absolute !== null && settings.max_daily_loss_absolute !== undefined) {
        if (dailyPnL <= -settings.max_daily_loss_absolute) {
          return {
            allowed: false,
            shouldStop: true,
            reason: `Daily loss absolute limit exceeded. Loss: $${Math.abs(dailyPnL).toFixed(2)}, Limit: $${settings.max_daily_loss_absolute.toFixed(2)}`,
          };
        }
      }

      return { allowed: true, shouldStop: false };
    } catch (error) {
      return {
        allowed: false,
        shouldStop: false,
        reason: `Error checking daily loss limit: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if stop loss should be triggered for a position
   */
  static async checkStopLoss(
    position: Position,
    settings: TradingSessionSettings,
    currentPrice: number
  ): Promise<{ shouldClose: boolean; reason?: string }> {
    if (!settings.stop_loss_percentage) {
      return { shouldClose: false };
    }

    const entryPrice = position.avgEntryPrice;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

    if (pnlPercent <= -settings.stop_loss_percentage) {
      return {
        shouldClose: true,
        reason: `Stop loss triggered. Loss: ${pnlPercent.toFixed(2)}%, Limit: ${settings.stop_loss_percentage}%`,
      };
    }

    return { shouldClose: false };
  }

  /**
   * Check if take profit should be triggered for a position
   */
  static async checkTakeProfit(
    position: Position,
    settings: TradingSessionSettings,
    currentPrice: number
  ): Promise<{ shouldClose: boolean; reason?: string }> {
    if (!settings.take_profit_percentage) {
      return { shouldClose: false };
    }

    const entryPrice = position.avgEntryPrice;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

    if (pnlPercent >= settings.take_profit_percentage) {
      return {
        shouldClose: true,
        reason: `Take profit triggered. Gain: ${pnlPercent.toFixed(2)}%, Target: ${settings.take_profit_percentage}%`,
      };
    }

    return { shouldClose: false };
  }

  /**
   * Check if trading is allowed based on trading window settings
   */
  static checkTradingWindow(settings: TradingSessionSettings): RiskCheckResult {
    const now = new Date();
    const currentDay = this.getDayAbbreviation(now);
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // Check if trading is allowed on this day
    if (!settings.trading_days.includes(currentDay)) {
      return {
        allowed: false,
        reason: `Trading not allowed on ${currentDay}. Allowed days: ${settings.trading_days.join(', ')}`,
      };
    }

    // Check if current time is within trading hours
    if (currentTimeString < settings.trading_hours_start || currentTimeString > settings.trading_hours_end) {
      return {
        allowed: false,
        reason: `Trading not allowed outside trading hours. Current: ${currentTimeString}, Allowed: ${settings.trading_hours_start} - ${settings.trading_hours_end}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get day abbreviation (MON, TUE, etc.)
   */
  private static getDayAbbreviation(date: Date): 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN' {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getUTCDay()] as 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  }

  /**
   * Calculate position size based on settings
   */
  static calculatePositionSize(
    settings: TradingSessionSettings,
    portfolioValue: number,
    symbol?: string
  ): number {
    switch (settings.position_sizing_method) {
      case 'fixed':
        return settings.position_size_value;

      case 'percentage':
        return portfolioValue * (settings.position_size_value / 100);

      case 'equal_weight':
        // This would need to know total number of positions
        // For now, return a percentage-based calculation
        return portfolioValue * (100 / settings.max_open_positions) / 100;

      case 'kelly':
        // Kelly Criterion would require win rate and other stats
        // For now, use a conservative fraction of the Kelly value
        return portfolioValue * (settings.position_size_value / 100);

      default:
        return portfolioValue * (settings.position_size_value / 100);
    }
  }
}

