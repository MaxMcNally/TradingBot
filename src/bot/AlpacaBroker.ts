import axios, { AxiosInstance, AxiosError } from 'axios';

// Environment check: Only paper trading allowed in non-production environments
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Alpaca API URLs
const ALPACA_PAPER_URL = 'https://paper-api.alpaca.markets';
const ALPACA_LIVE_URL = 'https://api.alpaca.markets';

export interface AlpacaCredentials {
  apiKey: string;
  apiSecret: string;
  isPaper: boolean;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  symbol: string;
  qty: string;
  filled_qty: string;
  filled_avg_price: string | null;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  status: string;
}

export interface BrokerTradeResult {
  success: boolean;
  orderId?: string;
  filledPrice?: number;
  filledQty?: number;
  status?: string;
  error?: string;
}

/**
 * AlpacaBroker - A lightweight broker class for executing trades via Alpaca API
 * Used by the TradingBot to send paper trading orders to Alpaca
 */
export class AlpacaBroker {
  private client: AxiosInstance;
  private isPaper: boolean;
  private isConnected: boolean = false;

  constructor(credentials: AlpacaCredentials) {
    // SECURITY: Force paper trading in non-production environments
    if (!IS_PRODUCTION && !credentials.isPaper) {
      console.warn('⚠️ AlpacaBroker: Live trading is disabled in non-production. Forcing paper mode.');
      credentials.isPaper = true;
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
  }

  /**
   * Test the connection to Alpaca API
   */
  async connect(): Promise<boolean> {
    try {
      const response = await this.client.get('/v2/account');
      if (response.data && response.data.id) {
        this.isConnected = true;
        console.log(`🔗 AlpacaBroker: Connected to Alpaca (${this.isPaper ? 'paper' : 'live'} mode)`);
        return true;
      }
      return false;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ AlpacaBroker: Connection failed:', axiosError.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Check if broker is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Get trading mode
   */
  getTradingMode(): 'paper' | 'live' {
    return this.isPaper ? 'paper' : 'live';
  }

  /**
   * Execute a market buy order
   */
  async marketBuy(symbol: string, qty: number): Promise<BrokerTradeResult> {
    return this.submitOrder(symbol, qty, 'buy', 'market');
  }

  /**
   * Execute a market sell order
   */
  async marketSell(symbol: string, qty: number): Promise<BrokerTradeResult> {
    return this.submitOrder(symbol, qty, 'sell', 'market');
  }

  /**
   * Execute a limit buy order
   */
  async limitBuy(symbol: string, qty: number, limitPrice: number): Promise<BrokerTradeResult> {
    return this.submitOrder(symbol, qty, 'buy', 'limit', limitPrice);
  }

  /**
   * Execute a limit sell order
   */
  async limitSell(symbol: string, qty: number, limitPrice: number): Promise<BrokerTradeResult> {
    return this.submitOrder(symbol, qty, 'sell', 'limit', limitPrice);
  }

  /**
   * Submit an order to Alpaca
   */
  private async submitOrder(
    symbol: string,
    qty: number,
    side: 'buy' | 'sell',
    type: 'market' | 'limit',
    limitPrice?: number
  ): Promise<BrokerTradeResult> {
    // Safety check
    if (!this.isPaper && !IS_PRODUCTION) {
      return {
        success: false,
        error: 'Live trading is only allowed in production environment',
      };
    }

    if (!this.isConnected) {
      return {
        success: false,
        error: 'Broker not connected. Call connect() first.',
      };
    }

    try {
      const orderPayload: any = {
        symbol,
        qty: qty.toString(),
        side,
        type,
        time_in_force: 'day',
      };

      if (type === 'limit' && limitPrice) {
        orderPayload.limit_price = limitPrice.toString();
      }

      console.log(`📊 AlpacaBroker: Submitting ${side.toUpperCase()} order for ${qty} ${symbol} (${type})`);

      const response = await this.client.post<AlpacaOrder>('/v2/orders', orderPayload);
      const order = response.data;

      console.log(`✅ AlpacaBroker: Order submitted - ID: ${order.id}, Status: ${order.status}`);

      return {
        success: true,
        orderId: order.id,
        filledPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined,
        filledQty: order.filled_qty ? parseFloat(order.filled_qty) : undefined,
        status: order.status,
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Unknown error';
      console.error(`❌ AlpacaBroker: Order failed - ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get order status by ID
   */
  async getOrderStatus(orderId: string): Promise<BrokerTradeResult> {
    try {
      const response = await this.client.get<AlpacaOrder>(`/v2/orders/${orderId}`);
      const order = response.data;

      return {
        success: true,
        orderId: order.id,
        filledPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined,
        filledQty: order.filled_qty ? parseFloat(order.filled_qty) : undefined,
        status: order.status,
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      return {
        success: false,
        error: axiosError.response?.data?.message || axiosError.message,
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<BrokerTradeResult> {
    try {
      await this.client.delete(`/v2/orders/${orderId}`);
      return { success: true, orderId };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      return {
        success: false,
        error: axiosError.response?.data?.message || axiosError.message,
      };
    }
  }

  /**
   * Get account buying power
   */
  async getBuyingPower(): Promise<number> {
    try {
      const response = await this.client.get('/v2/account');
      return parseFloat(response.data.buying_power) || 0;
    } catch (error) {
      console.error('AlpacaBroker: Failed to get buying power:', error);
      return 0;
    }
  }

  /**
   * Get current positions
   */
  async getPositions(): Promise<Map<string, { qty: number; avgPrice: number; marketValue: number }>> {
    const positions = new Map();
    try {
      const response = await this.client.get('/v2/positions');
      for (const pos of response.data) {
        positions.set(pos.symbol, {
          qty: parseFloat(pos.qty),
          avgPrice: parseFloat(pos.avg_entry_price),
          marketValue: parseFloat(pos.market_value),
        });
      }
    } catch (error) {
      console.error('AlpacaBroker: Failed to get positions:', error);
    }
    return positions;
  }

  /**
   * Get a specific position
   */
  async getPosition(symbol: string): Promise<{ qty: number; avgPrice: number; marketValue: number } | null> {
    try {
      const response = await this.client.get(`/v2/positions/${symbol}`);
      return {
        qty: parseFloat(response.data.qty),
        avgPrice: parseFloat(response.data.avg_entry_price),
        marketValue: parseFloat(response.data.market_value),
      };
    } catch (error) {
      // Position doesn't exist
      return null;
    }
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string): Promise<BrokerTradeResult> {
    try {
      const response = await this.client.delete(`/v2/positions/${symbol}`);
      return {
        success: true,
        orderId: response.data?.id,
        status: response.data?.status || 'closed',
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      return {
        success: false,
        error: axiosError.response?.data?.message || axiosError.message,
      };
    }
  }

  /**
   * Check if market is open
   */
  async isMarketOpen(): Promise<boolean> {
    try {
      const response = await this.client.get('/v2/clock');
      return response.data.is_open === true;
    } catch (error) {
      console.error('AlpacaBroker: Failed to check market status:', error);
      return false;
    }
  }
}

/**
 * Create an AlpacaBroker instance from credentials
 * Enforces paper trading in non-production environments
 */
export const createAlpacaBroker = async (credentials: AlpacaCredentials): Promise<AlpacaBroker | null> => {
  // Force paper trading in non-production
  if (!IS_PRODUCTION) {
    credentials.isPaper = true;
  }

  const broker = new AlpacaBroker(credentials);
  const connected = await broker.connect();

  if (!connected) {
    console.error('Failed to create AlpacaBroker: Connection failed');
    return null;
  }

  return broker;
};
