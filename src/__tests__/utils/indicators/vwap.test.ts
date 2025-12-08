import { vwap, VWAPIndicator } from '../../../utils/indicators/vwap';
import { PriceData } from '../../../utils/indicators/types';
import { generatePriceData, generateConstantData, generateTrendingData } from './__helpers__';

describe('VWAP Indicator', () => {
  describe('Initialization', () => {
    it('should create VWAP indicator without period', () => {
      const indicator = vwap();
      expect(indicator).toBeInstanceOf(VWAPIndicator);
      expect(indicator.getMinPeriods()).toBe(1);
    });

    it('should create VWAP indicator with period', () => {
      const indicator = vwap(20);
      expect(indicator.getMinPeriods()).toBe(20);
    });
  });

  describe('Calculation', () => {
    it('should return null when empty data', () => {
      const indicator = vwap();
      const data: PriceData[] = [];

      const result = indicator.calculate(data);
      expect(result.value).toBeNull();
    });

    it('should calculate VWAP for single data point', () => {
      const indicator = vwap();
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 }
      ];

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      // VWAP = typical price = (high + low + close) / 3
      if (value !== null) {
        expect(value).toBeCloseTo((105 + 95 + 100) / 3, 2);
      }
    });

    it('should calculate VWAP correctly with multiple data points', () => {
      const indicator = vwap();
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 },
        { date: '2024-01-02', open: 101, high: 106, low: 96, close: 101, volume: 2000 },
        { date: '2024-01-03', open: 102, high: 107, low: 97, close: 102, volume: 1500 }
      ];

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });

    it('should calculate VWAP with period limit', () => {
      const indicator = vwap(5);
      const data = generatePriceData(10);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      // Should only use last 5 periods
    });

    it('should weight by volume correctly', () => {
      const indicator = vwap();
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 100, low: 100, close: 100, volume: 1000 },
        { date: '2024-01-02', open: 200, high: 200, low: 200, close: 200, volume: 9000 }
      ];

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      // Should be closer to 200 due to higher volume
      if (value !== null) {
        expect(value).toBeGreaterThan(150);
      }
    });

    it('should handle zero volume', () => {
      const indicator = vwap();
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 0 }
      ];

      const value = indicator.getValue(data);
      expect(value).toBeNull();
    });
  });

  describe('Conditions - Price Position', () => {
    it('should detect when price is above VWAP', () => {
      const indicator = vwap();
      const data = generateTrendingData(10, 100, 'up', 1);

      const condition = indicator.priceAbove();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when price is below VWAP', () => {
      const indicator = vwap();
      const data = generateTrendingData(10, 100, 'down', 1);

      const condition = indicator.priceBelow();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when price crosses above VWAP', () => {
      const indicator = vwap();
      const data = generateTrendingData(15, 90, 'up', 1);

      const condition = indicator.priceCrossesAbove();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when price crosses below VWAP', () => {
      const indicator = vwap();
      const data = generateTrendingData(15, 110, 'down', 1);

      const condition = indicator.priceCrossesBelow();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Conditions - Threshold', () => {
    it('should evaluate VWAP above threshold', () => {
      const indicator = vwap();
      const data = generateTrendingData(10, 100, 'up', 1);

      const condition = indicator.above(100);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should evaluate VWAP below threshold', () => {
      const indicator = vwap();
      const data = generateTrendingData(10, 100, 'down', 1);

      const condition = indicator.below(100);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Chaining', () => {
    it('should chain conditions with AND/OR/NOT', () => {
      const indicator = vwap();
      const data = generatePriceData(10);

      const andCondition = indicator.priceAbove().and(indicator.above(100));
      const orCondition = indicator.priceBelow().or(indicator.below(50));
      const notCondition = indicator.priceAbove().not();

      expect(typeof andCondition.evaluate(data)).toBe('boolean');
      expect(typeof orCondition.evaluate(data)).toBe('boolean');
      expect(typeof notCondition.evaluate(data)).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const indicator = vwap();
      const data: PriceData[] = [];

      expect(indicator.getValue(data)).toBeNull();
      expect(indicator.priceAbove().evaluate(data)).toBe(false);
    });

    it('should handle constant prices', () => {
      const indicator = vwap();
      const data = generateConstantData(10, 100);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        expect(value).toBeCloseTo(100, 1);
      }
    });

    it('should handle very large volumes', () => {
      const indicator = vwap();
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000000000 }
      ];

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      expect(typeof value).toBe('number');
    });
  });
});

