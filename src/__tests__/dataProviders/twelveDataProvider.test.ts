import { TwelveDataProvider } from '../../dataProviders/TwelveDataProvider';
import fetch from 'node-fetch';

// Mock node-fetch
jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('TwelveDataProvider', () => {
  let provider: TwelveDataProvider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    // Mock environment variable
    process.env.TWELVE_DATA_API_KEY = mockApiKey;
    provider = new TwelveDataProvider(mockApiKey);
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.TWELVE_DATA_API_KEY;
  });

  describe('constructor', () => {
    it('should create instance with API key', () => {
      expect(provider).toBeInstanceOf(TwelveDataProvider);
    });
  });

  describe('getQuote', () => {
    it('should return formatted quote data', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          symbol: 'AAPL',
          close: '150.00',
          timestamp: '2023-01-01 16:00:00',
          change: '2.50',
          percent_change: '1.69',
          volume: '50000000',
          high: '152.00',
          low: '148.00',
          open: '149.00',
          previous_close: '147.50'
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await provider.getQuote('AAPL');

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.twelvedata.com/quote?symbol=AAPL&apikey=${mockApiKey}`
      );
      expect(result).toEqual({
        symbol: 'AAPL',
        price: 150.00,
        timestamp: new Date('2023-01-01 16:00:00').getTime(),
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        high: 152.00,
        low: 148.00,
        open: 149.00,
        previousClose: 147.50
      });
    });

    it('should return null on API error', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          status: 'error',
          message: 'Invalid symbol'
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await provider.getQuote('INVALID');

      expect(result).toBeNull();
    });

    it('should return null on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await provider.getQuote('AAPL');

      expect(result).toBeNull();
    });
  });

  describe('getHistorical', () => {
    it('should return formatted historical data', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          values: [
            {
              datetime: '2023-01-01',
              open: '150.00',
              high: '155.00',
              low: '148.00',
              close: '152.00',
              volume: '50000000'
            },
            {
              datetime: '2023-01-02',
              open: '152.00',
              high: '158.00',
              low: '151.00',
              close: '156.00',
              volume: '45000000'
            }
          ]
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await provider.getHistorical('AAPL', '1day', '2023-01-01', '2023-01-31');

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.twelvedata.com/time_series?symbol=AAPL&interval=1day&start_date=2023-01-01&end_date=2023-01-31&apikey=${mockApiKey}`
      );
      expect(result).toEqual([
        {
          timestamp: new Date('2023-01-01').getTime(),
          open: 150.00,
          high: 155.00,
          low: 148.00,
          close: 152.00,
          volume: 50000000
        },
        {
          timestamp: new Date('2023-01-02').getTime(),
          open: 152.00,
          high: 158.00,
          low: 151.00,
          close: 156.00,
          volume: 45000000
        }
      ]);
    });

    it('should map different interval formats correctly', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ values: [] })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await provider.getHistorical('AAPL', '1hour', '2023-01-01', '2023-01-31');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('interval=1h')
      );
    });

    it('should return empty array on API error', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          status: 'error',
          message: 'Invalid parameters'
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await provider.getHistorical('INVALID', '1day', '2023-01-01', '2023-01-31');

      expect(result).toEqual([]);
    });

    it('should return empty array on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await provider.getHistorical('AAPL', '1day', '2023-01-01', '2023-01-31');

      expect(result).toEqual([]);
    });

    it('should handle empty values array', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          values: []
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await provider.getHistorical('AAPL', '1day', '2023-01-01', '2023-01-31');

      expect(result).toEqual([]);
    });
  });

  describe('connectStream', () => {
    it('should return resolved promise', async () => {
      const mockCallback = jest.fn();
      const result = await provider.connectStream(['AAPL'], mockCallback);

      expect(result).toBeUndefined();
    });
  });
});
