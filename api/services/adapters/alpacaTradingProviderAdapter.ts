/**
 * Alpaca Trading Provider Adapter
 * 
 * Adapter that wraps AlpacaService to implement ITradingProvider interface
 * This allows Alpaca to be used with the generic trading system
 */

import { AlpacaService, AlpacaCredentials } from '../alpacaService';
import {
  ITradingProvider,
  TradingCredentials,
  AccountInfo,
  Position,
  OrderRequest as GenericOrderRequest,
  OrderResponse,
  MarketClock,
  Quote,
} from '../../interfaces/ITradingProvider';

export class AlpacaTradingProviderAdapter implements ITradingProvider {
  private alpacaService: AlpacaService;
  private initialized: boolean = false;

  constructor(credentials: TradingCredentials) {
    // Convert generic credentials to Alpaca credentials
    const alpacaCreds: AlpacaCredentials = {
      apiKey: credentials.apiKey as string,
      apiSecret: credentials.apiSecret as string,
      isPaper: credentials.isPaper as boolean ?? true,
    };

    this.alpacaService = new AlpacaService(alpacaCreds);
  }

  async initialize(credentials: TradingCredentials): Promise<void> {
    // AlpacaService is initialized in constructor
    // Test connection to verify
    const testResult = await this.testConnection();
    if (!testResult.success) {
      throw new Error(`Failed to initialize Alpaca provider: ${testResult.error}`);
    }
    this.initialized = true;
  }

  async testConnection(): Promise<{ success: boolean; account?: AccountInfo; error?: string }> {
    try {
      const result = await this.alpacaService.testConnection();
      if (result.success && result.account) {
        return {
          success: true,
          account: this.mapAccountInfo(result.account),
        };
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAccount(): Promise<AccountInfo> {
    const account = await this.alpacaService.getAccount();
    return this.mapAccountInfo(account);
  }

  async getPositions(): Promise<Position[]> {
    const positions = await this.alpacaService.getPositions();
    return positions.map(this.mapPosition);
  }

  async getPosition(symbol: string): Promise<Position | null> {
    const position = await this.alpacaService.getPosition(symbol);
    return position ? this.mapPosition(position) : null;
  }

  async submitOrder(order: GenericOrderRequest): Promise<OrderResponse> {
    // Convert generic order request to Alpaca format
    const alpacaOrder: any = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      time_in_force: order.timeInForce,
      extended_hours: order.extendedHours ?? false,
    };

    if (order.qty !== undefined) {
      alpacaOrder.qty = order.qty.toString();
    }
    if (order.notional !== undefined) {
      alpacaOrder.notional = order.notional.toString();
    }
    if (order.limitPrice !== undefined) {
      alpacaOrder.limit_price = order.limitPrice.toString();
    }
    if (order.stopPrice !== undefined) {
      alpacaOrder.stop_price = order.stopPrice.toString();
    }
    if (order.trailPrice !== undefined) {
      alpacaOrder.trail_price = order.trailPrice.toString();
    }
    if (order.trailPercent !== undefined) {
      alpacaOrder.trail_percent = order.trailPercent.toString();
    }
    if (order.clientOrderId !== undefined) {
      alpacaOrder.client_order_id = order.clientOrderId;
    }
    if (order.orderClass !== undefined) {
      alpacaOrder.order_class = order.orderClass;
    }

    const alpacaOrderResponse = await this.alpacaService.submitOrder(alpacaOrder);
    return this.mapOrderResponse(alpacaOrderResponse);
  }

  async getOrderStatus(orderId: string): Promise<OrderResponse> {
    const order = await this.alpacaService.getOrder(orderId);
    return this.mapOrderResponse(order);
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.alpacaService.cancelOrder(orderId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async cancelAllOrders(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.alpacaService.cancelAllOrders();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async closePosition(symbol: string, qty?: number, percentage?: number): Promise<OrderResponse> {
    const order = await this.alpacaService.closePosition(symbol, qty, percentage);
    return this.mapOrderResponse(order);
  }

  async closeAllPositions(cancelOrders: boolean = true): Promise<OrderResponse[]> {
    const orders = await this.alpacaService.closeAllPositions(cancelOrders);
    return orders.map(this.mapOrderResponse);
  }

  async getMarketClock(): Promise<MarketClock> {
    const clock = await this.alpacaService.getClock();
    return {
      timestamp: clock.timestamp,
      isOpen: clock.is_open,
      nextOpen: clock.next_open,
      nextClose: clock.next_close,
    };
  }

  async getQuote(symbol: string): Promise<Quote> {
    // Alpaca doesn't have a direct quote endpoint in the trading API
    // This would need to use the data API or market data
    // For now, return a placeholder that would need to be implemented
    throw new Error('getQuote not yet implemented for Alpaca adapter');
  }

  async isMarketOpen(): Promise<boolean> {
    const clock = await this.getMarketClock();
    return clock.isOpen;
  }

  getTradingMode(): 'paper' | 'live' {
    return this.alpacaService.getTradingMode();
  }

  isReady(): boolean {
    return this.initialized;
  }

  // Mapping functions
  private mapAccountInfo(account: any): AccountInfo {
    return {
      accountId: account.id,
      buyingPower: parseFloat(account.buying_power || '0'),
      cash: parseFloat(account.cash || '0'),
      portfolioValue: parseFloat(account.portfolio_value || '0'),
      equity: parseFloat(account.equity || '0'),
      dayTradingBuyingPower: account.daytrading_buying_power ? parseFloat(account.daytrading_buying_power) : undefined,
      patternDayTrader: account.pattern_day_trader,
      tradingBlocked: account.trading_blocked,
    };
  }

  private mapPosition(position: any): Position {
    const qty = parseFloat(position.qty || '0');
    return {
      symbol: position.symbol,
      qty: Math.abs(qty),
      avgEntryPrice: parseFloat(position.avg_entry_price || '0'),
      marketValue: parseFloat(position.market_value || '0'),
      unrealizedPnL: parseFloat(position.unrealized_pl || '0'),
      unrealizedPnLPercent: parseFloat(position.unrealized_plpc || '0'),
      side: qty >= 0 ? 'long' : 'short',
    };
  }

  private mapOrderResponse(order: any): OrderResponse {
    return {
      orderId: order.id,
      clientOrderId: order.client_order_id,
      symbol: order.symbol,
      status: this.mapOrderStatus(order.status),
      filledQty: order.filled_qty ? parseFloat(order.filled_qty) : undefined,
      filledAvgPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined,
      submittedAt: order.submitted_at || order.created_at,
      filledAt: order.filled_at || undefined,
      canceledAt: order.canceled_at || undefined,
    };
  }

  private mapOrderStatus(status: string): OrderResponse['status'] {
    const statusMap: Record<string, OrderResponse['status']> = {
      'new': 'new',
      'partially_filled': 'partially_filled',
      'filled': 'filled',
      'done_for_day': 'done_for_day',
      'canceled': 'canceled',
      'expired': 'expired',
      'replaced': 'replaced',
      'pending_cancel': 'pending_cancel',
      'pending_replace': 'pending_replace',
      'accepted': 'accepted',
      'pending_new': 'pending_new',
      'accepted_for_bidding': 'accepted_for_bidding',
      'stopped': 'stopped',
      'rejected': 'rejected',
      'suspended': 'suspended',
      'calculated': 'calculated',
    };
    return statusMap[status] || 'new';
  }
}

