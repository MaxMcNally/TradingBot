import { SmartCacheManager } from '../../cache/SmartCacheManager';
import { DataProvider } from '../../dataProviders/baseProvider';
import { CachedDataProvider } from '../../cache/CachedDataProvider';

// Mock the CachedDataProvider
jest.mock('../../cache/CachedDataProvider');
const MockedCachedDataProvider = CachedDataProvider as jest.MockedClass<typeof CachedDataProvider>;

// Mock the cache database
jest.mock('../../cache/initCache', () => ({
  cacheDb: {
    getDatabase: jest.fn(() => ({
      all: jest.fn((query, callback) => callback(null, [])),
      get: jest.fn((query, callback) => callback(null, null)),
      run: jest.fn((query, callback) => callback(null))
    }))
  }
}));

describe('SmartCacheManager', () => {
  let mockProvider: jest.Mocked<DataProvider>;
  let mockCachedProvider: jest.Mocked<CachedDataProvider>;
  let smartCache: SmartCacheManager;

  beforeEach(() => {
    // Create mock data provider
    mockProvider = {
      getQuote: jest.fn(),
      getHistorical: jest.fn(),
      connectStream: jest.fn()
    } as any;

    // Create mock cached provider
    mockCachedProvider = {
      getHistorical: jest.fn(),
      getQuote: jest.fn(),
      connectStream: jest.fn()
    } as any;

    // Mock the CachedDataProvider constructor
    MockedCachedDataProvider.mockImplementation(() => mockCachedProvider);

    smartCache = new SmartCacheManager(mockProvider, 'test-provider');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with provider and name', () => {
      expect(smartCache).toBeInstanceOf(SmartCacheManager);
      expect(MockedCachedDataProvider).toHaveBeenCalledWith(mockProvider, 'test-provider');
    });
  });

  describe('getHistoricalSmart', () => {
  const mockHistoricalData = [
    { date: new Date('2023-01-01'), timestamp: 1672531200000, open: 100, high: 105, low: 98, close: 102, volume: 1000000 },
    { date: new Date('2023-01-02'), timestamp: 1672617600000, open: 102, high: 108, low: 101, close: 106, volume: 1100000 },
    { date: new Date('2023-01-03'), timestamp: 1672704000000, open: 106, high: 110, low: 104, close: 108, volume: 1200000 }
  ];

    it('should fetch complete range when no cache exists', async () => {
      mockCachedProvider.getHistorical.mockResolvedValue(mockHistoricalData);

      const result = await smartCache.getHistoricalSmart('AAPL', '1d', '2023-01-01', '2023-01-03');

      expect(mockCachedProvider.getHistorical).toHaveBeenCalledWith('AAPL', '1d', '2023-01-01', '2023-01-03');
      expect(result).toEqual(mockHistoricalData);
    });

    it('should return cached data when all data is available', async () => {
      // Mock that all data is cached
      const mockCachedRanges = [
        { start_date: '2023-01-01', end_date: '2023-01-03' }
      ];

      // Mock the database query to return cached ranges
      const mockDb = require('../../cache/initCache').cacheDb.getDatabase();
      mockDb.all.mockImplementation((query: string, callback: Function) => {
        if (query.includes('SELECT start_date, end_date')) {
          callback(null, mockCachedRanges);
        } else {
          callback(null, mockHistoricalData);
        }
      });

      const result = await smartCache.getHistoricalSmart('AAPL', '1d', '2023-01-01', '2023-01-03');

      expect(result).toEqual(mockHistoricalData);
    });

    it('should handle gaps in cached data', async () => {
      // Mock partial cache coverage
      const mockCachedRanges = [
        { start_date: '2023-01-01', end_date: '2023-01-02' }
      ];

      const mockDb = require('../../cache/initCache').cacheDb.getDatabase();
      mockDb.all.mockImplementation((query: string, callback: Function) => {
        if (query.includes('SELECT start_date, end_date')) {
          callback(null, mockCachedRanges);
        } else if (query.includes('SELECT * FROM historical_data_cache')) {
          callback(null, mockHistoricalData.slice(0, 2)); // Return partial data
        } else {
          callback(null, []);
        }
      });

      // Mock fetching missing data
      mockCachedProvider.getHistorical.mockResolvedValue(mockHistoricalData.slice(2));

      const result = await smartCache.getHistoricalSmart('AAPL', '1d', '2023-01-01', '2023-01-03');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCachedRanges', () => {
    it('should return cached ranges for symbol and interval', async () => {
      const mockRanges = [
        { start_date: '2023-01-01', end_date: '2023-01-02' },
        { start_date: '2023-01-03', end_date: '2023-01-04' }
      ];

      const mockDb = require('../../cache/initCache').cacheDb.getDatabase();
      mockDb.all.mockImplementation((query: string, callback: Function) => {
        callback(null, mockRanges);
      });

      const result = await (smartCache as any).getCachedRanges('AAPL', '1d');

      expect(result).toEqual(mockRanges);
    });

    it('should handle database errors gracefully', async () => {
      const mockDb = require('../../cache/initCache').cacheDb.getDatabase();
      mockDb.all.mockImplementation((query: string, callback: Function) => {
        callback(new Error('Database error'), null);
      });

      const result = await (smartCache as any).getCachedRanges('AAPL', '1d');

      expect(result).toEqual([]);
    });
  });

  describe('findGapsInRange', () => {
    it('should find no gaps when range is fully covered', () => {
      const cachedRanges = [
        { start: '2023-01-01', end: '2023-01-03' }
      ];

      const gaps = (smartCache as any).findGapsInRange(cachedRanges, '2023-01-01', '2023-01-03');

      expect(gaps).toEqual([]);
    });

    it('should find gap before cached range', () => {
      const cachedRanges = [
        { start: '2023-01-02', end: '2023-01-03' }
      ];

      const gaps = (smartCache as any).findGapsInRange(cachedRanges, '2023-01-01', '2023-01-03');

      expect(gaps).toHaveLength(1);
      expect(gaps[0]).toEqual({
        start: '2023-01-01',
        end: '2023-01-01',
        type: 'before'
      });
    });

    it('should find gap after cached range', () => {
      const cachedRanges = [
        { start: '2023-01-01', end: '2023-01-02' }
      ];

      const gaps = (smartCache as any).findGapsInRange(cachedRanges, '2023-01-01', '2023-01-03');

      expect(gaps).toHaveLength(1);
      expect(gaps[0]).toEqual({
        start: '2023-01-03',
        end: '2023-01-03',
        type: 'after'
      });
    });

    it('should find gap between cached ranges', () => {
      const cachedRanges = [
        { start: '2023-01-01', end: '2023-01-02' },
        { start: '2023-01-04', end: '2023-01-05' }
      ];

      const gaps = (smartCache as any).findGapsInRange(cachedRanges, '2023-01-01', '2023-01-05');

      expect(gaps).toHaveLength(1);
      expect(gaps[0]).toEqual({
        start: '2023-01-03',
        end: '2023-01-03',
        type: 'middle'
      });
    });
  });

  describe('prePopulateCache', () => {
    it('should pre-populate cache with data', async () => {
      const mockData = [
        { date: new Date('2023-01-01'), timestamp: 1672531200000, open: 100, high: 105, low: 98, close: 102, volume: 1000000 }
      ];
      mockCachedProvider.getHistorical.mockResolvedValue(mockData);

      await smartCache.prePopulateCache('AAPL', '1d', '2023-01-01', '2023-01-03');

      expect(mockCachedProvider.getHistorical).toHaveBeenCalledWith('AAPL', '1d', '2023-01-01', '2023-01-03');
    });
  });

  describe('getCacheAnalysis', () => {
    it('should return cache analysis for symbol', async () => {
      const mockAnalysis = {
        totalRanges: 2,
        coverage: {
          start: '2023-01-01',
          end: '2023-01-03',
          totalDays: 3
        }
      };

      const mockDb = require('../../cache/initCache').cacheDb.getDatabase();
      mockDb.all.mockImplementation((query: string, callback: Function) => {
        if (query.includes('SELECT start_date, end_date')) {
          callback(null, [
            { start_date: '2023-01-01', end_date: '2023-01-02' },
            { start_date: '2023-01-03', end_date: '2023-01-03' }
          ]);
        } else {
          callback(null, []);
        }
      });

      const result = await smartCache.getCacheAnalysis('AAPL');

      expect(result).toBeDefined();
      expect(result.totalRanges).toBe(2);
    });
  });
});
