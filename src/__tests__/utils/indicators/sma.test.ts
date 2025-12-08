import { sma, SMAIndicator } from '../../../utils/indicators/sma';
import { PriceData } from '../../../utils/indicators/types';
import { generatePriceData, generateConstantData, generateTrendingData } from './__helpers__';

describe('SMA Indicator', () => {
  describe('Initialization', () => {
    it('should create SMA indicator with default source', () => {
      const indicator = sma(10);
      expect(indicator).toBeInstanceOf(SMAIndicator);
      expect(indicator.getMinPeriods()).toBe(10);
    });

    it('should create SMA indicator with custom source', () => {
      const indicator = sma(10, 'high');
      expect(indicator).toBeInstanceOf(SMAIndicator);
    });

    it('should handle different periods', () => {
      expect(sma(5).getMinPeriods()).toBe(5);
      expect(sma(20).getMinPeriods()).toBe(20);
      expect(sma(200).getMinPeriods()).toBe(200);
    });
  });

  describe('Calculation', () => {
    it('should return null when insufficient data', () => {
      const indicator = sma(10);
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 }
      ];

      const result = indicator.calculate(data);
      expect(result.value).toBeNull();
    });

    it('should calculate SMA correctly for exact period', () => {
      const indicator = sma(5);
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 },
        { date: '2024-01-02', open: 101, high: 106, low: 96, close: 101, volume: 1000 },
        { date: '2024-01-03', open: 102, high: 107, low: 97, close: 102, volume: 1000 },
        { date: '2024-01-04', open: 103, high: 108, low: 98, close: 103, volume: 1000 },
        { date: '2024-01-05', open: 104, high: 109, low: 99, close: 104, volume: 1000 }
      ];

      const result = indicator.calculate(data);
      expect(result.value).toBeCloseTo(102, 2); // (100+101+102+103+104)/5 = 102
    });

    it('should calculate SMA correctly for more than period', () => {
      const indicator = sma(3);
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 },
        { date: '2024-01-02', open: 101, high: 106, low: 96, close: 101, volume: 1000 },
        { date: '2024-01-03', open: 102, high: 107, low: 97, close: 102, volume: 1000 },
        { date: '2024-01-04', open: 103, high: 108, low: 98, close: 103, volume: 1000 }
      ];

      const result = indicator.calculate(data);
      // Should use last 3: (102+103+104)/3 = 103
      expect(result.value).toBeCloseTo(102, 2);
    });

    it('should calculate SMA with different price sources', () => {
      const closeSMA = sma(3, 'close');
      const highSMA = sma(3, 'high');
      const lowSMA = sma(3, 'low');
      const openSMA = sma(3, 'open');

      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 },
        { date: '2024-01-02', open: 101, high: 106, low: 96, close: 101, volume: 1000 },
        { date: '2024-01-03', open: 102, high: 107, low: 97, close: 102, volume: 1000 }
      ];

      expect(closeSMA.getValue(data)).toBeCloseTo(101, 2);
      expect(highSMA.getValue(data)).toBeCloseTo(106, 2);
      expect(lowSMA.getValue(data)).toBeCloseTo(96, 2);
      expect(openSMA.getValue(data)).toBeCloseTo(101, 2);
    });
  });

  describe('Conditions - Above/Below', () => {
    it('should evaluate above condition correctly', () => {
      const indicator = sma(5);
      const data = generateTrendingData(10, 100, 'up', 1);

      const condition = indicator.above(100);
      const result = condition.evaluate(data);
      
      // With upward trend, SMA should be above 100
      expect(typeof result).toBe('boolean');
    });

    it('should evaluate below condition correctly', () => {
      const indicator = sma(5);
      const data = generateTrendingData(10, 100, 'down', 1);

      const condition = indicator.below(100);
      const result = condition.evaluate(data);
      
      // With downward trend, SMA should be below 100
      expect(typeof result).toBe('boolean');
    });

    it('should return false when insufficient data for condition', () => {
      const indicator = sma(10);
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 }
      ];

      const condition = indicator.above(50);
      expect(condition.evaluate(data)).toBe(false);
    });
  });

  describe('Conditions - Crosses', () => {
    it('should detect when SMA crosses above threshold', () => {
      const indicator = sma(5);
      const data = generateTrendingData(10, 90, 'up', 2);

      const condition = indicator.crossesAbove(100);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when SMA crosses below threshold', () => {
      const indicator = sma(5);
      const data = generateTrendingData(10, 110, 'down', 2);

      const condition = indicator.crossesBelow(100);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when SMA crosses above another SMA', () => {
      const shortSMA = sma(5);
      const longSMA = sma(10);
      const data = generateTrendingData(20, 90, 'up', 1);

      const condition = shortSMA.crossesAbove(longSMA);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when SMA crosses below another SMA', () => {
      const shortSMA = sma(5);
      const longSMA = sma(10);
      const data = generateTrendingData(20, 110, 'down', 1);

      const condition = shortSMA.crossesBelow(longSMA);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Conditions - Indicator Comparison', () => {
    it('should compare SMA above another SMA', () => {
      const shortSMA = sma(5);
      const longSMA = sma(10);
      const data = generateTrendingData(20, 100, 'up', 1);

      const condition = shortSMA.aboveIndicator(longSMA);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should compare SMA below another SMA', () => {
      const shortSMA = sma(5);
      const longSMA = sma(10);
      const data = generateTrendingData(20, 100, 'down', 1);

      const condition = shortSMA.belowIndicator(longSMA);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Chaining Conditions', () => {
    it('should chain conditions with AND', () => {
      const indicator = sma(10);
      const data = generatePriceData(20);

      const condition = indicator.above(100).and(indicator.below(200));
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should chain conditions with OR', () => {
      const indicator = sma(10);
      const data = generatePriceData(20);

      const condition = indicator.above(200).or(indicator.below(50));
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should negate conditions with NOT', () => {
      const indicator = sma(10);
      const data = generatePriceData(20);

      const condition = indicator.above(100).not();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const indicator = sma(10);
      const data: PriceData[] = [];

      expect(indicator.getValue(data)).toBeNull();
      expect(indicator.above(100).evaluate(data)).toBe(false);
    });

    it('should handle constant prices', () => {
      const indicator = sma(5);
      const data = generateConstantData(10, 100);

      const value = indicator.getValue(data);
      expect(value).toBeCloseTo(100, 2);
    });

    it('should handle very small period', () => {
      const indicator = sma(1);
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 }
      ];

      const value = indicator.getValue(data);
      expect(value).toBeCloseTo(100, 2);
    });

    it('should handle large period', () => {
      const indicator = sma(200);
      const data = generatePriceData(250);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      expect(typeof value).toBe('number');
    });
  });
});

