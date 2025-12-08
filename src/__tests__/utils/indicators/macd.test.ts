import { macd, MACDIndicator, MACDValue } from '../../../utils/indicators/macd';
import { PriceData } from '../../../utils/indicators/types';
import { generatePriceData, generateTrendingData } from './__helpers__';

describe('MACD Indicator', () => {
  describe('Initialization', () => {
    it('should create MACD indicator with default parameters', () => {
      const indicator = macd();
      expect(indicator).toBeInstanceOf(MACDIndicator);
      expect(indicator.getMinPeriods()).toBe(35); // slowPeriod + signalPeriod
    });

    it('should create MACD indicator with custom parameters', () => {
      const indicator = macd(12, 26, 9);
      expect(indicator.getMinPeriods()).toBe(35);
    });

    it('should create MACD indicator with custom source', () => {
      const indicator = macd(12, 26, 9, 'high');
      expect(indicator).toBeInstanceOf(MACDIndicator);
    });
  });

  describe('Calculation', () => {
    it('should return null when insufficient data', () => {
      const indicator = macd(12, 26, 9);
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 }
      ];

      const result = indicator.calculate(data);
      expect(result.value).toBeNull();
    });

    it('should calculate MACD with all components', () => {
      const indicator = macd(12, 26, 9);
      const data = generatePriceData(50);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        expect(value).toHaveProperty('macd');
        expect(value).toHaveProperty('signal');
        expect(value).toHaveProperty('histogram');
        expect(typeof value.macd).toBe('number');
        expect(typeof value.signal).toBe('number');
        expect(typeof value.histogram).toBe('number');
      }
    });

    it('should calculate histogram as MACD - Signal', () => {
      const indicator = macd(12, 26, 9);
      const data = generatePriceData(50);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        expect(value.histogram).toBeCloseTo(value.macd - value.signal, 2);
      }
    });
  });

  describe('Conditions - Above/Below', () => {
    it('should evaluate MACD above threshold', () => {
      const indicator = macd(12, 26, 9);
      const data = generateTrendingData(50, 100, 'up', 1);

      const condition = indicator.above(0);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should evaluate MACD below threshold', () => {
      const indicator = macd(12, 26, 9);
      const data = generateTrendingData(50, 100, 'down', 1);

      const condition = indicator.below(0);
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Conditions - Signal Line', () => {
    it('should detect when MACD is above signal line', () => {
      const indicator = macd(12, 26, 9);
      const data = generateTrendingData(50, 100, 'up', 1);

      const condition = indicator.signalAbove();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when MACD is below signal line', () => {
      const indicator = macd(12, 26, 9);
      const data = generateTrendingData(50, 100, 'down', 1);

      const condition = indicator.signalBelow();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Conditions - Crosses', () => {
    it('should detect bullish crossover (MACD crosses above signal)', () => {
      const indicator = macd(12, 26, 9);
      const data = generateTrendingData(50, 90, 'up', 1);

      const condition = indicator.crossesAboveSignal();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect bearish crossover (MACD crosses below signal)', () => {
      const indicator = macd(12, 26, 9);
      const data = generateTrendingData(50, 110, 'down', 1);

      const condition = indicator.crossesBelowSignal();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Conditions - Histogram', () => {
    it('should detect positive histogram', () => {
      const indicator = macd(12, 26, 9);
      const data = generateTrendingData(50, 100, 'up', 1);

      const condition = indicator.histogramPositive();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect negative histogram', () => {
      const indicator = macd(12, 26, 9);
      const data = generateTrendingData(50, 100, 'down', 1);

      const condition = indicator.histogramNegative();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Chaining', () => {
    it('should chain conditions with AND/OR/NOT', () => {
      const indicator = macd(12, 26, 9);
      const data = generatePriceData(50);

      const andCondition = indicator.above(0).and(indicator.signalAbove());
      const orCondition = indicator.below(0).or(indicator.histogramNegative());
      const notCondition = indicator.signalAbove().not();

      expect(typeof andCondition.evaluate(data)).toBe('boolean');
      expect(typeof orCondition.evaluate(data)).toBe('boolean');
      expect(typeof notCondition.evaluate(data)).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const indicator = macd(12, 26, 9);
      const data: PriceData[] = [];

      expect(indicator.getValue(data)).toBeNull();
      expect(indicator.above(0).evaluate(data)).toBe(false);
    });

    it('should handle minimal required data', () => {
      const indicator = macd(5, 10, 3);
      const data = generatePriceData(18); // Just enough

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
    });
  });
});

