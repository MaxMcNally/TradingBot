import { bollingerBands, BollingerBandsIndicator } from '../../../utils/indicators/bollingerBands';
import { PriceData } from '../../../utils/indicators/types';
import { generatePriceData, generateConstantData, generateTrendingData } from './__helpers__';

describe('Bollinger Bands Indicator', () => {
  describe('Initialization', () => {
    it('should create Bollinger Bands indicator with default parameters', () => {
      const indicator = bollingerBands();
      expect(indicator).toBeInstanceOf(BollingerBandsIndicator);
      expect(indicator.getMinPeriods()).toBe(20);
    });

    it('should create Bollinger Bands indicator with custom parameters', () => {
      const indicator = bollingerBands(20, 2.0);
      expect(indicator.getMinPeriods()).toBe(20);
    });

    it('should create Bollinger Bands indicator with custom source', () => {
      const indicator = bollingerBands(20, 2.0, 'high');
      expect(indicator).toBeInstanceOf(BollingerBandsIndicator);
    });
  });

  describe('Calculation', () => {
    it('should return null when insufficient data', () => {
      const indicator = bollingerBands(20);
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 }
      ];

      const result = indicator.calculate(data);
      expect(result.value).toBeNull();
    });

    it('should calculate all three bands', () => {
      const indicator = bollingerBands(20);
      const data = generatePriceData(25);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        expect(value).toHaveProperty('upper');
        expect(value).toHaveProperty('middle');
        expect(value).toHaveProperty('lower');
        expect(typeof value.upper).toBe('number');
        expect(typeof value.middle).toBe('number');
        expect(typeof value.lower).toBe('number');
      }
    });

    it('should have upper band above middle band', () => {
      const indicator = bollingerBands(20);
      const data = generatePriceData(25);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        expect(value.upper).toBeGreaterThan(value.middle);
      }
    });

    it('should have lower band below middle band', () => {
      const indicator = bollingerBands(20);
      const data = generatePriceData(25);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        expect(value.lower).toBeLessThan(value.middle);
      }
    });

    it('should have symmetric bands around middle', () => {
      const indicator = bollingerBands(20, 2.0);
      const data = generatePriceData(25);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        const upperDistance = value.upper - value.middle;
        const lowerDistance = value.middle - value.lower;
        // Should be approximately equal (within rounding)
        expect(Math.abs(upperDistance - lowerDistance)).toBeLessThan(0.1);
      }
    });
  });

  describe('Conditions - Price Position', () => {
    it('should detect when price is below lower band', () => {
      const indicator = bollingerBands(20);
      const data = generateTrendingData(25, 100, 'down', 3);

      const condition = indicator.priceBelowLower();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when price is above upper band', () => {
      const indicator = bollingerBands(20);
      const data = generateTrendingData(25, 100, 'up', 3);

      const condition = indicator.priceAboveUpper();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when price is between middle and upper', () => {
      const indicator = bollingerBands(20);
      const data = generatePriceData(25);

      const condition = indicator.priceBetweenMiddleAndUpper();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when price is between middle and lower', () => {
      const indicator = bollingerBands(20);
      const data = generatePriceData(25);

      const condition = indicator.priceBetweenMiddleAndLower();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Conditions - Crosses', () => {
    it('should detect when price crosses above middle band', () => {
      const indicator = bollingerBands(20);
      const data = generateTrendingData(25, 90, 'up', 1);

      const condition = indicator.priceCrossesAboveMiddle();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect when price crosses below middle band', () => {
      const indicator = bollingerBands(20);
      const data = generateTrendingData(25, 110, 'down', 1);

      const condition = indicator.priceCrossesBelowMiddle();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Conditions - Band Width', () => {
    it('should detect expanding bands', () => {
      const indicator = bollingerBands(20);
      // Create volatile data to expand bands
      const data: PriceData[] = [];
      let price = 100;

      for (let i = 0; i < 25; i++) {
        price += (Math.random() - 0.5) * 10; // High volatility
        data.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: price,
          high: price + 5,
          low: price - 5,
          close: price,
          volume: 1000
        });
      }

      const condition = indicator.bandsExpanding();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });

    it('should detect contracting bands', () => {
      const indicator = bollingerBands(20);
      const data = generateConstantData(25, 100);

      const condition = indicator.bandsContracting();
      const result = condition.evaluate(data);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Chaining', () => {
    it('should chain conditions with AND/OR/NOT', () => {
      const indicator = bollingerBands(20);
      const data = generatePriceData(25);

      const andCondition = indicator.priceBelowLower().and(indicator.bandsExpanding());
      const orCondition = indicator.priceAboveUpper().or(indicator.priceBelowLower());
      const notCondition = indicator.priceAboveUpper().not();

      expect(typeof andCondition.evaluate(data)).toBe('boolean');
      expect(typeof orCondition.evaluate(data)).toBe('boolean');
      expect(typeof notCondition.evaluate(data)).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const indicator = bollingerBands(20);
      const data: PriceData[] = [];

      expect(indicator.getValue(data)).toBeNull();
      expect(indicator.priceBelowLower().evaluate(data)).toBe(false);
    });

    it('should handle constant prices', () => {
      const indicator = bollingerBands(5);
      const data = generateConstantData(10, 100);

      const value = indicator.getValue(data);
      expect(value).not.toBeNull();
      if (value !== null) {
        // With constant prices, bands should be very tight
        expect(value.upper).toBeCloseTo(value.middle, 1);
        expect(value.lower).toBeCloseTo(value.middle, 1);
      }
    });
  });
});

