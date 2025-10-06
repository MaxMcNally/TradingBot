import { 
  MeanReversionStrategy, 
  MeanReversionConfig, 
  runMeanReversionStrategy,
  MeanReversionResult 
} from '../../strategies/meanReversionStrategy';

describe('MeanReversionStrategy', () => {
  const defaultConfig: MeanReversionConfig = {
    window: 5,
    threshold: 0.05
  };

  describe('constructor', () => {
    it('should create instance with config', () => {
      const strategy = new MeanReversionStrategy(defaultConfig);
      expect(strategy).toBeInstanceOf(MeanReversionStrategy);
    });
  });

  describe('addPrice', () => {
    let strategy: MeanReversionStrategy;

    beforeEach(() => {
      strategy = new MeanReversionStrategy(defaultConfig);
    });

    it('should return null when insufficient data for moving average', () => {
      const result = strategy.addPrice(100);
      expect(result).toBeNull();
    });

    it('should return null when price is within threshold', () => {
      // Add enough prices to establish moving average
      const prices = [100, 102, 98, 105, 103];
      prices.forEach(price => strategy.addPrice(price));

      // Price close to moving average should not trigger signal
      const result = strategy.addPrice(101.6); // Close to MA of ~101.6
      expect(result).toBeNull();
    });

    it('should return BUY when price is significantly below moving average', () => {
      // Add prices to establish moving average
      const prices = [100, 102, 98, 105, 103];
      prices.forEach(price => strategy.addPrice(price));

      // Price significantly below MA should trigger BUY
      const result = strategy.addPrice(95); // Well below MA of ~101.6
      expect(result).toBe('BUY');
    });

    it('should return SELL when price is significantly above moving average', () => {
      // Add prices to establish moving average
      const prices = [100, 102, 98, 105, 103];
      prices.forEach(price => strategy.addPrice(price));

      // Price significantly above MA should trigger SELL
      const result = strategy.addPrice(110); // Well above MA of ~101.6
      expect(result).toBe('SELL');
    });
  });

  describe('getCurrentPosition', () => {
    let strategy: MeanReversionStrategy;

    beforeEach(() => {
      strategy = new MeanReversionStrategy(defaultConfig);
    });

    it('should return NONE initially', () => {
      expect(strategy.getCurrentPosition()).toBe('NONE');
    });

    it('should track position after BUY signal', () => {
      const prices = [100, 102, 98, 105, 103];
      prices.forEach(price => strategy.addPrice(price));
      
      strategy.addPrice(95); // Should trigger BUY
      expect(strategy.getCurrentPosition()).toBe('LONG');
    });

    it('should track position after SELL signal', () => {
      const prices = [100, 102, 98, 105, 103];
      prices.forEach(price => strategy.addPrice(price));
      
      strategy.addPrice(110); // Should trigger SELL
      expect(strategy.getCurrentPosition()).toBe('SHORT');
    });
  });

  describe('getEntryPrice', () => {
    let strategy: MeanReversionStrategy;

    beforeEach(() => {
      strategy = new MeanReversionStrategy(defaultConfig);
    });

    it('should return 0 initially', () => {
      expect(strategy.getEntryPrice()).toBe(0);
    });

    it('should track entry price after BUY signal', () => {
      const prices = [100, 102, 98, 105, 103];
      prices.forEach(price => strategy.addPrice(price));
      
      const entryPrice = 95;
      strategy.addPrice(entryPrice); // Should trigger BUY
      expect(strategy.getEntryPrice()).toBe(entryPrice);
    });
  });

  describe('reset', () => {
    let strategy: MeanReversionStrategy;

    beforeEach(() => {
      strategy = new MeanReversionStrategy(defaultConfig);
    });

    it('should reset position and entry price', () => {
      const prices = [100, 102, 98, 105, 103];
      prices.forEach(price => strategy.addPrice(price));
      
      strategy.addPrice(95); // Should trigger BUY
      expect(strategy.getCurrentPosition()).toBe('LONG');
      expect(strategy.getEntryPrice()).toBe(95);

      strategy.reset();
      expect(strategy.getCurrentPosition()).toBe('NONE');
      expect(strategy.getEntryPrice()).toBe(0);
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
    { date: '2023-01-25', close: 138, open: 133 }
  ];

  const defaultConfig = {
    window: 5,
    threshold: 0.05,
    initialCapital: 10000,
    sharesPerTrade: 100
  };

  describe('basic functionality', () => {
    it('should return a valid MeanReversionResult', () => {
      const result = runMeanReversionStrategy('AAPL', mockData, defaultConfig);

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

    it('should handle empty data array', () => {
      const result = runMeanReversionStrategy('AAPL', [], defaultConfig);

      expect(result.trades).toEqual([]);
      expect(result.finalPortfolioValue).toBe(defaultConfig.initialCapital);
      expect(result.totalReturn).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.maxDrawdown).toBe(0);
    });

    it('should handle insufficient data for moving average', () => {
      const shortData = mockData.slice(0, 3);
      const result = runMeanReversionStrategy('AAPL', shortData, defaultConfig);

      expect(result.trades).toEqual([]);
      expect(result.finalPortfolioValue).toBe(defaultConfig.initialCapital);
    });
  });

  describe('trade generation', () => {
    it('should generate trades based on mean reversion logic', () => {
      const result = runMeanReversionStrategy('AAPL', mockData, defaultConfig);

      // Should have some trades if data has enough variation
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

    it('should include moving average and deviation in trades', () => {
      const result = runMeanReversionStrategy('AAPL', mockData, defaultConfig);

      result.trades.forEach(trade => {
        if (trade.movingAverage !== undefined) {
          expect(typeof trade.movingAverage).toBe('number');
          expect(trade.movingAverage).toBeGreaterThan(0);
        }
        if (trade.deviation !== undefined) {
          expect(typeof trade.deviation).toBe('number');
        }
      });
    });
  });

  describe('portfolio calculations', () => {
    it('should calculate final portfolio value correctly', () => {
      const result = runMeanReversionStrategy('AAPL', mockData, defaultConfig);

      expect(result.finalPortfolioValue).toBeGreaterThan(0);
      expect(result.finalPortfolioValue).toBeGreaterThanOrEqual(defaultConfig.initialCapital * 0.5);
    });

    it('should calculate total return as percentage', () => {
      const result = runMeanReversionStrategy('AAPL', mockData, defaultConfig);

      expect(result.totalReturn).toBeGreaterThanOrEqual(-1);
      expect(result.totalReturn).toBeLessThan(10);
    });

    it('should calculate win rate between 0 and 1', () => {
      const result = runMeanReversionStrategy('AAPL', mockData, defaultConfig);

      expect(result.winRate).toBeGreaterThanOrEqual(0);
      expect(result.winRate).toBeLessThanOrEqual(1);
    });

    it('should calculate max drawdown as negative percentage', () => {
      const result = runMeanReversionStrategy('AAPL', mockData, defaultConfig);

      expect(result.maxDrawdown).toBeLessThanOrEqual(0);
      expect(result.maxDrawdown).toBeGreaterThanOrEqual(-1);
    });
  });

  describe('configuration variations', () => {
    it('should handle different window sizes', () => {
      const config1 = { ...defaultConfig, window: 3 };
      const config2 = { ...defaultConfig, window: 10 };

      const result1 = runMeanReversionStrategy('AAPL', mockData, config1);
      const result2 = runMeanReversionStrategy('AAPL', mockData, config2);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should handle different threshold values', () => {
      const config1 = { ...defaultConfig, threshold: 0.02 };
      const config2 = { ...defaultConfig, threshold: 0.10 };

      const result1 = runMeanReversionStrategy('AAPL', mockData, config1);
      const result2 = runMeanReversionStrategy('AAPL', mockData, config2);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
