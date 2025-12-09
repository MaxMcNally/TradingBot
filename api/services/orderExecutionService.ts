/**
 * Order Execution Service
 * 
 * Handles order submission with session settings applied
 * Works with any trading provider through the ITradingProvider interface
 */

import { ITradingProvider, OrderRequest, OrderResponse } from '../interfaces/ITradingProvider';
import { TradingSessionSettings } from '../types/tradingSessionSettings';
import { RiskManagementService } from './riskManagementService';

export class OrderExecutionService {
  /**
   * Prepare order request with session settings applied
   */
  static prepareOrderRequest(
    baseOrder: Partial<OrderRequest>,
    settings: TradingSessionSettings,
    portfolioValue: number
  ): OrderRequest {
    const order: OrderRequest = {
      symbol: baseOrder.symbol!,
      side: baseOrder.side!,
      type: baseOrder.type || settings.order_type_default,
      timeInForce: settings.allow_partial_fills 
        ? settings.time_in_force 
        : 'fok', // Force FOK if partial fills disabled
      extendedHours: settings.extended_hours,
      ...baseOrder,
    };

    // Calculate position size if not provided
    if (!order.qty && !order.notional) {
      const positionSize = RiskManagementService.calculatePositionSize(
        settings,
        portfolioValue,
        order.symbol
      );
      order.notional = positionSize;
    }

    // Apply limit price offset if using limit orders
    if (order.type === 'limit' && settings.limit_price_offset_percentage !== null && settings.limit_price_offset_percentage !== undefined) {
      // This would need current market price - handled by caller if needed
      // For now, we'll let the caller set limit_price explicitly
    }

    // Apply bracket orders if enabled
    if (settings.enable_bracket_orders) {
      order.orderClass = 'bracket';
      // Stop loss and take profit prices would be calculated based on entry price
      // This is typically handled by the trading provider
    }

    // Apply trailing stop if enabled
    if (settings.enable_trailing_stop && settings.trailing_stop_percentage !== null && settings.trailing_stop_percentage !== undefined) {
      if (order.type === 'trailing_stop' || settings.order_type_default === 'trailing_stop') {
        order.type = 'trailing_stop';
        order.trailPercent = settings.trailing_stop_percentage;
      }
    }

    // Apply OCO orders if enabled
    if (settings.enable_oco_orders) {
      order.orderClass = 'oco';
    }

    return order;
  }

  /**
   * Submit order with risk checks and settings applied
   */
  static async submitOrder(
    provider: ITradingProvider,
    settings: TradingSessionSettings,
    baseOrder: Partial<OrderRequest>
  ): Promise<{ success: boolean; order?: OrderResponse; error?: string }> {
    try {
      // Check trading window
      const windowCheck = RiskManagementService.checkTradingWindow(settings);
      if (!windowCheck.allowed) {
        return {
          success: false,
          error: windowCheck.reason,
        };
      }

      // Get account info for position sizing
      const account = await provider.getAccount();

      // Check max open positions
      const maxPositionsCheck = await RiskManagementService.checkMaxOpenPositions(provider, settings);
      if (!maxPositionsCheck.allowed) {
        return {
          success: false,
          error: maxPositionsCheck.reason,
        };
      }

      // Calculate position value for risk checks
      const positionSize = RiskManagementService.calculatePositionSize(
        settings,
        account.portfolioValue,
        baseOrder.symbol
      );

      // Check position size limit
      const positionSizeCheck = await RiskManagementService.checkPositionSizeLimit(
        provider,
        settings,
        baseOrder.symbol!,
        positionSize
      );
      if (!positionSizeCheck.allowed) {
        return {
          success: false,
          error: positionSizeCheck.reason,
        };
      }

      // Prepare order with settings
      const orderRequest = this.prepareOrderRequest(baseOrder, settings, account.portfolioValue);

      // Submit order
      const order = await provider.submitOrder(orderRequest);

      return {
        success: true,
        order,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error submitting order',
      };
    }
  }
}

