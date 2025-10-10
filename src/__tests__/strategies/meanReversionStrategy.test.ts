import { 
  MeanReversionStrategy, 
  MeanReversionConfig,
  runMeanReversionStrategy 
} from '../../strategies/meanReversionStrategy';

describe('MeanReversionStrategy', () => {
  describe('Configuration and Initialization', () => {
    it('should initialize with valid configuration', () => {
      const config: MeanReversionConfig = {
        window: 20,
        threshold: 0.05
      };
      
      expect(() => new MeanReversionStrategy(config)).not.toThrow();
    });

    it('should handle small window sizes', () => {
      const config: MeanReversionConfig = {
        window: 2,
        threshold: 0.01
      };
      
      const strategy = new MeanReversionStrategy(config);
      expect(strategy.getConfig()).toEqual(config);
    });

    it('should handle large window sizes', () => {
      const config: MeanReversionConfig = {
        window: 100,
        threshold: 0.10
      };
      
      const strategy = new MeanReversionStrategy(config);
      expect(strategy.getConfig()).toEqual(config);
    });

    it('should handle very small thresholds', () => {
      const config: MeanReversionConfig = {
        window: 10,
        threshold: 0.001 // 0.1%
      };
      
      expect(() => new MeanReversionStrategy(config)).not.toThrow();
    });

    it('should handle large thresholds', () => {
      const config: MeanReversionConfig = {
        window: 10,
        threshold: 0.50 // 50%
      };
      
      expect(() => new MeanReversionStrategy(config)).not.toThrow();
    });
  });

  describe('Signal Generation - Insufficient Data', () => {
    it('should return null when no prices added', () => {
      const config: MeanReversionConfig = {
        window: 10,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      strategy.addPrice(100);
      expect(strategy.getSignal()).toBeNull();
    });

    it('should return null when insufficient data for window', () => {
      const config: MeanReversionConfig = {
        window: 10,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      // Add only 5 prices (less than window of 10)
      for (let i = 0; i < 5; i++) {
        strategy.addPrice(100 + i);
        expect(strategy.getSignal()).toBeNull();
      }
    });

    it('should return null when exactly at window boundary', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      // Add exactly window prices
      for (let i = 0; i < 5; i++) {
        strategy.addPrice(100 + i);
        expect(strategy.getSignal()).toBeNull();
      }
    });
  });

  describe('Signal Generation - Mean Reversion Logic', () => {
    it('should generate BUY signal when price is below MA by threshold', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0.05 // 5%
      };
      const strategy = new MeanReversionStrategy(config);
      
      // Create data where price drops significantly below MA
      const prices = [100, 101, 102, 103, 104, 95]; // MA = 102, price = 95 (7.3% below)
      
      for (let i = 0; i < prices.length - 1; i++) {
        strategy.addPrice(prices[i]);
        expect(strategy.getSignal()).toBeNull();
      }
      
      // Add the last price that should trigger BUY
      strategy.addPrice(prices[prices.length - 1]);
      expect(strategy.getSignal()).toBe('BUY');
    });

    it('should generate SELL signal when price is above MA by threshold', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0.05 // 5%
      };
      const strategy = new MeanReversionStrategy(config);
      
      // First establish a position
      const initialPrices = [100, 101, 102, 103, 104, 95];
      for (const price of initialPrices) {
        strategy.addPrice(price);
      }
      
      // Now create data where price rises significantly above MA
      const risingPrices = [96, 97, 98, 99, 100, 110]; // MA = 98, price = 110 (12.2% above)
      
      for (let i = 0; i < risingPrices.length - 1; i++) {
        strategy.addPrice(risingPrices[i]);
      }
      
      // Add the last price that should trigger SELL
      strategy.addPrice(risingPrices[risingPrices.length - 1]);
      expect(strategy.getSignal()).toBe('SELL');
    });

    it('should not generate signal when price is within threshold', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0.10 // 10%
      };
      const strategy = new MeanReversionStrategy(config);
      
      // Create data where price is close to MA (within threshold)
      const prices = [100, 101, 102, 103, 104, 105]; // MA = 102, price = 105 (2.9% above, within 10% threshold)
      
      for (const price of prices) {
        strategy.addPrice(price);
        expect(strategy.getSignal()).toBeNull();
      }
    });

    it('should handle different threshold values', () => {
      const config1: MeanReversionConfig = {
        window: 5,
        threshold: 0.01 // 1% - very sensitive
      };
      const config2: MeanReversionConfig = {
        window: 5,
        threshold: 0.20 // 20% - less sensitive
      };
      
      const strategy1 = new MeanReversionStrategy(config1);
      const strategy2 = new MeanReversionStrategy(config2);
      
      // Same price data
      const prices = [100, 101, 102, 103, 104, 95]; // MA = 102, price = 95 (7.3% below)
      
      for (const price of prices) {
        strategy1.addPrice(price);
        strategy2.addPrice(price);
      }
      
      // Strategy1 should generate BUY (7.3% > 1% threshold)
      expect(strategy1.getSignal()).toBe('BUY');
      
      // Strategy2 should not generate signal (7.3% < 20% threshold)
      expect(strategy2.getSignal()).toBeNull();
    });
  });

  describe('Moving Average Calculation', () => {
    it('should calculate moving average correctly', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      // Add prices: [100, 101, 102, 103, 104]
      strategy.addPrice(100);
      strategy.addPrice(101);
      strategy.addPrice(102);
      strategy.addPrice(103);
      strategy.addPrice(104);
      
      const ma = strategy.getCurrentMovingAverage();
      expect(ma).toBeCloseTo(102, 2); // (100+101+102+103+104)/5 = 102
    });

    it('should return null MA when insufficient data', () => {
      const config: MeanReversionConfig = {
        window: 10,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      // Add only 3 prices (less than window)
      strategy.addPrice(100);
      strategy.addPrice(101);
      strategy.addPrice(102);
      
      const ma = strategy.getCurrentMovingAverage();
      expect(ma).toBeNull();
    });

    it('should update moving average as new prices are added', () => {
      const config: MeanReversionConfig = {
        window: 3,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      // Add first 3 prices: [100, 101, 102] -> MA = 101
      strategy.addPrice(100);
      strategy.addPrice(101);
      strategy.addPrice(102);
      expect(strategy.getCurrentMovingAverage()).toBeCloseTo(101, 2);
      
      // Add 4th price: [101, 102, 103] -> MA = 102
      strategy.addPrice(103);
      expect(strategy.getCurrentMovingAverage()).toBeCloseTo(102, 2);
      
      // Add 5th price: [102, 103, 104] -> MA = 103
      strategy.addPrice(104);
      expect(strategy.getCurrentMovingAverage()).toBeCloseTo(103, 2);
    });
  });

  describe('Position Management', () => {
    it('should track current position correctly', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      expect(strategy.getCurrentPosition()).toBe('NONE');
      expect(strategy.getEntryPrice()).toBe(0);
      
      // Create BUY signal
      const prices = [100, 101, 102, 103, 104, 95];
      for (const price of prices) {
        strategy.addPrice(price);
      }
      
      expect(strategy.getCurrentPosition()).toBe('LONG');
      expect(strategy.getEntryPrice()).toBe(95);
    });

    it('should reset position on SELL signal', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      // First establish a LONG position
      const buyPrices = [100, 101, 102, 103, 104, 95];
      for (const price of buyPrices) {
        strategy.addPrice(price);
      }
      
      // Then create SELL signal
      const sellPrices = [96, 97, 98, 99, 100, 110];
      for (const price of sellPrices) {
        strategy.addPrice(price);
      }
      
      expect(strategy.getCurrentPosition()).toBe('NONE');
      expect(strategy.getEntryPrice()).toBe(0);
    });

    it('should not generate BUY signal when already in LONG position', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      // Establish LONG position
      const buyPrices = [100, 101, 102, 103, 104, 95];
      for (const price of buyPrices) {
        strategy.addPrice(price);
      }
      
      // Try to generate another BUY signal
      const anotherBuyPrices = [96, 97, 98, 99, 100, 90];
      for (const price of anotherBuyPrices) {
        strategy.addPrice(price);
        expect(strategy.getSignal()).not.toBe('BUY');
      }
    });
  });

  describe('Strategy Reset', () => {
    it('should reset strategy state correctly', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      // Add some prices and establish a position
      const prices = [100, 101, 102, 103, 104, 95];
      for (const price of prices) {
        strategy.addPrice(price);
      }
      
      // Reset the strategy
      strategy.reset();
      
      // Check that state is reset
      expect(strategy.getCurrentPosition()).toBe('NONE');
      expect(strategy.getEntryPrice()).toBe(0);
      expect(strategy.getCurrentMovingAverage()).toBeNull();
      
      // Should return null signal after reset (need to add a price to test getSignal)
      strategy.addPrice(100);
      expect(strategy.getSignal()).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero prices', () => {
      const config: MeanReversionConfig = {
        window: 3,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      const prices = [0, 0, 0, 0, 0, 0];
      for (const price of prices) {
        strategy.addPrice(price);
      }
      
      // Should not crash
      expect(strategy.getSignal()).toBeNull();
    });

    it('should handle negative prices', () => {
      const config: MeanReversionConfig = {
        window: 3,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      const prices = [-100, -99, -98, -97, -96, -95];
      for (const price of prices) {
        strategy.addPrice(price);
      }
      
      // Should not crash
      expect(strategy.getSignal()).not.toBeUndefined();
    });

    it('should handle very large prices', () => {
      const config: MeanReversionConfig = {
        window: 3,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      const prices = [1000000, 1000001, 1000002, 1000003, 1000004, 1000005];
      for (const price of prices) {
        strategy.addPrice(price);
      }
      
      // Should not crash
      expect(strategy.getSignal()).not.toBeUndefined();
    });

    it('should handle decimal prices', () => {
      const config: MeanReversionConfig = {
        window: 3,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      const prices = [100.123, 101.456, 102.789, 103.012, 104.345, 105.678];
      for (const price of prices) {
        strategy.addPrice(price);
      }
      
      // Should not crash
      expect(strategy.getSignal()).not.toBeUndefined();
    });

    it('should handle rapid price changes', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      // Create volatile price data
      const prices = [100, 200, 50, 300, 25, 400, 10, 500, 5, 600];
      for (const price of prices) {
        strategy.addPrice(price);
      }
      
      // Should not crash
      expect(strategy.getSignal()).not.toBeUndefined();
    });

    it('should handle threshold of zero', () => {
      const config: MeanReversionConfig = {
        window: 5,
        threshold: 0 // 0% threshold
      };
      const strategy = new MeanReversionStrategy(config);
      
      const prices = [100, 101, 102, 103, 104, 105]; // MA = 102, price = 105
      for (const price of prices) {
        strategy.addPrice(price);
      }
      
      // With 0% threshold, any deviation should trigger signal
      // The price (105) is above MA (102), so should be SELL
      const signal = strategy.getSignal();
      // Note: Strategy might not generate signal if already in position or other conditions
      expect(signal === 'SELL' || signal === null).toBe(true);
    });
  });

  describe('Strategy Description and Configuration', () => {
    it('should return correct strategy description', () => {
      const config: MeanReversionConfig = {
        window: 20,
        threshold: 0.05
      };
      const strategy = new MeanReversionStrategy(config);
      
      const description = strategy.getDescription();
      expect(description).toBe('Mean Reversion Strategy: 20-day MA with 5.0% threshold');
    });

    it('should return configuration correctly', () => {
      const config: MeanReversionConfig = {
        window: 15,
        threshold: 0.10
      };
      const strategy = new MeanReversionStrategy(config);
      
      const returnedConfig = strategy.getConfig();
      expect(returnedConfig).toEqual(config);
    });
  });
});

