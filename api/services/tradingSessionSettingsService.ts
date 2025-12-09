/**
 * Trading Session Settings Service
 * 
 * Handles validation, creation, and updates of trading session settings
 * with proper security and validation
 */

import { TradingSessionSettings, TradingSessionSettingsUpdate, DEFAULT_SESSION_SETTINGS, SettingsValidationResult } from '../types/tradingSessionSettings';
import { db } from '../initDb';

export class TradingSessionSettingsService {
  /**
   * Validate trading session settings
   */
  static validateSettings(settings: Partial<TradingSessionSettings>): SettingsValidationResult {
    const errors: string[] = [];

    // Risk Management Validation
    if (settings.stop_loss_percentage !== undefined && settings.stop_loss_percentage !== null) {
      if (settings.stop_loss_percentage < 0 || settings.stop_loss_percentage > 100) {
        errors.push('stop_loss_percentage must be between 0 and 100');
      }
    }

    if (settings.take_profit_percentage !== undefined && settings.take_profit_percentage !== null) {
      if (settings.take_profit_percentage < 0 || settings.take_profit_percentage > 100) {
        errors.push('take_profit_percentage must be between 0 and 100');
      }
    }

    if (settings.max_position_size_percentage !== undefined) {
      if (settings.max_position_size_percentage < 0 || settings.max_position_size_percentage > 100) {
        errors.push('max_position_size_percentage must be between 0 and 100');
      }
    }

    if (settings.max_daily_loss_percentage !== undefined && settings.max_daily_loss_percentage !== null) {
      if (settings.max_daily_loss_percentage < 0 || settings.max_daily_loss_percentage > 100) {
        errors.push('max_daily_loss_percentage must be between 0 and 100');
      }
    }

    if (settings.max_daily_loss_absolute !== undefined && settings.max_daily_loss_absolute !== null) {
      if (settings.max_daily_loss_absolute < 0) {
        errors.push('max_daily_loss_absolute must be positive');
      }
    }

    // Order Execution Validation
    const validTimeInForce = ['day', 'gtc', 'opg', 'cls', 'ioc', 'fok'];
    if (settings.time_in_force !== undefined && !validTimeInForce.includes(settings.time_in_force)) {
      errors.push(`time_in_force must be one of: ${validTimeInForce.join(', ')}`);
    }

    const validOrderTypes = ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'];
    if (settings.order_type_default !== undefined && !validOrderTypes.includes(settings.order_type_default)) {
      errors.push(`order_type_default must be one of: ${validOrderTypes.join(', ')}`);
    }

    if (settings.limit_price_offset_percentage !== undefined && settings.limit_price_offset_percentage !== null) {
      if (settings.limit_price_offset_percentage < -100 || settings.limit_price_offset_percentage > 100) {
        errors.push('limit_price_offset_percentage must be between -100 and 100');
      }
    }

    // Position Management Validation
    if (settings.max_open_positions !== undefined) {
      if (!Number.isInteger(settings.max_open_positions) || settings.max_open_positions < 1) {
        errors.push('max_open_positions must be a positive integer');
      }
    }

    const validSizingMethods = ['fixed', 'percentage', 'kelly', 'equal_weight'];
    if (settings.position_sizing_method !== undefined && !validSizingMethods.includes(settings.position_sizing_method)) {
      errors.push(`position_sizing_method must be one of: ${validSizingMethods.join(', ')}`);
    }

    if (settings.position_size_value !== undefined) {
      if (settings.position_size_value <= 0) {
        errors.push('position_size_value must be positive');
      }
    }

    const validRebalanceFreq = ['never', 'daily', 'weekly', 'on_signal'];
    if (settings.rebalance_frequency !== undefined && !validRebalanceFreq.includes(settings.rebalance_frequency)) {
      errors.push(`rebalance_frequency must be one of: ${validRebalanceFreq.join(', ')}`);
    }

    // Trading Window Validation
    if (settings.trading_hours_start !== undefined) {
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(settings.trading_hours_start)) {
        errors.push('trading_hours_start must be in HH:mm format (24-hour)');
      }
    }

    if (settings.trading_hours_end !== undefined) {
      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(settings.trading_hours_end)) {
        errors.push('trading_hours_end must be in HH:mm format (24-hour)');
      }
    }

    if (settings.trading_hours_start && settings.trading_hours_end) {
      const start = this.parseTime(settings.trading_hours_start);
      const end = this.parseTime(settings.trading_hours_end);
      if (start >= end) {
        errors.push('trading_hours_end must be after trading_hours_start');
      }
    }

    if (settings.trading_days !== undefined) {
      const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const invalidDays = settings.trading_days.filter(day => !validDays.includes(day));
      if (invalidDays.length > 0) {
        errors.push(`Invalid trading days: ${invalidDays.join(', ')}. Must be one of: ${validDays.join(', ')}`);
      }
    }

    // Advanced Settings Validation
    if (settings.trailing_stop_percentage !== undefined && settings.trailing_stop_percentage !== null) {
      if (settings.trailing_stop_percentage < 0 || settings.trailing_stop_percentage > 100) {
        errors.push('trailing_stop_percentage must be between 0 and 100');
      }
    }

    if (settings.commission_rate !== undefined) {
      if (settings.commission_rate < 0) {
        errors.push('commission_rate must be non-negative');
      }
    }

    const validSlippageModels = ['none', 'fixed', 'proportional'];
    if (settings.slippage_model !== undefined && !validSlippageModels.includes(settings.slippage_model)) {
      errors.push(`slippage_model must be one of: ${validSlippageModels.join(', ')}`);
    }

    if (settings.slippage_value !== undefined) {
      if (settings.slippage_value < 0) {
        errors.push('slippage_value must be non-negative');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse time string (HH:mm) to minutes since midnight
   */
  private static parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Create default settings for a session
   */
  static createDefaultSettings(sessionId: number): TradingSessionSettings {
    return {
      ...DEFAULT_SESSION_SETTINGS,
      session_id: sessionId,
    };
  }

  /**
   * Merge settings with defaults
   */
  static mergeWithDefaults(
    sessionId: number,
    partialSettings?: Partial<TradingSessionSettings>
  ): TradingSessionSettings {
    return {
      ...DEFAULT_SESSION_SETTINGS,
      ...partialSettings,
      session_id: sessionId,
    };
  }
}

