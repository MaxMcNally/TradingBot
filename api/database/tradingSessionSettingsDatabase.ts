/**
 * Trading Session Settings Database Operations
 * 
 * Handles all database operations for trading session settings
 */

import { db } from '../initDb';
import { TradingSessionSettings, TradingSessionSettingsUpdate, TradingDay } from '../types/tradingSessionSettings';

export class TradingSessionSettingsDatabase {
  /**
   * Create settings for a trading session
   */
  static async createSettings(settings: TradingSessionSettings): Promise<TradingSessionSettings> {
    return new Promise((resolve, reject) => {
      const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
      
      // Handle trading_days array for different databases
      const tradingDaysValue = isPostgres 
        ? settings.trading_days 
        : JSON.stringify(settings.trading_days);

      const fields = [
        'session_id',
        'stop_loss_percentage',
        'take_profit_percentage',
        'max_position_size_percentage',
        'max_daily_loss_percentage',
        'max_daily_loss_absolute',
        'time_in_force',
        'allow_partial_fills',
        'extended_hours',
        'order_type_default',
        'limit_price_offset_percentage',
        'max_open_positions',
        'position_sizing_method',
        'position_size_value',
        'rebalance_frequency',
        'trading_hours_start',
        'trading_hours_end',
        'trading_days',
        'enable_trailing_stop',
        'trailing_stop_percentage',
        'enable_bracket_orders',
        'enable_oco_orders',
        'commission_rate',
        'slippage_model',
        'slippage_value',
      ];

      const placeholders = isPostgres 
        ? fields.map((_, i) => `$${i + 1}`).join(', ')
        : fields.map(() => '?').join(', ');

      const values = [
        settings.session_id,
        settings.stop_loss_percentage ?? null,
        settings.take_profit_percentage ?? null,
        settings.max_position_size_percentage,
        settings.max_daily_loss_percentage ?? null,
        settings.max_daily_loss_absolute ?? null,
        settings.time_in_force,
        isPostgres ? settings.allow_partial_fills : (settings.allow_partial_fills ? 1 : 0),
        isPostgres ? settings.extended_hours : (settings.extended_hours ? 1 : 0),
        settings.order_type_default,
        settings.limit_price_offset_percentage ?? null,
        settings.max_open_positions,
        settings.position_sizing_method,
        settings.position_size_value,
        settings.rebalance_frequency,
        settings.trading_hours_start,
        settings.trading_hours_end,
        tradingDaysValue,
        isPostgres ? settings.enable_trailing_stop : (settings.enable_trailing_stop ? 1 : 0),
        settings.trailing_stop_percentage ?? null,
        isPostgres ? settings.enable_bracket_orders : (settings.enable_bracket_orders ? 1 : 0),
        isPostgres ? settings.enable_oco_orders : (settings.enable_oco_orders ? 1 : 0),
        settings.commission_rate,
        settings.slippage_model,
        settings.slippage_value,
      ];

      const sql = `
        INSERT INTO trading_session_settings (${fields.join(', ')})
        VALUES (${placeholders})
        ${isPostgres ? 'RETURNING *' : ''}
      `;

      if (isPostgres) {
        db.get(sql, values, (err: any, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.normalizeSettings(row));
          }
        });
      } else {
        db.run(sql, values, function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            // Fetch the created record
            TradingSessionSettingsDatabase.getSettingsBySessionId(settings.session_id)
              .then(resolve)
              .catch(reject);
          }
        });
      }
    });
  }

  /**
   * Get settings by session ID
   */
  static async getSettingsBySessionId(sessionId: number): Promise<TradingSessionSettings | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM trading_session_settings WHERE session_id = $1',
        [sessionId],
        (err: any, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? this.normalizeSettings(row) : null);
          }
        }
      );
    });
  }

  /**
   * Update settings for a session
   */
  static async updateSettings(
    sessionId: number,
    updates: TradingSessionSettingsUpdate
  ): Promise<TradingSessionSettings> {
    return new Promise((resolve, reject) => {
      const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
      
      const fields: string[] = [];
      const values: any[] = [];

      Object.keys(updates).forEach((key) => {
        const value = (updates as any)[key];
        if (value !== undefined) {
          fields.push(key);
          
          // Handle special cases
          if (key === 'trading_days') {
            values.push(isPostgres ? value : JSON.stringify(value));
          } else if (key === 'allow_partial_fills' || key === 'extended_hours' || 
                     key === 'enable_trailing_stop' || key === 'enable_bracket_orders' || 
                     key === 'enable_oco_orders') {
            values.push(isPostgres ? value : (value ? 1 : 0));
          } else {
            values.push(value);
          }
        }
      });

      if (fields.length === 0) {
        // No updates, return current settings
        return TradingSessionSettingsDatabase.getSettingsBySessionId(sessionId)
          .then(settings => {
            if (!settings) {
              reject(new Error('Settings not found'));
            } else {
              resolve(settings);
            }
          })
          .catch(reject);
      }

      const setClause = isPostgres
        ? fields.map((field, index) => `${field} = $${index + 1}`).join(', ')
        : fields.map((field, index) => `${field} = ?`).join(', ');

      const sql = `
        UPDATE trading_session_settings
        SET ${setClause}, updated_at = ${isPostgres ? 'NOW()' : 'CURRENT_TIMESTAMP'}
        WHERE session_id = ${isPostgres ? `$${fields.length + 1}` : '?'}
        ${isPostgres ? 'RETURNING *' : ''}
      `;

      values.push(sessionId);

      if (isPostgres) {
        db.get(sql, values, (err: any, row: any) => {
          if (err) {
            reject(err);
          } else {
            if (!row) {
              reject(new Error('Settings not found'));
            } else {
              resolve(this.normalizeSettings(row));
            }
          }
        });
      } else {
        db.run(sql, values, function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            TradingSessionSettingsDatabase.getSettingsBySessionId(sessionId)
              .then(settings => {
                if (!settings) {
                  reject(new Error('Settings not found'));
                } else {
                  resolve(settings);
                }
              })
              .catch(reject);
          }
        });
      }
    });
  }

  /**
   * Delete settings for a session
   */
  static async deleteSettings(sessionId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM trading_session_settings WHERE session_id = $1',
        [sessionId],
        (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Normalize settings from database format to TypeScript format
   */
  private static normalizeSettings(row: any): TradingSessionSettings {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    // Valid trading day values
    const validTradingDays: TradingDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    
    // Parse and validate trading_days
    let tradingDays: TradingDay[] = [];
    if (isPostgres) {
      const parsed = Array.isArray(row.trading_days) ? row.trading_days : [];
      tradingDays = parsed.filter((day: any): day is TradingDay => 
        typeof day === 'string' && validTradingDays.includes(day as TradingDay)
      );
    } else {
      try {
        const parsed = typeof row.trading_days === 'string' 
          ? JSON.parse(row.trading_days) 
          : row.trading_days || [];
        tradingDays = Array.isArray(parsed) 
          ? parsed.filter((day: any): day is TradingDay => 
              typeof day === 'string' && validTradingDays.includes(day as TradingDay)
            )
          : [];
      } catch {
        tradingDays = [];
      }
    }

    // Normalize booleans
    const normalizeBool = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value === 1;
      if (typeof value === 'string') return value === 'true' || value === '1';
      return false;
    };

    return {
      id: row.id,
      session_id: row.session_id,
      stop_loss_percentage: row.stop_loss_percentage,
      take_profit_percentage: row.take_profit_percentage,
      max_position_size_percentage: row.max_position_size_percentage,
      max_daily_loss_percentage: row.max_daily_loss_percentage,
      max_daily_loss_absolute: row.max_daily_loss_absolute,
      time_in_force: row.time_in_force,
      allow_partial_fills: normalizeBool(row.allow_partial_fills),
      extended_hours: normalizeBool(row.extended_hours),
      order_type_default: row.order_type_default,
      limit_price_offset_percentage: row.limit_price_offset_percentage,
      max_open_positions: row.max_open_positions,
      position_sizing_method: row.position_sizing_method,
      position_size_value: row.position_size_value,
      rebalance_frequency: row.rebalance_frequency,
      trading_hours_start: row.trading_hours_start,
      trading_hours_end: row.trading_hours_end,
      trading_days: tradingDays,
      enable_trailing_stop: normalizeBool(row.enable_trailing_stop),
      trailing_stop_percentage: row.trailing_stop_percentage,
      enable_bracket_orders: normalizeBool(row.enable_bracket_orders),
      enable_oco_orders: normalizeBool(row.enable_oco_orders),
      commission_rate: row.commission_rate,
      slippage_model: row.slippage_model,
      slippage_value: row.slippage_value,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

