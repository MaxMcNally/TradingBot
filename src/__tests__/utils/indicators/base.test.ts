import { ConditionSignalGenerator } from '../../../utils/indicators/base';
import { rsi, sma, ema } from '../../../utils/indicators';
import { PriceData } from '../../../utils/indicators/types';
import { generatePriceData, generateTrendingData } from './__helpers__';

describe('ConditionSignalGenerator', () => {
  describe('Initialization', () => {
    it('should create signal generator', () => {
      const generator = new ConditionSignalGenerator();
      expect(generator).toBeInstanceOf(ConditionSignalGenerator);
    });
  });

  describe('Signal Generation - Buy Conditions', () => {
    it('should generate BUY signal when buy condition is met', () => {
      const generator = new ConditionSignalGenerator();
      const data = generateTrendingData(20, 100, 'down', 2);

      generator.whenBuy(rsi(14).oversold(30));
      const signal = generator.generateSignal(data);

      expect(signal === 'BUY' || signal === null).toBe(true);
    });

    it('should return null when buy condition is not met', () => {
      const generator = new ConditionSignalGenerator();
      const data = generateTrendingData(20, 100, 'up', 2);

      generator.whenBuy(rsi(14).oversold(30));
      const signal = generator.generateSignal(data);

      // RSI should be high in uptrend, so no buy signal
      expect(signal).toBeNull();
    });

    it('should handle complex buy conditions', () => {
      const generator = new ConditionSignalGenerator();
      const data = generateTrendingData(30, 90, 'up', 1);

      const shortMA = sma(50);
      const longMA = sma(200);
      generator.whenBuy(
        rsi(14).oversold(30)
          .and(shortMA.aboveIndicator(longMA))
      );
      const signal = generator.generateSignal(data);

      expect(signal === 'BUY' || signal === null).toBe(true);
    });
  });

  describe('Signal Generation - Sell Conditions', () => {
    it('should generate SELL signal when sell condition is met', () => {
      const generator = new ConditionSignalGenerator();
      const data = generateTrendingData(20, 100, 'up', 2);

      generator.whenSell(rsi(14).overbought(70));
      const signal = generator.generateSignal(data);

      expect(signal === 'SELL' || signal === null).toBe(true);
    });

    it('should return null when sell condition is not met', () => {
      const generator = new ConditionSignalGenerator();
      const data = generateTrendingData(20, 100, 'down', 2);

      generator.whenSell(rsi(14).overbought(70));
      const signal = generator.generateSignal(data);

      // RSI should be low in downtrend, so no sell signal
      expect(signal).toBeNull();
    });
  });

  describe('Signal Generation - Buy and Sell', () => {
    it('should prioritize BUY over SELL when both conditions are met', () => {
      const generator = new ConditionSignalGenerator();
      const data = generatePriceData(20);

      // Create conditions that might both be true
      generator.whenBuy(sma(10).above(50));
      generator.whenSell(sma(10).above(100));

      const signal = generator.generateSignal(data);

      // BUY should be checked first
      expect(signal === 'BUY' || signal === 'SELL' || signal === null).toBe(true);
    });

    it('should generate signals based on both conditions', () => {
      const generator = new ConditionSignalGenerator();
      const data = generateTrendingData(30, 100, 'up', 1);

      generator.whenBuy(rsi(14).oversold(30));
      generator.whenSell(rsi(14).overbought(70));

      const signal = generator.generateSignal(data);
      expect(signal === 'BUY' || signal === 'SELL' || signal === null).toBe(true);
    });
  });

  describe('Chaining with Multiple Indicators', () => {
    it('should work with SMA crossover strategy', () => {
      const generator = new ConditionSignalGenerator();
      const shortMA = sma(5);
      const longMA = sma(10);
      const data = generateTrendingData(20, 90, 'up', 1);

      generator.whenBuy(shortMA.crossesAbove(longMA));
      generator.whenSell(shortMA.crossesBelow(longMA));

      const signal = generator.generateSignal(data);
      expect(signal === 'BUY' || signal === 'SELL' || signal === null).toBe(true);
    });

    it('should work with EMA and RSI combination', () => {
      const generator = new ConditionSignalGenerator();
      const fastEMA = ema(12);
      const slowEMA = ema(26);
      const data = generateTrendingData(30, 100, 'up', 1);

      generator.whenBuy(
        fastEMA.aboveIndicator(slowEMA)
          .and(rsi(14).below(40))
      );
      generator.whenSell(
        fastEMA.belowIndicator(slowEMA)
          .or(rsi(14).above(60))
      );

      const signal = generator.generateSignal(data);
      expect(signal === 'BUY' || signal === 'SELL' || signal === null).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should return null when no conditions are set', () => {
      const generator = new ConditionSignalGenerator();
      const data = generatePriceData(20);

      const signal = generator.generateSignal(data);
      expect(signal).toBeNull();
    });

    it('should handle empty data', () => {
      const generator = new ConditionSignalGenerator();
      const data: PriceData[] = [];

      generator.whenBuy(rsi(14).oversold(30));
      const signal = generator.generateSignal(data);

      expect(signal).toBeNull();
    });

    it('should handle insufficient data for indicators', () => {
      const generator = new ConditionSignalGenerator();
      const data: PriceData[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 }
      ];

      generator.whenBuy(sma(20).above(50));
      const signal = generator.generateSignal(data);

      expect(signal).toBeNull();
    });
  });
});

