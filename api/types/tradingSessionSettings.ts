/**
 * Trading Session Settings Types
 * 
 * Defines all types and interfaces for trading session configuration
 */

export type TimeInForce = 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
export type PositionSizingMethod = 'fixed' | 'percentage' | 'kelly' | 'equal_weight';
export type RebalanceFrequency = 'never' | 'daily' | 'weekly' | 'on_signal';
export type SlippageModel = 'none' | 'fixed' | 'proportional';
export type TradingDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

/**
 * Trading Session Settings Interface
 * 
 * All settings with their types and validation rules
 */
export interface TradingSessionSettings {
  id?: number;
  session_id: number;
  
  // Risk Management
  stop_loss_percentage?: number | null;
  take_profit_percentage?: number | null;
  max_position_size_percentage: number;
  max_daily_loss_percentage?: number | null;
  max_daily_loss_absolute?: number | null;
  
  // Order Execution
  time_in_force: TimeInForce;
  allow_partial_fills: boolean;
  extended_hours: boolean;
  order_type_default: OrderType;
  limit_price_offset_percentage?: number | null;
  
  // Position Management
  max_open_positions: number;
  position_sizing_method: PositionSizingMethod;
  position_size_value: number;
  rebalance_frequency: RebalanceFrequency;
  
  // Trading Window
  trading_hours_start: string; // HH:mm format in UTC
  trading_hours_end: string; // HH:mm format in UTC
  trading_days: TradingDay[];
  
  // Advanced
  enable_trailing_stop: boolean;
  trailing_stop_percentage?: number | null;
  enable_bracket_orders: boolean;
  enable_oco_orders: boolean;
  commission_rate: number;
  slippage_model: SlippageModel;
  slippage_value: number;
  
  created_at?: string;
  updated_at?: string;
}

/**
 * Default settings for new trading sessions
 */
export const DEFAULT_SESSION_SETTINGS: Omit<TradingSessionSettings, 'id' | 'session_id' | 'created_at' | 'updated_at'> = {
  // Risk Management
  stop_loss_percentage: null,
  take_profit_percentage: null,
  max_position_size_percentage: 25.0,
  max_daily_loss_percentage: null,
  max_daily_loss_absolute: null,
  
  // Order Execution
  time_in_force: 'day',
  allow_partial_fills: true,
  extended_hours: false,
  order_type_default: 'market',
  limit_price_offset_percentage: null,
  
  // Position Management
  max_open_positions: 10,
  position_sizing_method: 'percentage',
  position_size_value: 10.0,
  rebalance_frequency: 'never',
  
  // Trading Window
  trading_hours_start: '09:30',
  trading_hours_end: '16:00',
  trading_days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  
  // Advanced
  enable_trailing_stop: false,
  trailing_stop_percentage: null,
  enable_bracket_orders: false,
  enable_oco_orders: false,
  commission_rate: 0.0,
  slippage_model: 'none',
  slippage_value: 0.0,
};

/**
 * Partial settings for updates
 */
export type TradingSessionSettingsUpdate = Partial<Omit<TradingSessionSettings, 'id' | 'session_id' | 'created_at' | 'updated_at'>>;

/**
 * Settings validation result
 */
export interface SettingsValidationResult {
  valid: boolean;
  errors: string[];
}

