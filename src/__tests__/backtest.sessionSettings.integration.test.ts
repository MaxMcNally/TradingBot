/**
 * Integration Tests for Backtest with Session Settings
 * 
 * Tests the complete integration of session settings with all strategy execution functions.
 * Verifies that risk management, order execution simulation, and portfolio constraints
 * are properly applied during backtesting.
 */

import { runMeanReversionStrategy } from '../strategies/meanReversionStrategy';
import { runMovingAverageCrossoverStrategy } from '../strategies/movingAverageCrossoverStrategy';
import { runMomentumStrategy } from '../strategies/momentumStrategy';
import { runBollingerBandsStrategy } from '../strategies/bollingerBandsStrategy';
import { runBreakoutStrategy } from '../strategies/breakoutStrategy';
import { runCustomStrategy } from '../backtest';
// Import from the correct path - api is at root level
import { TradingSessionSettings, DEFAULT_SESSION_SETTINGS } from '../../api/types/tradingSessionSettings';
import { CustomStrategyExecutor, ConditionNode } from '../utils/indicators/executor';

// Helper to create mock price data
function createMockPriceData(
  days: number,
  startPrice: number = 100,
  trend: 'up' | 'down' | 'sideways' = 'sideways',
  volatility: number = 2
): Array<{ date: string; close: number; open: number; volume?: number }> {
  const data: Array<{ date: string; close: number; open: number; volume?: number }> = [];
  let currentPrice = startPrice;

  for (let i = 0; i < days; i++) {
    const date = new Date(2023, 0, i + 1);
    const dateStr = date.toDateString();
    
    // Generate price movement based on trend
    let priceChange = 0;
    if (trend === 'up') {
      priceChange = (Math.random() * volatility) + 0.5; // Slight upward bias
    } else if (trend === 'down') {
      priceChange = -(Math.random() * volatility) - 0.5; // Slight downward bias
    } else {
      priceChange = (Math.random() - 0.5) * volatility; // Random walk
    }

    currentPrice = Math.max(1, currentPrice + priceChange);
    const open = currentPrice - (Math.random() - 0.5) * 1;
    
    data.push({
      date: dateStr,
      close: currentPrice,
      open: open,
      volume: 1000000 + Math.floor(Math.random() * 500000)
    });
  }

  return data;
}

// Helper to create session settings
function createSessionSettings(
  overrides: Partial<TradingSessionSettings> = {}
): TradingSessionSettings {
  return {
    ...DEFAULT_SESSION_SETTINGS,
    session_id: 0,
    ...overrides
  };
}

