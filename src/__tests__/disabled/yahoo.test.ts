import { fetchYahooData, OHLC } from '../../utils/yahoo';
import fetch from 'node-fetch';

// Mock node-fetch
jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Yahoo Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchYahooData', () => {
    const mockCsvResponse = `Date,Open,High,Low,Close,Adj Close,Volume
2023-01-01,100.00,105.00,98.00,102.00,102.00,1000000
2023-01-02,102.00,108.00,101.00,106.00,106.00,1100000
2023-01-03,106.00,110.00,104.00,108.00,108.00,1200000`;

    it('should fetch and parse Yahoo data correctly', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(mockCsvResponse)
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await fetchYahooData('AAPL', '2023-01-01', '2023-01-03');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://query1.finance.yahoo.com/v7/finance/download/AAPL')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('period1=')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('period2=')
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        date: '2023-01-01',
        open: 100.00,
        high: 105.00,
        low: 98.00,
        close: 102.00,
        volume: 1000000
      });
      expect(result[1]).toEqual({
        date: '2023-01-02',
        open: 102.00,
        high: 108.00,
        low: 101.00,
        close: 106.00,
        volume: 1100000
      });
      expect(result[2]).toEqual({
        date: '2023-01-03',
        open: 106.00,
        high: 110.00,
        low: 104.00,
        close: 108.00,
        volume: 1200000
      });
    });

    it('should handle empty CSV response', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('Date,Open,High,Low,Close,Adj Close,Volume\n')
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await fetchYahooData('AAPL', '2023-01-01', '2023-01-03');

      expect(result).toEqual([]);
    });

    it('should filter out empty lines', async () => {
      const csvWithEmptyLines = `Date,Open,High,Low,Close,Adj Close,Volume
2023-01-01,100.00,105.00,98.00,102.00,102.00,1000000

2023-01-02,102.00,108.00,101.00,106.00,106.00,1100000
`;

      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(csvWithEmptyLines)
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await fetchYahooData('AAPL', '2023-01-01', '2023-01-03');

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2023-01-01');
      expect(result[1].date).toBe('2023-01-02');
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found'
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(fetchYahooData('INVALID', '2023-01-01', '2023-01-03'))
        .rejects.toThrow('Failed to fetch data: Not Found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchYahooData('AAPL', '2023-01-01', '2023-01-03'))
        .rejects.toThrow('Network error');
    });

    it('should handle malformed CSV data', async () => {
      const malformedCsv = `Date,Open,High,Low,Close,Adj Close,Volume
2023-01-01,100.00,105.00,98.00,102.00,102.00,1000000
invalid,line,data
2023-01-02,102.00,108.00,101.00,106.00,106.00,1100000`;

      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(malformedCsv)
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      // Should not throw, but may produce NaN values
      const result = await fetchYahooData('AAPL', '2023-01-01', '2023-01-03');

      expect(result).toHaveLength(3);
      expect(result[0].close).toBe(102.00);
      expect(result[1].close).toBeNaN(); // Invalid line should produce NaN
      expect(result[2].close).toBe(106.00);
    });

    it('should construct correct URL with date parameters', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('Date,Open,High,Low,Close,Adj Close,Volume\n')
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await fetchYahooData('AAPL', '2023-01-01', '2023-01-31');

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('symbol=AAPL');
      expect(callUrl).toContain('interval=1d');
      expect(callUrl).toContain('events=history');
      expect(callUrl).toContain('period1=');
      expect(callUrl).toContain('period2=');
    });

    it('should parse numeric values correctly', async () => {
      const csvWithDecimals = `Date,Open,High,Low,Close,Adj Close,Volume
2023-01-01,100.50,105.75,98.25,102.00,102.00,1000000
2023-01-02,102.00,108.00,101.00,106.50,106.50,1100000`;

      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(csvWithDecimals)
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await fetchYahooData('AAPL', '2023-01-01', '2023-01-02');

      expect(result[0].open).toBe(100.50);
      expect(result[0].high).toBe(105.75);
      expect(result[0].low).toBe(98.25);
      expect(result[0].close).toBe(102.00);
      expect(result[0].volume).toBe(1000000);

      expect(result[1].close).toBe(106.50);
      expect(result[1].volume).toBe(1100000);
    });
  });

  describe('OHLC interface', () => {
    it('should have correct structure', () => {
      const ohlc: OHLC = {
        date: '2023-01-01',
        open: 100.00,
        high: 105.00,
        low: 98.00,
        close: 102.00,
        volume: 1000000
      };

      expect(ohlc.date).toBe('2023-01-01');
      expect(ohlc.open).toBe(100.00);
      expect(ohlc.high).toBe(105.00);
      expect(ohlc.low).toBe(98.00);
      expect(ohlc.close).toBe(102.00);
      expect(ohlc.volume).toBe(1000000);
    });
  });
});
