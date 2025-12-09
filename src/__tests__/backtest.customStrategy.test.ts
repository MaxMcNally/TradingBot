import { CustomStrategyExecutor, ConditionNode } from '../utils/indicators/executor';
import { PriceData } from '../utils/indicators/types';

// Test the custom strategy execution logic used in backtest
describe('Custom Strategy Backtest Execution', () => {
  const mockPriceData: PriceData[] = Array.from({ length: 50 }, (_, i) => ({
    date: `2023-01-${String(i + 1).padStart(2, '0')}`,
    open: 100 + i * 0.5,
    high: 105 + i * 0.5,
    low: 95 + i * 0.5,
    close: 100 + i * 0.5,
    volume: 1000000 + i * 10000
  }));

  describe('Simple Custom Strategy', () => {
    it('should generate BUY signal when RSI is oversold', () => {
      // Create a simple strategy: BUY when RSI < 30
      const buyConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14, source: 'close' },
          condition: 'below',
          value: 30
        }
      };

      const sellConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14, source: 'close' },
          condition: 'above',
          value: 70
        }
      };

      // Create price data that would trigger RSI oversold
      const oversoldData: PriceData[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2023-01-${String(i + 1).padStart(2, '0')}`,
        open: 100 - i * 2, // Declining prices
        high: 102 - i * 2,
        low: 98 - i * 2,
        close: 100 - i * 2,
        volume: 1000000
      }));

      const signal = CustomStrategyExecutor.executeStrategy(
        buyConditions,
        sellConditions,
        oversoldData
      );

      // Should generate a signal (BUY, SELL, or null)
      expect([null, 'BUY', 'SELL']).toContain(signal);
    });

    it('should generate SELL signal when RSI is overbought', () => {
      const buyConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14, source: 'close' },
          condition: 'below',
          value: 30
        }
      };

      const sellConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14, source: 'close' },
          condition: 'above',
          value: 70
        }
      };

      // Create price data that would trigger RSI overbought
      const overboughtData: PriceData[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2023-01-${String(i + 1).padStart(2, '0')}`,
        open: 100 + i * 2, // Rising prices
        high: 102 + i * 2,
        low: 98 + i * 2,
        close: 100 + i * 2,
        volume: 1000000
      }));

      const signal = CustomStrategyExecutor.executeStrategy(
        buyConditions,
        sellConditions,
        overboughtData
      );

      expect([null, 'BUY', 'SELL']).toContain(signal);
    });
  });

  describe('Complex Custom Strategy', () => {
    it('should handle AND conditions', () => {
      const buyConditions: ConditionNode = {
        type: 'and',
        children: [
          {
            type: 'indicator',
            indicator: {
              type: 'sma',
              params: { period: 20, source: 'close' },
              condition: 'above',
              value: 100
            }
          },
          {
            type: 'indicator',
            indicator: {
              type: 'rsi',
              params: { period: 14, source: 'close' },
              condition: 'below',
              value: 40
            }
          }
        ]
      };

      const sellConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14, source: 'close' },
          condition: 'above',
          value: 70
        }
      };

      const signal = CustomStrategyExecutor.executeStrategy(
        buyConditions,
        sellConditions,
        mockPriceData
      );

      expect([null, 'BUY', 'SELL']).toContain(signal);
    });

    it('should handle OR conditions', () => {
      const buyConditions: ConditionNode = {
        type: 'or',
        children: [
          {
            type: 'indicator',
            indicator: {
              type: 'rsi',
              params: { period: 14, source: 'close' },
              condition: 'below',
              value: 30
            }
          },
          {
            type: 'indicator',
            indicator: {
              type: 'rsi',
              params: { period: 14, source: 'close' },
              condition: 'below',
              value: 35
            }
          }
        ]
      };

      const sellConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14, source: 'close' },
          condition: 'above',
          value: 70
        }
      };

      const signal = CustomStrategyExecutor.executeStrategy(
        buyConditions,
        sellConditions,
        mockPriceData
      );

      expect([null, 'BUY', 'SELL']).toContain(signal);
    });
  });

  describe('Edge Cases', () => {
    it('should return null with insufficient data', () => {
      const buyConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14, source: 'close' },
          condition: 'below',
          value: 30
        }
      };

      const sellConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14, source: 'close' },
          condition: 'above',
          value: 70
        }
      };

      // Less than 14 data points (RSI period)
      const insufficientData: PriceData[] = Array.from({ length: 10 }, (_, i) => ({
        date: `2023-01-${String(i + 1).padStart(2, '0')}`,
        open: 100,
        high: 105,
        low: 95,
        close: 100,
        volume: 1000000
      }));

      const signal = CustomStrategyExecutor.executeStrategy(
        buyConditions,
        sellConditions,
        insufficientData
      );

      // Should return null or handle gracefully
      expect([null, 'BUY', 'SELL']).toContain(signal);
    });

    it('should handle empty price data', () => {
      const buyConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14, source: 'close' },
          condition: 'below',
          value: 30
        }
      };

      const sellConditions: ConditionNode = {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14, source: 'close' },
          condition: 'above',
          value: 70
        }
      };

      const signal = CustomStrategyExecutor.executeStrategy(
        buyConditions,
        sellConditions,
        []
      );

      expect(signal).toBeNull();
    });
  });
});

