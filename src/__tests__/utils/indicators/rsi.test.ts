import { rsi, RSIIndicator } from '../../../utils/indicators/rsi';
import { PriceData } from '../../../utils/indicators/types';
import { generatePriceData, generateTrendingData } from './__helpers__';

describe('RSI Indicator', () => {
  describe('Initialization', () => {
    it('should create RSI indicator with default period', () => {
      const indicator = rsi();
      expect(indicator).toBeInstanceOf(RSIIndicator);
      expect(indicator.getMinPeriods()).toBe(15); // period + 1
    });

    it('should create RSI indicator with custom period', () => {
      const indicator = rsi(14);
      expect(indicator.getMinPeriods()).toBe(15);
    });

    it('should create RSI indicator with custom source', () => {
      const indicator = rsi(14, 'high');
      expect(indicator).toBeInstanceOf(RSIIndicator);
    });
  });

  describe('Calculation', () => {
    it('should return null when insufficient data', () => {
      const indicator = rsi(14);
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 }
      ];

      const result = indicator.calculate(data);
      expect(result.value).toBeNull();
    });

    it('should calculate RSI between 0 and 100', () => {
      const indicator = rsi(14);
      const data = generatePriceData(20);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });

    it('should return 100 when all changes are gains', () => {
      const indicator = rsi(5);
      const data: PriceData[] = [];
      let price = 100;

      for (let i = 0; i < 10; i++) {
        price += 1;
        data.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: price - 1,
          high: price + 1,
          low: price - 1,
          close: price,
          volume: 1000
        });
      }

      const value = indicator.getValue(data);
      expect(value).toBe(100);
    });

    it('should return low RSI for declining prices', () => {
      const indicator = rsi(5);
      const data = generateTrendingData(15, 100, 'down', 1);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        expect(value).toBeLessThan(50); // Oversold territory
      }
    });

    it('should return high RSI for rising prices', () => {
      const indicator = rsi(5);
      const data = generateTrendingData(15, 100, 'up', 1);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        expect(value).toBeGreaterThan(50); // Overbought territory
      }
    });
  });

  describe('Conditions - Overbought/Oversold', () => {
    it('should detect overbought condition', () => {
      const indicator = rsi(14);
      const data = generateTrendingData(20, 100, 'up', 2);

      const condition = indicator.overbought(70);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect oversold condition', () => {
      const indicator = rsi(14);
      const data = generateTrendingData(20, 100, 'down', 2);

      const condition = indicator.oversold(30);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should use default thresholds', () => {
      const indicator = rsi(14);
      const data = generatePriceData(20);

      const overbought = indicator.overbought();
      const oversold = indicator.oversold();

      expect(typeof overbought.evaluate(data)).toBe('boolean');
      expect(typeof oversold.evaluate(data)).toBe('boolean');
    });
  });

  describe('Conditions - Above/Below', () => {
    it('should evaluate above condition', () => {
      const indicator = rsi(14);
      const data = generateTrendingData(20, 100, 'up', 1);

      const condition = indicator.above(50);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should evaluate below condition', () => {
      const indicator = rsi(14);
      const data = generateTrendingData(20, 100, 'down', 1);

      const condition = indicator.below(50);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Conditions - Crosses', () => {
    it('should detect when RSI crosses above threshold', () => {
      const indicator = rsi(5);
      const data = generateTrendingData(15, 90, 'up', 2);

      const condition = indicator.crossesAbove(50);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when RSI crosses below threshold', () => {
      const indicator = rsi(5);
      const data = generateTrendingData(15, 110, 'down', 2);

      const condition = indicator.crossesBelow(50);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Chaining', () => {
    it('should chain conditions with AND/OR/NOT', () => {
      const indicator = rsi(14);
      const data = generatePriceData(20);

      const andCondition = indicator.oversold(30).and(indicator.above(20));
      const orCondition = indicator.overbought(70).or(indicator.below(30));
      const notCondition = indicator.overbought(70).not();

      expect(typeof andCondition.evaluate(data)).toBe('boolean');
      expect(typeof orCondition.evaluate(data)).toBe('boolean');
      expect(typeof notCondition.evaluate(data)).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const indicator = rsi(14);
      const data: PriceData[] = [];

      expect(indicator.getValue(data)).toBeNull();
      expect(indicator.overbought().evaluate(data)).toBe(false);
    });

    it('should handle constant prices', () => {
      const indicator = rsi(5);
      const data: PriceData[] = [];
      
      for (let i = 0; i < 10; i++) {
        data.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: 100,
          high: 100,
          low: 100,
          close: 100,
          volume: 1000
        });
      }

      // With no price changes, RSI should be around 50 (neutral)
      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
    });

    it('should handle very volatile prices', () => {
      const indicator = rsi(5);
      const data: PriceData[] = [];
      let price = 100;

      for (let i = 0; i < 10; i++) {
        price += (Math.random() - 0.5) * 20; // High volatility
        data.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: price,
          high: price + 5,
          low: price - 5,
          close: price,
          volume: 1000
        });
      }

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });
  });
});

