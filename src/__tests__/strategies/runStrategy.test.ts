import { runStrategy, StrategyConfig } from '../../strategies/runStrategy';

describe('runStrategy', () => {
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
    // Add more data with significant variations to trigger trades
    { date: '2023-01-26', close: 90, open: 138 },   // Large drop
    { date: '2023-01-27', close: 95, open: 90 },
    { date: '2023-01-28', close: 92, open: 95 },
    { date: '2023-01-29', close: 88, open: 92 },
    { date: '2023-01-30', close: 150, open: 88 },   // Large spike
    { date: '2023-01-31', close: 145, open: 150 },
    { date: '2023-02-01', close: 140, open: 145 },
    { date: '2023-02-02', close: 135, open: 140 },
    { date: '2023-02-03', close: 80, open: 135 },   // Another large drop
    { date: '2023-02-04', close: 85, open: 80 },
    { date: '2023-02-05', close: 82, open: 85 },
    { date: '2023-02-06', close: 78, open: 82 },
    { date: '2023-02-07', close: 160, open: 78 },   // Another large spike
    { date: '2023-02-08', close: 155, open: 160 },
    { date: '2023-02-09', close: 150, open: 155 },
    { date: '2023-02-10', close: 145, open: 150 }
  ];

  const defaultConfig: StrategyConfig = {
    window: 5,
    threshold: 0.05,
    initialCapital: 10000,
    sharesPerTrade: 100
  };

  describe('basic functionality', () => {
    it('should return a valid BacktestResult', () => {
      const result = runStrategy('AAPL', mockData, defaultConfig);

      expect(result).toHaveProperty('trades');
      expect(result).toHaveProperty('finalPortfolioValue');
      expect(result).toHaveProperty('totalReturn');
      expect(result).toHaveProperty('winRate');
      expect(result).toHaveProperty('maxDrawdown');

      expect(Array.isArray(result.trades)).toBe(true);
      expect(typeof result.finalPortfolioValue).toBe('number');
      expect(typeof result.totalReturn).toBe('number');
      expect(typeof result.winRate).toBe('number');
      expect(typeof result.maxDrawdown).toBe('number');
    });

    it('should use default config when none provided', () => {
      const result = runStrategy('AAPL', mockData);

      expect(result).toBeDefined();
      expect(result.trades).toBeDefined();
    });

    it('should handle empty data array', () => {
      const result = runStrategy('AAPL', [], defaultConfig);

      expect(result.trades).toEqual([]);
      expect(result.finalPortfolioValue).toBe(defaultConfig.initialCapital);
      expect(result.totalReturn).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.maxDrawdown).toBe(0);
    });
  });

  describe('trade generation', () => {
    it('should generate trades based on strategy logic', () => {
      const result = runStrategy('AAPL', mockData, defaultConfig);

      // Should have at least some trades if the data has enough variation
      expect(result.trades.length).toBeGreaterThan(0);

      // Check trade structure
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
      const customConfig = { ...defaultConfig, sharesPerTrade: 50 };
      const result = runStrategy('AAPL', mockData, customConfig);

      result.trades.forEach(trade => {
        expect(trade.shares).toBe(50);
      });
    });
  });

  describe('portfolio calculations', () => {
    it('should calculate final portfolio value correctly', () => {
      const result = runStrategy('AAPL', mockData, defaultConfig);

      expect(result.finalPortfolioValue).toBeGreaterThan(0);
      expect(result.finalPortfolioValue).toBeGreaterThanOrEqual(defaultConfig.initialCapital * 0.5); // Reasonable lower bound
    });

    it('should calculate total return as percentage', () => {
      const result = runStrategy('AAPL', mockData, defaultConfig);

      expect(result.totalReturn).toBeGreaterThanOrEqual(-1); // Can't lose more than 100%
      expect(result.totalReturn).toBeLessThan(10); // Reasonable upper bound for test data
    });

    it('should calculate win rate between 0 and 1', () => {
      const result = runStrategy('AAPL', mockData, defaultConfig);

      expect(result.winRate).toBeGreaterThanOrEqual(0);
      expect(result.winRate).toBeLessThanOrEqual(1);
    });

    it('should calculate max drawdown as percentage', () => {
      const result = runStrategy('AAPL', mockData, defaultConfig);

      expect(result.maxDrawdown).toBeGreaterThanOrEqual(-1); // Can't lose more than 100%
      expect(result.maxDrawdown).toBeLessThanOrEqual(1); // Can't gain more than 100% as max drawdown
    });
  });

  describe('configuration variations', () => {
    it('should handle different window sizes', () => {
      const config1 = { ...defaultConfig, window: 3 };
      const config2 = { ...defaultConfig, window: 10 };

      const result1 = runStrategy('AAPL', mockData, config1);
      const result2 = runStrategy('AAPL', mockData, config2);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      // Different window sizes should potentially produce different results
    });

    it('should handle different threshold values', () => {
      const config1 = { ...defaultConfig, threshold: 0.02 };
      const config2 = { ...defaultConfig, threshold: 0.10 };

      const result1 = runStrategy('AAPL', mockData, config1);
      const result2 = runStrategy('AAPL', mockData, config2);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      // Different thresholds should potentially produce different results
    });

    it('should handle different initial capital', () => {
      const config1 = { ...defaultConfig, initialCapital: 5000 };
      const config2 = { ...defaultConfig, initialCapital: 20000 };

      const result1 = runStrategy('AAPL', mockData, config1);
      const result2 = runStrategy('AAPL', mockData, config2);

      expect(result1.finalPortfolioValue).toBeGreaterThan(0);
      expect(result2.finalPortfolioValue).toBeGreaterThan(0);
      // Total return should be similar regardless of initial capital (allowing for some variance)
      expect(Math.abs(result1.totalReturn - result2.totalReturn)).toBeLessThan(2.0);
    });
  });

  describe('edge cases', () => {
    it('should handle single data point', () => {
      const singleData = [{ date: '2023-01-01', close: 100, open: 99 }];
      const result = runStrategy('AAPL', singleData, defaultConfig);

      expect(result.trades).toEqual([]);
      expect(result.finalPortfolioValue).toBe(defaultConfig.initialCapital);
    });

    it('should handle insufficient data for moving average', () => {
      const shortData = mockData.slice(0, 3); // Less than window size
      const result = runStrategy('AAPL', shortData, defaultConfig);

      expect(result).toBeDefined();
      expect(result.trades.length).toBe(0);
    });

    it('should handle data with zero prices', () => {
      const dataWithZero = [
        { date: '2023-01-01', close: 0, open: 0 },
        { date: '2023-01-02', close: 100, open: 100 },
        { date: '2023-01-03', close: 0, open: 0 }
      ];

      expect(() => {
        runStrategy('AAPL', dataWithZero, defaultConfig);
      }).not.toThrow();
    });
  });
});