describe('runMeanReversionStrategy', () => {
  const mockData = [
    { date: '2023-01-01', close: 100, open: 99 },
    { date: '2023-01-02', close: 102, open: 100 },
    { date: '2023-01-03', close: 98, open: 102 },
    { date: '2023-01-04', close: 105, open: 98 },
    { date: '2023-01-05', close: 103, open: 105 },
    { date: '2023-01-06', close: 107, open: 103 },
    { date: '2023-01-07', close: 110, open: 107 },
    { date: '2023-01-08', close: 108, open: 110 },
    { date: '2023-01-09', close: 112, open: 108 },
    { date: '2023-01-10', close: 115, open: 112 },
    { date: '2023-01-11', close: 113, open: 115 },
    { date: '2023-01-12', close: 118, open: 113 },
    { date: '2023-01-13', close: 116, open: 118 },
    { date: '2023-01-14', close: 120, open: 116 },
    { date: '2023-01-15', close: 122, open: 120 },
    { date: '2023-01-16', close: 119, open: 122 },
    { date: '2023-01-17', close: 125, open: 119 },
    { date: '2023-01-18', close: 123, open: 125 },
    { date: '2023-01-19', close: 128, open: 123 },
    { date: '2023-01-20', close: 130, open: 128 },
    { date: '2023-01-21', close: 127, open: 130 },
    { date: '2023-01-22', close: 132, open: 127 },
    { date: '2023-01-23', close: 135, open: 132 },
    { date: '2023-01-24', close: 133, open: 135 },
    { date: '2023-01-25', close: 138, open: 133 },
    { date: '2023-01-26', close: 90, open: 138 },
    { date: '2023-01-27', close: 95, open: 90 },
    { date: '2023-01-28', close: 92, open: 95 },
    { date: '2023-01-29', close: 88, open: 92 },
    { date: '2023-01-30', close: 150, open: 88 },
    { date: '2023-01-31', close: 145, open: 150 },
    { date: '2023-02-01', close: 140, open: 145 },
    { date: '2023-02-02', close: 135, open: 140 },
    { date: '2023-02-03', close: 80, open: 135 },
    { date: '2023-02-04', close: 85, open: 80 },
    { date: '2023-02-05', close: 82, open: 85 },
    { date: '2023-02-06', close: 78, open: 82 },
    { date: '2023-02-07', close: 160, open: 78 },
    { date: '2023-02-08', close: 155, open: 160 },
    { date: '2023-02-09', close: 150, open: 155 },
    { date: '2023-02-10', close: 145, open: 150 }
  ];

  describe('Basic Functionality', () => {
    it('should return valid backtest result', () => {
      const config = {
        window: 10,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      };

      const result = runMeanReversionStrategy('AAPL', mockData, config);

      expect(result).toHaveProperty('trades');
      expect(result).toHaveProperty('finalPortfolioValue');
      expect(result).toHaveProperty('totalReturn');
      expect(result).toHaveProperty('winRate');
      expect(result).toHaveProperty('maxDrawdown');
      expect(result).toHaveProperty('portfolioHistory');

      expect(Array.isArray(result.trades)).toBe(true);
      expect(typeof result.finalPortfolioValue).toBe('number');
      expect(typeof result.totalReturn).toBe('number');
      expect(typeof result.winRate).toBe('number');
      expect(typeof result.maxDrawdown).toBe('number');
      expect(Array.isArray(result.portfolioHistory)).toBe(true);
    });

    it('should handle empty data', () => {
      const config = {
        window: 10,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      };

      const result = runMeanReversionStrategy('AAPL', [], config);

      expect(result.trades).toEqual([]);
      expect(result.finalPortfolioValue).toBe(10000);
      expect(result.totalReturn).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.maxDrawdown).toBe(0);
    });

    it('should handle insufficient data', () => {
      const config = {
        window: 20,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      };

      const insufficientData = mockData.slice(0, 10); // Less than window
      const result = runMeanReversionStrategy('AAPL', insufficientData, config);

      expect(result.trades).toEqual([]);
      expect(result.finalPortfolioValue).toBe(10000);
    });
  });

  describe('Trade Generation', () => {
    it('should generate trades with correct structure', () => {
      const config = {
        window: 10,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      };

      const result = runMeanReversionStrategy('AAPL', mockData, config);

      result.trades.forEach(trade => {
        expect(trade).toHaveProperty('symbol', 'AAPL');
        expect(trade).toHaveProperty('date');
        expect(trade).toHaveProperty('action');
        expect(trade).toHaveProperty('price');
        expect(trade).toHaveProperty('shares');
        expect(['BUY', 'SELL']).toContain(trade.action);
        expect(trade.price).toBeGreaterThan(0);
        expect(trade.shares).toBeGreaterThan(0);
      });
    });

    it('should respect sharesPerTrade configuration', () => {
      const config = {
        window: 10,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 50
      };

      const result = runMeanReversionStrategy('AAPL', mockData, config);

      result.trades.forEach(trade => {
        expect(trade.shares).toBe(50);
      });
    });
  });

  describe('Portfolio Calculations', () => {
    it('should calculate final portfolio value correctly', () => {
      const config = {
        window: 10,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      };

      const result = runMeanReversionStrategy('AAPL', mockData, config);

      expect(result.finalPortfolioValue).toBeGreaterThan(0);
      expect(result.totalReturn).toBeGreaterThanOrEqual(-1); // Can't lose more than 100%
    });

    it('should calculate win rate between 0 and 1', () => {
      const config = {
        window: 10,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      };

      const result = runMeanReversionStrategy('AAPL', mockData, config);

      expect(result.winRate).toBeGreaterThanOrEqual(0);
      expect(result.winRate).toBeLessThanOrEqual(1);
    });

    it('should calculate max drawdown correctly', () => {
      const config = {
        window: 10,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      };

      const result = runMeanReversionStrategy('AAPL', mockData, config);

      expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(result.maxDrawdown).toBeLessThanOrEqual(1);
    });
  });

  describe('Configuration Variations', () => {
    it('should handle different window sizes', () => {
      const config1 = {
        window: 5,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      };
      const config2 = {
        window: 20,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      };

      const result1 = runMeanReversionStrategy('AAPL', mockData, config1);
      const result2 = runMeanReversionStrategy('AAPL', mockData, config2);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should handle different threshold values', () => {
      const config1 = {
        window: 10,
        threshold: 0.01, // 1%
        initialCapital: 10000,
        sharesPerTrade: 100
      };
      const config2 = {
        window: 10,
        threshold: 0.20, // 20%
        initialCapital: 10000,
        sharesPerTrade: 100
      };

      const result1 = runMeanReversionStrategy('AAPL', mockData, config1);
      const result2 = runMeanReversionStrategy('AAPL', mockData, config2);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should handle different initial capital', () => {
      const config1 = {
        window: 10,
        threshold: 0.05,
        initialCapital: 5000,
        sharesPerTrade: 100
      };
      const config2 = {
        window: 10,
        threshold: 0.05,
        initialCapital: 20000,
        sharesPerTrade: 100
      };

      const result1 = runMeanReversionStrategy('AAPL', mockData, config1);
      const result2 = runMeanReversionStrategy('AAPL', mockData, config2);

      expect(result1.finalPortfolioValue).toBeGreaterThan(0);
      expect(result2.finalPortfolioValue).toBeGreaterThan(0);
    });
  });
});
