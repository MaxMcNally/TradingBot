/**
 * Generic Trading Provider Interface
 * 
 * This interface abstracts trading operations to allow easy swapping
 * between different trading APIs (Alpaca, Interactive Brokers, etc.)
 * 
 * All implementations should follow this contract to ensure consistency
 * and enable provider-agnostic trading logic.
 */

export interface TradingCredentials {
  [key: string]: any; // Provider-specific credentials
}

export interface Position {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  side: 'long' | 'short';
}

export interface AccountInfo {
  accountId: string;
  buyingPower: number;
  cash: number;
  portfolioValue: number;
  equity: number;
  dayTradingBuyingPower?: number;
  patternDayTrader?: boolean;
  tradingBlocked?: boolean;
}

export interface OrderRequest {
  symbol: string;
  qty?: number;
  notional?: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  timeInForce: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limitPrice?: number;
  stopPrice?: number;
  trailPrice?: number;
  trailPercent?: number;
  extendedHours?: boolean;
  clientOrderId?: string;
  orderClass?: 'simple' | 'bracket' | 'oco' | 'oto';
}

export interface OrderResponse {
  orderId: string;
  clientOrderId?: string;
  symbol: string;
  status: 'new' | 'partially_filled' | 'filled' | 'done_for_day' | 'canceled' | 'expired' | 'replaced' | 'pending_cancel' | 'pending_replace' | 'accepted' | 'pending_new' | 'accepted_for_bidding' | 'stopped' | 'rejected' | 'suspended' | 'calculated';
  filledQty?: number;
  filledAvgPrice?: number;
  submittedAt: string;
  filledAt?: string;
  canceledAt?: string;
  error?: string;
}

export interface MarketClock {
  timestamp: string;
  isOpen: boolean;
  nextOpen?: string;
  nextClose?: string;
}

export interface Quote {
  symbol: string;
  bidPrice: number;
  askPrice: number;
  bidSize: number;
  askSize: number;
  timestamp: string;
}

/**
 * Generic Trading Provider Interface
 * 
 * All trading providers (Alpaca, IB, etc.) must implement this interface
 */
export interface ITradingProvider {
  /**
   * Initialize the provider with credentials
   */
  initialize(credentials: TradingCredentials): Promise<void>;

  /**
   * Test the connection to the trading API
   */
  testConnection(): Promise<{ success: boolean; account?: AccountInfo; error?: string }>;

  /**
   * Get account information
   */
  getAccount(): Promise<AccountInfo>;

  /**
   * Get all open positions
   */
  getPositions(): Promise<Position[]>;

  /**
   * Get a specific position by symbol
   */
  getPosition(symbol: string): Promise<Position | null>;

  /**
   * Submit an order
   */
  submitOrder(order: OrderRequest): Promise<OrderResponse>;

  /**
   * Get order status by ID
   */
  getOrderStatus(orderId: string): Promise<OrderResponse>;

  /**
   * Cancel an order
   */
  cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Cancel all open orders
   */
  cancelAllOrders(): Promise<{ success: boolean; error?: string }>;

  /**
   * Close a position
   */
  closePosition(symbol: string, qty?: number, percentage?: number): Promise<OrderResponse>;

  /**
   * Close all positions
   */
  closeAllPositions(cancelOrders?: boolean): Promise<OrderResponse[]>;

  /**
   * Get market clock status
   */
  getMarketClock(): Promise<MarketClock>;

  /**
   * Get quote for a symbol
   */
  getQuote(symbol: string): Promise<Quote>;

  /**
   * Check if market is open
   */
  isMarketOpen(): Promise<boolean>;

  /**
   * Get trading mode (paper/live)
   */
  getTradingMode(): 'paper' | 'live';

  /**
   * Check if provider is ready
   */
  isReady(): boolean;
}

