import { PolygonProvider } from '../../dataProviders/PolygonProvider';

// Mock fetch and WebSocket
global.fetch = jest.fn();
global.WebSocket = jest.fn() as any;

describe('PolygonProvider', () => {
  let provider: PolygonProvider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    provider = new PolygonProvider(mockApiKey);
    jest.clearAllMocks();
  });

  describe('getQuote', () => {
    it('should return quote from market snapshot when available', async () => {
      const mockSnapshotResponse = {
        status: 'OK',
        tickers: [{
          ticker: 'AAPL',
          day: { c: 150.25 },
          updated: 1703000000000000 // nanoseconds
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockSnapshotResponse)
      });

      const result = await provider.getQuote('AAPL');

      expect(fetch).toHaveBeenCalledWith(
        `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=AAPL&apiKey=${mockApiKey}`
      );
      expect(result).toEqual({
        symbol: 'AAPL',
        price: 150.25,
        timestamp: 1703000000 // converted from nanoseconds
      });
    });

    it('should fallback to last trade endpoint when snapshot fails', async () => {
      const mockSnapshotResponse = { status: 'ERROR' };
      const mockLastTradeResponse = {
        results: { p: 150.25, t: 1703000000 }
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockSnapshotResponse)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockLastTradeResponse)
        });

      const result = await provider.getQuote('AAPL');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        symbol: 'AAPL',
        price: 150.25,
        timestamp: 1703000000
      });
    });

    it('should return null price when both endpoints fail', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await provider.getQuote('AAPL');

      expect(result).toEqual({
        symbol: 'AAPL',
        price: null,
        timestamp: null
      });
    });
  });

  describe('getHistorical', () => {
    it('should return formatted historical data', async () => {
      const mockResponse = {
        results: [
          {
            t: 1703000000000,
            c: 150.25,
            o: 149.50,
            h: 151.00,
            l: 149.00,
            v: 1000000
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await provider.getHistorical('AAPL', 'day', '2023-01-01', '2023-01-31');

      expect(fetch).toHaveBeenCalledWith(
        `https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2023-01-01/2023-01-31?apiKey=${mockApiKey}`
      );
      expect(result).toEqual([{
        date: '2023-12-20',
        timestamp: 1703000000000,
        close: 150.25,
        open: 149.50,
        high: 151.00,
        low: 149.00,
        volume: 1000000
      }]);
    });

    it('should handle different intervals correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ results: [] })
      });

      await provider.getHistorical('AAPL', 'minute', '2023-01-01', '2023-01-01');

      expect(fetch).toHaveBeenCalledWith(
        `https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/minute/2023-01-01/2023-01-01?apiKey=${mockApiKey}`
      );
    });

    it('should return empty array when no data available', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ results: null })
      });

      const result = await provider.getHistorical('AAPL', 'day', '2023-01-01', '2023-01-31');

      expect(result).toEqual([]);
    });
  });

  describe('getMinuteData', () => {
    it('should return minute-level data for a specific date', async () => {
      const mockResponse = {
        results: [
          {
            t: 1703000000000,
            c: 150.25,
            o: 149.50,
            h: 151.00,
            l: 149.00,
            v: 1000
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await provider.getMinuteData('AAPL', '2023-12-20');

      expect(fetch).toHaveBeenCalledWith(
        `https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/minute/2023-12-20/2023-12-20?apiKey=${mockApiKey}`
      );
      expect(result).toEqual([{
        timestamp: 1703000000000,
        date: '2023-12-20T00:00:00.000Z',
        close: 150.25,
        open: 149.50,
        high: 151.00,
        low: 149.00,
        volume: 1000
      }]);
    });
  });

  describe('getTechnicalIndicator', () => {
    it('should return technical indicator data', async () => {
      const mockResponse = {
        status: 'OK',
        results: {
          values: [
            { value: 150.25, timestamp: 1703000000 }
          ]
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await provider.getTechnicalIndicator('AAPL', 'sma', { window: 20 });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.polygon.io/v1/indicators/sma/AAPL')
      );
      expect(result).toEqual([{
        value: 150.25,
        timestamp: 1703000000
      }]);
    });

    it('should return empty array when indicator data unavailable', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ status: 'ERROR' })
      });

      const result = await provider.getTechnicalIndicator('AAPL', 'sma');

      expect(result).toEqual([]);
    });
  });

  describe('connectStream', () => {
    it('should create WebSocket connection and authenticate', async () => {
      const mockWs = {
        on: jest.fn(),
        send: jest.fn()
      };
      (WebSocket as any).mockImplementation(() => mockWs);

      const onData = jest.fn();
      const result = await provider.connectStream(['AAPL'], onData);

      expect(WebSocket).toHaveBeenCalledWith('wss://socket.polygon.io/stocks');
      expect(mockWs.on).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(result).toBe(mockWs);
    });

    it('should handle WebSocket connection errors', async () => {
      const mockError = new Error('Connection failed');
      (WebSocket as any).mockImplementation(() => {
        throw mockError;
      });

      const onData = jest.fn();
      
      await expect(provider.connectStream(['AAPL'], onData)).rejects.toThrow('Connection failed');
    });
  });

  describe('convertIntervalToTimeframe', () => {
    it('should convert intervals correctly', () => {
      // Access private method through any casting
      const providerAny = provider as any;
      
      expect(providerAny.convertIntervalToTimeframe('minute')).toBe('minute');
      expect(providerAny.convertIntervalToTimeframe('5min')).toBe('5minute');
      expect(providerAny.convertIntervalToTimeframe('15min')).toBe('15minute');
      expect(providerAny.convertIntervalToTimeframe('30min')).toBe('30minute');
      expect(providerAny.convertIntervalToTimeframe('hour')).toBe('hour');
      expect(providerAny.convertIntervalToTimeframe('day')).toBe('day');
      expect(providerAny.convertIntervalToTimeframe('week')).toBe('week');
      expect(providerAny.convertIntervalToTimeframe('month')).toBe('month');
    });
  });
});
