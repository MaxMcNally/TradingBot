/**
 * OrderExecutionSimulator - Simulates realistic order execution for backtesting
 * 
 * Handles:
 * - Slippage models (none, fixed, proportional)
 * - Commission calculation
 * - Order types (market, limit, stop, stop_limit)
 * - Time in force (day, GTC, IOC, FOK)
 * - Partial fills
 */

import { TradingSessionSettings, SlippageModel, OrderType, TimeInForce } from '../../api/types/tradingSessionSettings';

export interface ExecutionResult {
  executed: boolean;
  executedPrice: number;
  executedQuantity: number;
  commission: number;
  slippage: number;
  reason?: string;
}

export interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  orderType: OrderType;
  limitPrice?: number;
  stopPrice?: number;
  currentPrice: number;
  volume?: number; // For partial fill simulation
  timestamp: string;
}

export class OrderExecutionSimulator {
  private settings: TradingSessionSettings;

  constructor(settings: TradingSessionSettings) {
    this.settings = settings;
  }

  /**
   * Simulate order execution
   */
  executeOrder(order: OrderRequest): ExecutionResult {
    // Check time in force
    if (!this.isOrderValid(order)) {
      return {
        executed: false,
        executedPrice: order.currentPrice,
        executedQuantity: 0,
        commission: 0,
        slippage: 0,
        reason: 'Order expired or invalid'
      };
    }

    // Execute based on order type
    let executionPrice = order.currentPrice;
    let executedQuantity = order.quantity;

    switch (order.orderType) {
      case 'market':
        executionPrice = this.applySlippage(order.currentPrice, order.quantity, order.side);
        executedQuantity = this.handlePartialFills(order.quantity, order.volume);
        break;

      case 'limit':
        if (order.limitPrice) {
          const canExecute = order.side === 'BUY' 
            ? order.currentPrice <= order.limitPrice
            : order.currentPrice >= order.limitPrice;
          
          if (!canExecute) {
            return {
              executed: false,
              executedPrice: order.currentPrice,
              executedQuantity: 0,
              commission: 0,
              slippage: 0,
              reason: 'Limit price not reached'
            };
          }
          
          executionPrice = order.limitPrice;
          executionPrice = this.applySlippage(executionPrice, order.quantity, order.side);
          executedQuantity = this.handlePartialFills(order.quantity, order.volume);
        }
        break;

      case 'stop':
        if (order.stopPrice) {
          const triggered = order.side === 'BUY'
            ? order.currentPrice >= order.stopPrice
            : order.currentPrice <= order.stopPrice;
          
          if (!triggered) {
            return {
              executed: false,
              executedPrice: order.currentPrice,
              executedQuantity: 0,
              commission: 0,
              slippage: 0,
              reason: 'Stop price not triggered'
            };
          }
          
          executionPrice = this.applySlippage(order.currentPrice, order.quantity, order.side);
          executedQuantity = this.handlePartialFills(order.quantity, order.volume);
        }
        break;

      case 'stop_limit':
        if (order.stopPrice && order.limitPrice) {
          const stopTriggered = order.side === 'BUY'
            ? order.currentPrice >= order.stopPrice
            : order.currentPrice <= order.stopPrice;
          
          if (!stopTriggered) {
            return {
              executed: false,
              executedPrice: order.currentPrice,
              executedQuantity: 0,
              commission: 0,
              slippage: 0,
              reason: 'Stop price not triggered'
            };
          }

          const limitMet = order.side === 'BUY'
            ? order.currentPrice <= order.limitPrice
            : order.currentPrice >= order.limitPrice;
          
          if (!limitMet) {
            return {
              executed: false,
              executedPrice: order.currentPrice,
              executedQuantity: 0,
              commission: 0,
              slippage: 0,
              reason: 'Limit price not reached after stop triggered'
            };
          }

          executionPrice = order.limitPrice;
          executionPrice = this.applySlippage(executionPrice, order.quantity, order.side);
          executedQuantity = this.handlePartialFills(order.quantity, order.volume);
        }
        break;

      case 'trailing_stop':
        // Trailing stops are handled at portfolio level
        executionPrice = this.applySlippage(order.currentPrice, order.quantity, order.side);
        executedQuantity = this.handlePartialFills(order.quantity, order.volume);
        break;

      default:
        executionPrice = this.applySlippage(order.currentPrice, order.quantity, order.side);
        executedQuantity = this.handlePartialFills(order.quantity, order.volume);
    }

    // Calculate commission
    const commission = this.calculateCommission(executionPrice, executedQuantity);
    
    // Calculate slippage
    const slippage = Math.abs(executionPrice - order.currentPrice) * executedQuantity;

    return {
      executed: executedQuantity > 0,
      executedPrice: executionPrice,
      executedQuantity,
      commission,
      slippage,
    };
  }

  /**
   * Apply slippage based on model
   */
  private applySlippage(price: number, quantity: number, side: 'BUY' | 'SELL'): number {
    if (this.settings.slippage_model === 'none') {
      return price;
    }

    const slippagePercent = this.settings.slippage_value / 100;
    let slippageMultiplier = 1;

    if (this.settings.slippage_model === 'fixed') {
      slippageMultiplier = side === 'BUY' ? 1 + slippagePercent : 1 - slippagePercent;
    } else if (this.settings.slippage_model === 'proportional') {
      // Proportional slippage increases with trade size
      // Simplified: use a base slippage that scales with quantity
      const baseSlippage = slippagePercent;
      const sizeMultiplier = Math.min(1 + (quantity / 1000) * 0.1, 2); // Cap at 2x
      slippageMultiplier = side === 'BUY' 
        ? 1 + (baseSlippage * sizeMultiplier)
        : 1 - (baseSlippage * sizeMultiplier);
    }

    return price * slippageMultiplier;
  }

  /**
   * Calculate commission
   */
  private calculateCommission(price: number, quantity: number): number {
    if (this.settings.commission_rate === 0) {
      return 0;
    }

    // Commission is typically per share or per trade
    // Using per-share model here (can be adjusted)
    return price * quantity * (this.settings.commission_rate / 100);
  }

  /**
   * Handle partial fills based on volume
   */
  private handlePartialFills(quantity: number, availableVolume?: number): number {
    if (!this.settings.allow_partial_fills) {
      // If partial fills not allowed, need full volume
      if (availableVolume && availableVolume < quantity) {
        return 0; // Can't fill
      }
      return quantity;
    }

    // If partial fills allowed and volume is limited
    if (availableVolume && availableVolume < quantity) {
      // Fill what's available (simplified - in reality would depend on order book)
      return Math.floor(availableVolume * 0.8); // Assume 80% of volume is available
    }

    return quantity;
  }

  /**
   * Check if order is still valid based on time in force
   */
  private isOrderValid(order: OrderRequest): boolean {
    // Simplified implementation - in reality would track order age
    // For backtesting, we assume orders execute immediately or are checked per bar
    
    switch (this.settings.time_in_force) {
      case 'day':
        // Valid for the trading day - in backtest, we execute immediately
        return true;
      
      case 'gtc':
        // Good until canceled - always valid
        return true;
      
      case 'ioc':
        // Immediate or cancel - must execute immediately
        return true;
      
      case 'fok':
        // Fill or kill - must fill completely immediately
        return true;
      
      case 'opg':
      case 'cls':
        // Opening/closing auctions - simplified to allow
        return true;
      
      default:
        return true;
    }
  }
}

