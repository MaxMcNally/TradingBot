import axios, { AxiosInstance, AxiosError } from 'axios';
import { ALPACA_PAPER_URL, ALPACA_LIVE_URL, ALPACA_DATA_URL } from '../../src/config/alpacaConfig';

// Environment check: Only paper trading allowed in non-production environments
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

export interface AlpacaCredentials {
  apiKey: string;
  apiSecret: string;
  isPaper: boolean;
}

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  regt_buying_power: string;
  daytrading_buying_power: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  trade_suspended_by_user: boolean;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
  last_maintenance_margin: string;
  sma: string;
  daytrade_count: number;
  created_at: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  asset_marginable: boolean;
  qty: string;
  avg_entry_price: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  replaced_at: string | null;
  replaced_by: string | null;
  replaces: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional: string | null;
  qty: string;
  filled_qty: string;
  filled_avg_price: string | null;
  order_class: string;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  status: string;
  extended_hours: boolean;
  legs: any[] | null;
  trail_percent: string | null;
  trail_price: string | null;
  hwm: string | null;
}

export interface OrderRequest {
  symbol: string;
  qty?: number;
  notional?: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
  trail_price?: number;
  trail_percent?: number;
  extended_hours?: boolean;
  client_order_id?: string;
  order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
}

export class AlpacaService {
  private client: AxiosInstance;
  private dataClient: AxiosInstance;
  private isPaper: boolean;

  constructor(credentials: AlpacaCredentials) {
    // SECURITY: Force paper trading in non-production environments
    if (!IS_PRODUCTION && !credentials.isPaper) {
      console.warn('⚠️ Live trading is disabled in non-production environments. Forcing paper trading mode.');
      credentials.isPaper = true;
    }

    // Even in production, we should be cautious
    if (IS_PRODUCTION && !credentials.isPaper) {
      console.warn('🔴 WARNING: Live trading mode is enabled. This is a production environment with real money.');
    }

    this.isPaper = credentials.isPaper;
    const baseURL = credentials.isPaper ? ALPACA_PAPER_URL : ALPACA_LIVE_URL;

    this.client = axios.create({
      baseURL,
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
        'Content-Type': 'application/json',
      },
    });

