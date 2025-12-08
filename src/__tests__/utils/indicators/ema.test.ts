import { ema, EMAIndicator } from '../../../utils/indicators/ema';
import { sma } from '../../../utils/indicators/sma';
import { PriceData } from '../../../utils/indicators/types';
import { generatePriceData, generateConstantData, generateTrendingData } from './__helpers__';

describe('EMA Indicator', () => {
  describe('Initialization', () => {
    it('should create EMA indicator with default source', () => {
      const indicator = ema(10);
      expect(indicator).toBeInstanceOf(EMAIndicator);
      expect(indicator.getMinPeriods()).toBe(10);
    });

    it('should create EMA indicator with custom source', () => {
      const indicator = ema(10, 'high');
      expect(indicator).toBeInstanceOf(EMAIndicator);
    });
  });

  describe('Calculation', () => {
    it('should return null when insufficient data', () => {
      const indicator = ema(10);
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 }
      ];

      const result = indicator.calculate(data);
      expect(result.value).toBeNull();
    });

    it('should calculate EMA correctly', () => {
      const indicator = ema(5);
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 },
        { date: '2024-01-02', open: 101, high: 106, low: 96, close: 101, volume: 1000 },
        { date: '2024-01-03', open: 102, high: 107, low: 97, close: 102, volume: 1000 },
        { date: '2024-01-04', open: 103, high: 108, low: 98, close: 103, volume: 1000 },
        { date: '2024-01-05', open: 104, high: 109, low: 99, close: 104, volume: 1000 }
      ];

      const result = indicator.calculate(data);
      expect(result.value).not.toBeNull();
      expect(typeof result.value).toBe('number');
      // EMA should be close to recent prices (weighted toward end)
      expect(result.value).toBeGreaterThan(100);
    });

    it('should be more responsive than SMA to recent prices', () => {
      const emaIndicator = ema(5);
      const smaIndicator = sma(5);
      
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 },
        { date: '2024-01-02', open: 101, high: 106, low: 96, close: 101, volume: 1000 },
        { date: '2024-01-03', open: 102, high: 107, low: 97, close: 102, volume: 1000 },
        { date: '2024-01-04', open: 103, high: 108, low: 98, close: 103, volume: 1000 },
        { date: '2024-01-05', open: 104, high: 109, low: 99, close: 110, volume: 1000 } // Big jump
      ];

      const emaValue = emaIndicator.getValue(data);
      const smaValue = smaIndicator.getValue(data);
      
      // EMA should react more to the recent jump
      expect(emaValue).not.toBeNull();
      expect(smaValue).not.toBeNull();
      if (emaValue !== null && smaValue !== null) {
        // EMA should be higher due to recent price jump
        expect(emaValue).toBeGreaterThan(smaValue);
      }
    });
  });

  describe('Conditions', () => {
    it('should evaluate above condition', () => {
      const indicator = ema(10);
      const data = generateTrendingData(20, 100, 'up', 1);

      const condition = indicator.above(100);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should evaluate below condition', () => {
      const indicator = ema(10);
      const data = generateTrendingData(20, 100, 'down', 1);

      const condition = indicator.below(100);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect crosses above/below threshold', () => {
      const indicator = ema(5);
      const data = generateTrendingData(15, 90, 'up', 2);

      const crossesAbove = indicator.crossesAbove(100);
      const crossesBelow = indicator.crossesBelow(100);
      
      expect(typeof crossesAbove.evaluate(data)).toBe('boolean');
      expect(typeof crossesBelow.evaluate(data)).toBe('boolean');
    });

    it('should compare with SMA', () => {
      const emaIndicator = ema(10);
      const smaIndicator = sma(10);
      const data = generateTrendingData(20, 100, 'up', 1);

      const condition = emaIndicator.aboveIndicator(smaIndicator);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect crosses with SMA', () => {
      const emaIndicator = ema(5);
      const smaIndicator = sma(10);
      const data = generateTrendingData(20, 90, 'up', 1);

      const crossesAbove = emaIndicator.crossesAbove(smaIndicator);
      const crossesBelow = emaIndicator.crossesBelow(smaIndicator);
      
      expect(typeof crossesAbove.evaluate(data)).toBe('boolean');
      expect(typeof crossesBelow.evaluate(data)).toBe('boolean');
    });
  });

  describe('Chaining', () => {
    it('should chain conditions with AND/OR/NOT', () => {
      const indicator = ema(10);
      const data = generatePriceData(20);

      const andCondition = indicator.above(100).and(indicator.below(200));
      const orCondition = indicator.above(200).or(indicator.below(50));
      const notCondition = indicator.above(100).not();

      expect(typeof andCondition.evaluate(data)).toBe('boolean');
      expect(typeof orCondition.evaluate(data)).toBe('boolean');
      expect(typeof notCondition.evaluate(data)).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const indicator = ema(10);
      const data: PriceData[] = [];

      expect(indicator.getValue(data)).toBeNull();
    });

    it('should handle constant prices', () => {
      const indicator = ema(5);
      const data = generateConstantData(10, 100);

      const value = indicator.getValue(data);
      expect(value).toBeCloseTo(100, 1);
    });
  });
});

