import { CustomStrategyService } from '../services/customStrategyService';
import { ConditionNode } from '../models/CustomStrategy';

describe('CustomStrategyService', () => {
  describe('validateStrategy', () => {
    describe('Passing Cases', () => {
      it('should validate a simple valid strategy with RSI', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'oversold',
            value: 30
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought',
            value: 70
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      });

      it('should validate a strategy with SMA crossover', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'sma',
            params: { period: 50, source: 'close' },
            condition: 'aboveIndicator',
            refIndicator: {
              type: 'sma',
              params: { period: 200, source: 'close' }
            }
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'sma',
            params: { period: 50, source: 'close' },
            condition: 'belowIndicator',
            refIndicator: {
              type: 'sma',
              params: { period: 200, source: 'close' }
            }
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate a strategy with AND operator', () => {
        const buyConditions: ConditionNode = {
          type: 'and',
          children: [
            {
              type: 'indicator',
              indicator: {
                type: 'rsi',
                params: { period: 14, source: 'close' },
                condition: 'oversold'
              }
            },
            {
              type: 'indicator',
              indicator: {
                type: 'sma',
                params: { period: 50, source: 'close' },
                condition: 'above',
                value: 100
              }
            }
          ]
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate a strategy with MACD', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'macd',
            params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
            condition: 'crossesAboveSignal'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'macd',
            params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
            condition: 'crossesBelowSignal'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate a strategy with Bollinger Bands', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'bollingerBands',
            params: { period: 20, multiplier: 2, source: 'close' },
            condition: 'priceBelowLower'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'bollingerBands',
            params: { period: 20, multiplier: 2, source: 'close' },
            condition: 'priceAboveUpper'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate a strategy with VWAP', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'vwap',
            params: { period: 20 },
            condition: 'priceBelow'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'vwap',
            params: { period: 20 },
            condition: 'priceAbove'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate a complex strategy with OR operator', () => {
        const buyConditions: ConditionNode = {
          type: 'or',
          children: [
            {
              type: 'indicator',
              indicator: {
                type: 'rsi',
                params: { period: 14, source: 'close' },
                condition: 'oversold'
              }
            },
            {
              type: 'indicator',
              indicator: {
                type: 'bollingerBands',
                params: { period: 20, multiplier: 2, source: 'close' },
                condition: 'priceBelowLower'
              }
            }
          ]
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate a strategy with NOT operator', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'oversold'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'not',
          children: [
            {
              type: 'indicator',
              indicator: {
                type: 'rsi',
                params: { period: 14, source: 'close' },
                condition: 'oversold'
              }
            }
          ]
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Failing Cases', () => {
      it('should fail when buy conditions are missing', () => {
        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(null as any, sellConditions);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Buy conditions are required');
      });

      it('should fail when sell conditions are missing', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'oversold'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, null as any);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Sell conditions are required');
      });

      it('should fail when buy and sell conditions are identical', () => {
        const condition: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'oversold'
          }
        };

        const result = CustomStrategyService.validateStrategy(condition, condition);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Buy and sell conditions cannot be identical. The strategy would never generate signals.');
      });

      it('should fail when indicator node is missing indicator property', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator'
          // Missing indicator property
        } as any;

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('indicator property'))).toBe(true);
      });

      it('should fail when indicator is missing type', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            // Missing type
            params: { period: 14, source: 'close' },
            condition: 'oversold'
          } as any
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('type'))).toBe(true);
      });

      it('should fail when indicator is missing condition', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' }
            // Missing condition
          } as any
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('condition'))).toBe(true);
      });

      it('should fail when AND operator has less than 2 children', () => {
        const buyConditions: ConditionNode = {
          type: 'and',
          children: [
            {
              type: 'indicator',
              indicator: {
                type: 'rsi',
                params: { period: 14, source: 'close' },
                condition: 'oversold'
              }
            }
            // Only one child, needs at least 2
          ]
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('at least 2 children'))).toBe(true);
      });

      it('should fail when NOT operator has more than 1 child', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'oversold'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'not',
          children: [
            {
              type: 'indicator',
              indicator: {
                type: 'rsi',
                params: { period: 14, source: 'close' },
                condition: 'oversold'
              }
            },
            {
              type: 'indicator',
              indicator: {
                type: 'rsi',
                params: { period: 14, source: 'close' },
                condition: 'overbought'
              }
            }
            // NOT should have exactly 1 child
          ]
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('exactly 1 child'))).toBe(true);
      });

      it('should fail when SMA period is less than 1', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'sma',
            params: { period: 0, source: 'close' },
            condition: 'above',
            value: 100
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'sma',
            params: { period: 20, source: 'close' },
            condition: 'below',
            value: 100
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('period must be at least 1'))).toBe(true);
      });

      it('should fail when MACD fast period is greater than or equal to slow period', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'macd',
            params: { fastPeriod: 26, slowPeriod: 12, signalPeriod: 9 },
            condition: 'crossesAboveSignal'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'macd',
            params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
            condition: 'crossesBelowSignal'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('fast period must be less than slow period'))).toBe(true);
      });

      it('should fail when MACD fast period equals slow period', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'macd',
            params: { fastPeriod: 12, slowPeriod: 12, signalPeriod: 9 },
            condition: 'crossesAboveSignal'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'macd',
            params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
            condition: 'crossesBelowSignal'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('fast period must be less than slow period'))).toBe(true);
      });

      it('should fail when conditions contain no indicators', () => {
        const buyConditions: ConditionNode = {
          type: 'and',
          children: [
            {
              type: 'or',
              children: []
            }
          ]
        } as any;

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('Buy conditions must contain at least one indicator'))).toBe(true);
      });
    });

    describe('Warning Cases', () => {
      it('should warn when RSI period is outside typical range (too low)', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 1, source: 'close' },
            condition: 'oversold'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('RSI period'))).toBe(true);
      });

      it('should warn when RSI period is outside typical range (too high)', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 150, source: 'close' },
            condition: 'oversold'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('RSI period'))).toBe(true);
      });

      it('should warn when SMA period is very large', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'sma',
            params: { period: 600, source: 'close' },
            condition: 'above',
            value: 100
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'sma',
            params: { period: 20, source: 'close' },
            condition: 'below',
            value: 100
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('SMA period') && w.includes('very large'))).toBe(true);
      });

      it('should warn when EMA period is very large', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'ema',
            params: { period: 600, source: 'close' },
            condition: 'above',
            value: 100
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'ema',
            params: { period: 20, source: 'close' },
            condition: 'below',
            value: 100
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('EMA period') && w.includes('very large'))).toBe(true);
      });

      it('should warn when Bollinger Bands multiplier is outside typical range', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'bollingerBands',
            params: { period: 20, multiplier: 0.05, source: 'close' },
            condition: 'priceBelowLower'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'bollingerBands',
            params: { period: 20, multiplier: 2, source: 'close' },
            condition: 'priceAboveUpper'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('Bollinger Bands multiplier'))).toBe(true);
      });

      it('should warn when buying when RSI is overbought and selling when oversold (backwards)', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought',
            value: 70
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'oversold',
            value: 30
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('counterintuitive') && w.includes('RSI'))).toBe(true);
      });

      it('should warn when buying above upper Bollinger Band and selling below lower band', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'bollingerBands',
            params: { period: 20, multiplier: 2, source: 'close' },
            condition: 'priceAboveUpper'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'bollingerBands',
            params: { period: 20, multiplier: 2, source: 'close' },
            condition: 'priceBelowLower'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('counterintuitive') && w.includes('Bollinger'))).toBe(true);
      });

      it('should warn when strategy uses only one indicator for both buy and sell', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'oversold'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('only one indicator') && w.includes('reliability'))).toBe(true);
      });

      it('should not warn when strategy uses multiple indicators', () => {
        const buyConditions: ConditionNode = {
          type: 'and',
          children: [
            {
              type: 'indicator',
              indicator: {
                type: 'rsi',
                params: { period: 14, source: 'close' },
                condition: 'oversold'
              }
            },
            {
              type: 'indicator',
              indicator: {
                type: 'sma',
                params: { period: 50, source: 'close' },
                condition: 'above',
                value: 100
              }
            }
          ]
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('only one indicator'))).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle array of conditions', () => {
        const buyConditions: ConditionNode[] = [
          {
            type: 'indicator',
            indicator: {
              type: 'rsi',
              params: { period: 14, source: 'close' },
              condition: 'oversold'
            }
          }
        ];

        const sellConditions: ConditionNode[] = [
          {
            type: 'indicator',
            indicator: {
              type: 'rsi',
              params: { period: 14, source: 'close' },
              condition: 'overbought'
            }
          }
        ];

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle complex nested conditions', () => {
        const buyConditions: ConditionNode = {
          type: 'and',
          children: [
            {
              type: 'or',
              children: [
                {
                  type: 'indicator',
                  indicator: {
                    type: 'rsi',
                    params: { period: 14, source: 'close' },
                    condition: 'oversold'
                  }
                },
                {
                  type: 'indicator',
                  indicator: {
                    type: 'bollingerBands',
                    params: { period: 20, multiplier: 2, source: 'close' },
                    condition: 'priceBelowLower'
                  }
                }
              ]
            },
            {
              type: 'not',
              children: [
                {
                  type: 'indicator',
                  indicator: {
                    type: 'macd',
                    params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
                    condition: 'histogramNegative'
                  }
                }
              ]
            }
          ]
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'rsi',
            params: { period: 14, source: 'close' },
            condition: 'overbought'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle conditions with reference indicators', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'sma',
            params: { period: 50, source: 'close' },
            condition: 'crossesAbove',
            refIndicator: {
              type: 'ema',
              params: { period: 200, source: 'close' }
            }
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'sma',
            params: { period: 50, source: 'close' },
            condition: 'crossesBelow',
            refIndicator: {
              type: 'ema',
              params: { period: 200, source: 'close' }
            }
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle VWAP without period parameter', () => {
        const buyConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'vwap',
            params: {},
            condition: 'priceBelow'
          }
        };

        const sellConditions: ConditionNode = {
          type: 'indicator',
          indicator: {
            type: 'vwap',
            params: {},
            condition: 'priceAbove'
          }
        };

        const result = CustomStrategyService.validateStrategy(buyConditions, sellConditions);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});