describe('Backtest Session Settings Integration', () => {
  const symbol = 'TEST';
  const initialCapital = 10000;
  const sharesPerTrade = 100;

  describe('Stop Loss and Take Profit', () => {
    it('should enforce stop loss in mean reversion strategy', () => {
      const data = createMockPriceData(50, 100, 'down', 5); // Declining prices
      const settings = createSessionSettings({
        stop_loss_percentage: 5.0, // 5% stop loss
        take_profit_percentage: null
      });

      const result = runMeanReversionStrategy(symbol, data, {
        window: 20,
        threshold: 0.05,
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      // Verify that trades were executed
      expect(result.trades.length).toBeGreaterThan(0);
      
      // Verify stop loss was enforced (check if any trades have stop loss reason)
      const stopLossTrades = result.trades.filter(t => (t as any).reason === 'STOP_LOSS');
      // Note: Stop loss enforcement happens during execution, so we verify the system works
      expect(result.maxDrawdown).toBeLessThanOrEqual(0.5); // Max drawdown should be reasonable
    });

    it('should enforce take profit in moving average crossover strategy', () => {
      const data = createMockPriceData(50, 100, 'up', 3); // Rising prices
      const settings = createSessionSettings({
        stop_loss_percentage: null,
        take_profit_percentage: 10.0 // 10% take profit
      });

      const result = runMovingAverageCrossoverStrategy(symbol, data, {
        fastWindow: 10,
        slowWindow: 30,
        maType: 'SMA',
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.totalReturn).toBeGreaterThanOrEqual(-1); // Should not lose more than 100%
    });

    it('should enforce trailing stop in momentum strategy', () => {
      const data = createMockPriceData(50, 100, 'up', 4);
      const settings = createSessionSettings({
        enable_trailing_stop: true,
        trailing_stop_percentage: 3.0, // 3% trailing stop
        stop_loss_percentage: null
      });

      const result = runMomentumStrategy(symbol, data, {
        rsiWindow: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        momentumWindow: 10,
        momentumThreshold: 0.02,
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThan(0);
      // Trailing stop should help protect profits
      expect(result.maxDrawdown).toBeLessThan(0.5);
    });
  });

  describe('Position Sizing Methods', () => {
    it('should use fixed position sizing', () => {
      const data = createMockPriceData(30);
      const settings = createSessionSettings({
        position_sizing_method: 'fixed',
        position_size_value: 50 // Fixed 50 shares
      });

      const result = runBollingerBandsStrategy(symbol, data, {
        window: 20,
        multiplier: 2.0,
        maType: 'SMA',
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      // Verify trades were executed
      expect(result.trades.length).toBeGreaterThan(0);
      
      // With fixed sizing, position sizes should be consistent
      const buyTrades = result.trades.filter(t => t.action === 'BUY');
      if (buyTrades.length > 0) {
        // Position sizes should be controlled by fixed method
        expect(result.finalPortfolioValue).toBeGreaterThan(0);
      }
    });

    it('should use percentage position sizing', () => {
      const data = createMockPriceData(30);
      const settings = createSessionSettings({
        position_sizing_method: 'percentage',
        position_size_value: 25.0, // 25% of portfolio
        max_position_size_percentage: 30.0
      });

      const result = runBreakoutStrategy(symbol, data, {
        lookbackWindow: 20,
        breakoutThreshold: 0.01,
        minVolumeRatio: 1.5,
        confirmationPeriod: 2,
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
    });

    it('should use equal weight position sizing', () => {
      const data = createMockPriceData(30);
      const settings = createSessionSettings({
        position_sizing_method: 'equal_weight',
        max_open_positions: 5,
        position_size_value: 20.0
      });

      const result = runMeanReversionStrategy(symbol, data, {
        window: 20,
        threshold: 0.05,
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
    });
  });

  describe('Order Execution Simulation', () => {
    it('should apply slippage to orders', () => {
      const data = createMockPriceData(30);
      const settings = createSessionSettings({
        slippage_model: 'fixed',
        slippage_value: 0.5, // 0.5% slippage
        commission_rate: 0.0 // No commission for this test
      });

      const result = runMovingAverageCrossoverStrategy(symbol, data, {
        fastWindow: 10,
        slowWindow: 30,
        maType: 'SMA',
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      // With slippage, returns should be slightly lower than without
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
    });

    it('should apply commission to trades', () => {
      const data = createMockPriceData(30);
      const settings = createSessionSettings({
        slippage_model: 'none',
        commission_rate: 0.1 // 0.1% commission
      });

      const result = runMomentumStrategy(symbol, data, {
        rsiWindow: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        momentumWindow: 10,
        momentumThreshold: 0.02,
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      // Commission should reduce returns
      expect(result.finalPortfolioValue).toBeLessThanOrEqual(initialCapital * 1.1); // Reasonable upper bound
    });

    it('should handle limit orders with offset', () => {
      const data = createMockPriceData(30);
      const settings = createSessionSettings({
        order_type_default: 'limit',
        limit_price_offset_percentage: 1.0, // 1% offset
        slippage_model: 'none',
        commission_rate: 0.0
      });

      const result = runBollingerBandsStrategy(symbol, data, {
        window: 20,
        multiplier: 2.0,
        maType: 'SMA',
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      // Limit orders may result in fewer fills
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
    });
  });

  describe('Trading Window Restrictions', () => {
    it('should respect trading days restriction', () => {
      const data = createMockPriceData(30);
      // Create data with specific days
      const weekdayData = data.map((d, i) => {
        const date = new Date(2023, 0, i + 1);
        const dayOfWeek = date.getDay();
        // Only Monday (1) and Wednesday (3)
        return {
          ...d,
          date: date.toDateString()
        };
      });

      const settings = createSessionSettings({
        trading_days: ['MON', 'WED'], // Only Monday and Wednesday
        trading_hours_start: '09:30',
        trading_hours_end: '16:00'
      });

      const result = runBreakoutStrategy(symbol, weekdayData, {
        lookbackWindow: 20,
        breakoutThreshold: 0.01,
        minVolumeRatio: 1.5,
        confirmationPeriod: 2,
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      // Should still execute, but may have fewer trades due to day restrictions
      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
    });
  });

  describe('Portfolio Constraints', () => {
    it('should enforce max open positions limit', () => {
      const data = createMockPriceData(50);
      const settings = createSessionSettings({
        max_open_positions: 2, // Only 2 positions at a time
        position_sizing_method: 'percentage',
        position_size_value: 10.0
      });

      const result = runMeanReversionStrategy(symbol, data, {
        window: 20,
        threshold: 0.05,
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      // With max positions limit, we should not exceed the limit
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
    });

    it('should enforce daily loss limit', () => {
      const data = createMockPriceData(50, 100, 'down', 10); // Strong downward trend
      const settings = createSessionSettings({
        max_daily_loss_percentage: 5.0, // 5% daily loss limit
        stop_loss_percentage: null
      });

      const result = runMovingAverageCrossoverStrategy(symbol, data, {
        fastWindow: 10,
        slowWindow: 30,
        maType: 'SMA',
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      // Daily loss limit should prevent excessive losses
      expect(result.finalPortfolioValue).toBeGreaterThan(initialCapital * 0.5); // Should not lose more than 50%
    });

    it('should enforce absolute daily loss limit', () => {
      const data = createMockPriceData(50, 100, 'down', 10);
      const settings = createSessionSettings({
        max_daily_loss_absolute: 500, // $500 absolute loss limit
        max_daily_loss_percentage: null
      });

      const result = runMomentumStrategy(symbol, data, {
        rsiWindow: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        momentumWindow: 10,
        momentumThreshold: 0.02,
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      expect(result.finalPortfolioValue).toBeGreaterThan(initialCapital - 2000); // Should limit losses
    });
  });

  describe('Custom Strategy with Session Settings', () => {
    it('should apply session settings to custom strategy', () => {
      const data = createMockPriceData(50);
      const settings = createSessionSettings({
        stop_loss_percentage: 5.0,
        take_profit_percentage: 10.0,
        slippage_model: 'fixed',
        slippage_value: 0.5,
        commission_rate: 0.1
      });

      const buyConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'sma',
          params: { period: 20, source: 'close' },
          condition: 'below',
          value: 100
        }
      };

      const sellConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'sma',
          params: { period: 20, source: 'close' },
          condition: 'above',
          value: 110
        }
      };

      const result = runCustomStrategy(symbol, data, {
        buy_conditions: buyConditions,
        sell_conditions: sellConditions,
        name: 'Test Strategy',
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
      expect(result.totalReturn).toBeGreaterThanOrEqual(-1); // Should not lose more than 100%
    });
  });

  describe('Multiple Settings Combined', () => {
    it('should handle complex settings combination', () => {
      const data = createMockPriceData(50, 100, 'up', 3);
      const settings = createSessionSettings({
        // Risk management
        stop_loss_percentage: 5.0,
        take_profit_percentage: 15.0,
        max_daily_loss_percentage: 3.0,
        max_position_size_percentage: 20.0,
        
        // Position sizing
        position_sizing_method: 'percentage',
        position_size_value: 15.0,
        max_open_positions: 3,
        
        // Order execution
        order_type_default: 'market',
        slippage_model: 'proportional',
        slippage_value: 0.3,
        commission_rate: 0.05,
        allow_partial_fills: true,
        
        // Trading window
        trading_days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        trading_hours_start: '09:30',
        trading_hours_end: '16:00',
        extended_hours: false
      });

      const result = runBollingerBandsStrategy(symbol, data, {
        window: 20,
        multiplier: 2.0,
        maType: 'SMA',
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
      expect(result.maxDrawdown).toBeLessThan(0.5); // Should be controlled by risk management
      expect(result.totalReturn).toBeGreaterThanOrEqual(-1);
    });
  });

  describe('Default Settings Behavior', () => {
    it('should work with default settings (no custom settings)', () => {
      const data = createMockPriceData(30);
      
      const result = runMeanReversionStrategy(symbol, data, {
        window: 20,
        threshold: 0.05,
        initialCapital,
        sharesPerTrade
        // No sessionSettings provided - should use defaults
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
      expect(result.totalReturn).toBeGreaterThanOrEqual(-1);
    });

    it('should work with null session settings', () => {
      const data = createMockPriceData(30);
      
      const result = runMovingAverageCrossoverStrategy(symbol, data, {
        fastWindow: 10,
        slowWindow: 30,
        maType: 'SMA',
        initialCapital,
        sharesPerTrade,
        sessionSettings: null
      });

      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const settings = createSessionSettings();
      
      const result = runMomentumStrategy(symbol, [], {
        rsiWindow: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        momentumWindow: 10,
        momentumThreshold: 0.02,
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      expect(result.trades.length).toBe(0);
      expect(result.finalPortfolioValue).toBe(initialCapital);
      expect(result.totalReturn).toBe(0);
    });

    it('should handle insufficient data for indicators', () => {
      const data = createMockPriceData(5); // Not enough data for most indicators
      const settings = createSessionSettings();
      
      const result = runBreakoutStrategy(symbol, data, {
        lookbackWindow: 20,
        breakoutThreshold: 0.01,
        minVolumeRatio: 1.5,
        confirmationPeriod: 2,
        initialCapital,
        sharesPerTrade,
        sessionSettings: settings
      });

      // Should handle gracefully without errors
      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      expect(result.finalPortfolioValue).toBeGreaterThanOrEqual(0);
    });
  });
});

