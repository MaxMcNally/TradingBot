import { runStrategy } from '../strategies/runStrategy';
import { YahooDataProvider } from '../dataProviders/yahooProvider';
import { SmartCacheManager } from '../cache/SmartCacheManager';

// Mock the dependencies
jest.mock('../dataProviders/yahooProvider');
jest.mock('../cache/SmartCacheManager');

describe('Backtest Integration', () => {
  let mockYahooProvider: jest.Mocked<YahooDataProvider>;
  let mockSmartCache: jest.Mocked<SmartCacheManager>;

  beforeEach(() => {
    // Create mock Yahoo provider
    mockYahooProvider = {
      getQuote: jest.fn(),
      getHistorical: jest.fn(),
      connectStream: jest.fn()
    } as any;

    // Create mock SmartCache
    mockSmartCache = {
      getHistoricalSmart: jest.fn(),
      prePopulateCache: jest.fn(),
      getCacheAnalysis: jest.fn()
    } as any;

    // Mock the constructors
    (YahooDataProvider as jest.MockedClass<typeof YahooDataProvider>).mockImplementation(() => mockYahooProvider);
    (SmartCacheManager as jest.MockedClass<typeof SmartCacheManager>).mockImplementation(() => mockSmartCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('backtest workflow', () => {
    const mockHistoricalData = [
      { date: new Date('2023-01-01'), close: 100, open: 99, high: 105, low: 95, volume: 1000000 },
      { date: new Date('2023-01-02'), close: 102, open: 100, high: 108, low: 98, volume: 1100000 },
      { date: new Date('2023-01-03'), close: 98, open: 102, high: 104, low: 96, volume: 1200000 },
      { date: new Date('2023-01-04'), close: 105, open: 98, high: 110, low: 97, volume: 1300000 },
      { date: new Date('2023-01-05'), close: 103, open: 105, high: 107, low: 101, volume: 1400000 },
      { date: new Date('2023-01-06'), close: 107, open: 103, high: 112, low: 102, volume: 1500000 },
      { date: new Date('2023-01-07'), close: 110, open: 107, high: 115, low: 106, volume: 1600000 },
      { date: new Date('2023-01-08'), close: 108, open: 110, high: 113, low: 105, volume: 1700000 },
      { date: new Date('2023-01-09'), close: 112, open: 108, high: 118, low: 107, volume: 1800000 },
      { date: new Date('2023-01-10'), close: 115, open: 112, high: 120, low: 110, volume: 1900000 },
      { date: new Date('2023-01-11'), close: 113, open: 115, high: 117, low: 111, volume: 2000000 },
      { date: new Date('2023-01-12'), close: 118, open: 113, high: 122, low: 112, volume: 2100000 },
      { date: new Date('2023-01-13'), close: 116, open: 118, high: 120, low: 114, volume: 2200000 },
      { date: new Date('2023-01-14'), close: 120, open: 116, high: 125, low: 115, volume: 2300000 },
      { date: new Date('2023-01-15'), close: 122, open: 120, high: 127, low: 118, volume: 2400000 },
      { date: new Date('2023-01-16'), close: 119, open: 122, high: 124, low: 117, volume: 2500000 },
      { date: new Date('2023-01-17'), close: 125, open: 119, high: 130, low: 118, volume: 2600000 },
      { date: new Date('2023-01-18'), close: 123, open: 125, high: 128, low: 121, volume: 2700000 },
      { date: new Date('2023-01-19'), close: 128, open: 123, high: 132, low: 122, volume: 2800000 },
      { date: new Date('2023-01-20'), close: 130, open: 128, high: 135, low: 126, volume: 2900000 },
      { date: new Date('2023-01-21'), close: 127, open: 130, high: 133, low: 125, volume: 3000000 },
      { date: new Date('2023-01-22'), close: 132, open: 127, high: 137, low: 126, volume: 3100000 },
      { date: new Date('2023-01-23'), close: 135, open: 132, high: 140, low: 130, volume: 3200000 },
      { date: new Date('2023-01-24'), close: 133, open: 135, high: 138, low: 131, volume: 3300000 },
      { date: new Date('2023-01-25'), close: 138, open: 133, high: 142, low: 132, volume: 3400000 }
    ];

    it('should run complete backtest workflow with cache', async () => {
      // Mock cache returning data
      mockSmartCache.getHistoricalSmart.mockResolvedValue(mockHistoricalData);
      mockSmartCache.getCacheAnalysis.mockResolvedValue({
        totalRanges: 1,
        coverage: {
          start: '2023-01-01',
          end: '2023-01-25',
          totalDays: 25
        }
      });

      // Transform data for strategy
      const transformedData = mockHistoricalData.map(d => ({
        date: new Date(d.date).toDateString(),
        close: d.close,
        open: d.open
      }));

      // Run strategy
      const result = runStrategy('AAPL', transformedData, {
        window: 5,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      });

      // Verify results
      expect(result).toBeDefined();
      expect(result.trades).toBeDefined();
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
      expect(result.totalReturn).toBeDefined();
      expect(result.winRate).toBeDefined();
      expect(result.maxDrawdown).toBeDefined();
    });

    it('should run backtest workflow without cache', async () => {
      // Mock direct provider call
      mockYahooProvider.getHistorical.mockResolvedValue(mockHistoricalData);

      // Transform data for strategy
      const transformedData = mockHistoricalData.map(d => ({
        date: new Date(d.date).toDateString(),
        close: d.close,
        open: d.open
      }));

      // Run strategy
      const result = runStrategy('AAPL', transformedData, {
        window: 5,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      });

      // Verify results
      expect(result).toBeDefined();
      expect(result.trades).toBeDefined();
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
    });

    it('should handle pre-population of cache', async () => {
      mockSmartCache.prePopulateCache.mockResolvedValue(undefined);
      mockSmartCache.getHistoricalSmart.mockResolvedValue(mockHistoricalData);

      // Simulate pre-population
      await mockSmartCache.prePopulateCache('AAPL', '1d', '2023-01-01', '2023-01-25');

      expect(mockSmartCache.prePopulateCache).toHaveBeenCalledWith('AAPL', '1d', '2023-01-01', '2023-01-25');
    });

    it('should handle cache statistics', async () => {
      const mockCacheStats = {
        totalRanges: 2,
        coverage: {
          start: '2023-01-01',
          end: '2023-01-25',
          totalDays: 25
        }
      };

      mockSmartCache.getCacheAnalysis.mockResolvedValue(mockCacheStats);

      const stats = await mockSmartCache.getCacheAnalysis('AAPL');

      expect(stats).toEqual(mockCacheStats);
      expect(stats.totalRanges).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle data provider errors gracefully', async () => {
      mockSmartCache.getHistoricalSmart.mockRejectedValue(new Error('API Error'));

      try {
        await mockSmartCache.getHistoricalSmart('AAPL', '1d', '2023-01-01', '2023-01-31');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('API Error');
      }
    });

    it('should handle empty data responses', async () => {
      mockSmartCache.getHistoricalSmart.mockResolvedValue([]);

      const data = await mockSmartCache.getHistoricalSmart('AAPL', '1d', '2023-01-01', '2023-01-31');

      expect(data).toEqual([]);

      // Run strategy with empty data
      const result = runStrategy('AAPL', [], {
        window: 5,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      });

      expect(result.trades).toEqual([]);
      expect(result.finalPortfolioValue).toBe(10000);
      expect(result.totalReturn).toBe(0);
    });

    it('should handle cache analysis errors', async () => {
      mockSmartCache.getCacheAnalysis.mockRejectedValue(new Error('Database Error'));

      try {
        await mockSmartCache.getCacheAnalysis('AAPL');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database Error');
      }
    });
  });

  describe('performance considerations', () => {
    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        date: new Date(`2023-01-${String(i + 1).padStart(2, '0')}`),
        close: 100 + Math.random() * 50,
        open: 100 + Math.random() * 50,
        high: 100 + Math.random() * 50 + 5,
        low: 100 + Math.random() * 50 - 5,
        volume: Math.floor(Math.random() * 1000000) + 100000
      }));

      mockSmartCache.getHistoricalSmart.mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const data = await mockSmartCache.getHistoricalSmart('AAPL', '1d', '2023-01-01', '2023-12-31');
      const fetchTime = Date.now() - startTime;

      expect(data).toHaveLength(1000);
      expect(fetchTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test strategy performance with large dataset
      const transformedData = largeDataset.map(d => ({
        date: new Date(d.date).toDateString(),
        close: d.close,
        open: d.open
      }));

      const strategyStartTime = Date.now();
      const result = runStrategy('AAPL', transformedData, {
        window: 20,
        threshold: 0.05,
        initialCapital: 10000,
        sharesPerTrade: 100
      });
      const strategyTime = Date.now() - strategyStartTime;

      expect(result).toBeDefined();
      expect(strategyTime).toBeLessThan(1000); // Strategy should complete within 1 second
    });
  });
});