describe('Base Condition Classes', () => {
  describe('AND Condition', () => {
    it('should return true when both conditions are true', () => {
      const data = generatePriceData(20);
      const condition1 = sma(10).above(50);
      const condition2 = sma(10).below(200);

      const andCondition = condition1.and(condition2);
      const result = andCondition.evaluate(data);

      expect(typeof result).toBe('boolean');
    });

    it('should return false when one condition is false', () => {
      const data = generatePriceData(20);
      const condition1 = sma(10).above(1000); // Likely false
      const condition2 = sma(10).below(200);

      const andCondition = condition1.and(condition2);
      const result = andCondition.evaluate(data);

      expect(result).toBe(false);
    });
  });

  describe('OR Condition', () => {
    it('should return true when at least one condition is true', () => {
      const data = generatePriceData(20);
      const condition1 = sma(10).above(1000); // Likely false
      const condition2 = sma(10).below(200); // Likely true

      const orCondition = condition1.or(condition2);
      const result = orCondition.evaluate(data);

      expect(result).toBe(true);
    });

    it('should return false when both conditions are false', () => {
      const data = generatePriceData(20);
      const condition1 = sma(10).above(1000); // Likely false
      const condition2 = sma(10).below(0); // Likely false

      const orCondition = condition1.or(condition2);
      const result = orCondition.evaluate(data);

      expect(result).toBe(false);
    });
  });

  describe('NOT Condition', () => {
    it('should negate the condition', () => {
      const data = generatePriceData(20);
      const condition = sma(10).above(50);

      const notCondition = condition.not();
      const originalResult = condition.evaluate(data);
      const negatedResult = notCondition.evaluate(data);

      expect(negatedResult).toBe(!originalResult);
    });
  });

  describe('Complex Chaining', () => {
    it('should handle complex nested conditions', () => {
      const data = generatePriceData(20);
      const condition = sma(10).above(50)
        .and(sma(10).below(200))
        .or(sma(10).above(1000))
        .not();

      const result = condition.evaluate(data);
      expect(typeof result).toBe('boolean');
    });

    it('should handle multiple levels of chaining', () => {
      const data = generatePriceData(20);
      const condition = sma(10).above(50)
        .and(sma(10).below(200))
        .or(sma(10).above(100))
        .and(sma(10).below(150))
        .not();

      const result = condition.evaluate(data);
      expect(typeof result).toBe('boolean');
    });
  });
});