    this.dataClient = axios.create({
      baseURL: ALPACA_DATA_URL,
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Test the connection to Alpaca API
   */
  async testConnection(): Promise<{ success: boolean; account?: AlpacaAccount; error?: string }> {
    try {
      const account = await this.getAccount();
      return {
        success: true,
        account,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data 
        ? JSON.stringify(axiosError.response.data) 
        : axiosError.message;
      return {
        success: false,
        error: `Failed to connect to Alpaca: ${errorMessage}`,
      };
    }
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<AlpacaAccount> {
    const response = await this.client.get<AlpacaAccount>('/v2/account');
    return response.data;
  }

  /**
   * Get all open positions
   */
  async getPositions(): Promise<AlpacaPosition[]> {
    const response = await this.client.get<AlpacaPosition[]>('/v2/positions');
    return response.data;
  }

  /**
   * Get a specific position by symbol
   */
  async getPosition(symbol: string): Promise<AlpacaPosition | null> {
    try {
      const response = await this.client.get<AlpacaPosition>(`/v2/positions/${symbol}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Submit a new order
   */
  async submitOrder(order: OrderRequest): Promise<AlpacaOrder> {
    // Additional safety check for paper trading
    if (!this.isPaper && !IS_PRODUCTION) {
      throw new Error('Live trading is only allowed in production environment');
    }

    const response = await this.client.post<AlpacaOrder>('/v2/orders', order);
    return response.data;
  }

  /**
   * Submit a market buy order (simplified)
   */
  async marketBuy(symbol: string, qty: number): Promise<AlpacaOrder> {
    return this.submitOrder({
      symbol,
      qty,
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    });
  }

  /**
   * Submit a market sell order (simplified)
   */
  async marketSell(symbol: string, qty: number): Promise<AlpacaOrder> {
    return this.submitOrder({
      symbol,
      qty,
      side: 'sell',
      type: 'market',
      time_in_force: 'day',
    });
  }

  /**
   * Submit a limit buy order
   */
  async limitBuy(symbol: string, qty: number, limitPrice: number): Promise<AlpacaOrder> {
    return this.submitOrder({
      symbol,
      qty,
      side: 'buy',
      type: 'limit',
      time_in_force: 'day',
      limit_price: limitPrice,
    });
  }

  /**
   * Submit a limit sell order
   */
  async limitSell(symbol: string, qty: number, limitPrice: number): Promise<AlpacaOrder> {
    return this.submitOrder({
      symbol,
      qty,
      side: 'sell',
      type: 'limit',
      time_in_force: 'day',
      limit_price: limitPrice,
    });
  }

  /**
   * Get all orders (with optional status filter)
   */
  async getOrders(status?: 'open' | 'closed' | 'all', limit?: number): Promise<AlpacaOrder[]> {
    const params: Record<string, any> = {};
    if (status) params.status = status;
    if (limit) params.limit = limit;
    
    const response = await this.client.get<AlpacaOrder[]>('/v2/orders', { params });
    return response.data;
  }

  /**
   * Get a specific order by ID
   */
  async getOrder(orderId: string): Promise<AlpacaOrder> {
    const response = await this.client.get<AlpacaOrder>(`/v2/orders/${orderId}`);
    return response.data;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    await this.client.delete(`/v2/orders/${orderId}`);
  }

  /**
   * Cancel all open orders
   */
  async cancelAllOrders(): Promise<void> {
    await this.client.delete('/v2/orders');
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string, qty?: number, percentage?: number): Promise<AlpacaOrder> {
    const params: Record<string, any> = {};
    if (qty) params.qty = qty;
    if (percentage) params.percentage = percentage;
    
    const response = await this.client.delete<AlpacaOrder>(`/v2/positions/${symbol}`, { params });
    return response.data;
  }

  /**
   * Close all positions
   */
  async closeAllPositions(cancelOrders: boolean = true): Promise<AlpacaOrder[]> {
    const response = await this.client.delete<AlpacaOrder[]>('/v2/positions', {
      params: { cancel_orders: cancelOrders },
    });
    return response.data;
  }

  /**
   * Get clock (market status)
   */
  async getClock(): Promise<{
    timestamp: string;
    is_open: boolean;
    next_open: string;
    next_close: string;
  }> {
    const response = await this.client.get('/v2/clock');
    return response.data;
  }

  /**
   * Get calendar (trading days)
   */
  async getCalendar(start?: string, end?: string): Promise<Array<{
    date: string;
    open: string;
    close: string;
  }>> {
    const params: Record<string, any> = {};
    if (start) params.start = start;
    if (end) params.end = end;
    
    const response = await this.client.get('/v2/calendar', { params });
    return response.data;
  }

  /**
   * Get the trading mode (paper or live)
   */
  getTradingMode(): 'paper' | 'live' {
    return this.isPaper ? 'paper' : 'live';
  }

  /**
   * Check if paper trading mode is active
   */
  isPaperTrading(): boolean {
    return this.isPaper;
  }
}

/**
 * Create an AlpacaService instance from credentials
 * This function enforces paper trading in non-production environments
 */
export const createAlpacaService = (credentials: AlpacaCredentials): AlpacaService => {
  // Force paper trading in non-production
  if (!IS_PRODUCTION) {
    credentials.isPaper = true;
  }
  
  return new AlpacaService(credentials);
};

/**
 * Validate Alpaca credentials format
 */
export const validateCredentials = (apiKey: string, apiSecret: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // API key format: typically starts with PK or AK and is about 20 characters
  if (!apiKey || apiKey.length < 10) {
    errors.push('API Key is required and must be at least 10 characters');
  }
  
  // API secret format: typically 40+ characters
  if (!apiSecret || apiSecret.length < 20) {
    errors.push('API Secret is required and must be at least 20 characters');
  }
  
  // Check for obviously invalid values
  if (apiKey && (apiKey.includes(' ') || apiKey.includes('\n'))) {
    errors.push('API Key contains invalid characters');
  }
  
  if (apiSecret && (apiSecret.includes(' ') || apiSecret.includes('\n'))) {
    errors.push('API Secret contains invalid characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
