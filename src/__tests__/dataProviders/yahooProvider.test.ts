import { YahooDataProvider } from '../../dataProviders/yahooProvider';
import yahooFinance from 'yahoo-finance2';

// Mock yahoo-finance2
jest.mock('yahoo-finance2');

describe('YahooDataProvider', () => {
  let provider: YahooDataProvider;
  const mockYahooFinance = yahooFinance as jest.Mocked<typeof yahooFinance>;

  beforeEach(() => {
    provider = new YahooDataProvider();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance successfully', () => {
      expect(provider).toBeInstanceOf(YahooDataProvider);
    });
  });

  describe('getQuote', () => {
    it('should return quote data for AAPL', async () => {
      const mockQuote = {
        symbol: 'AAPL',
        regularMarketPrice: 150.00,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 0.0169,
        regularMarketVolume: 50000000,
        regularMarketHigh: 152.00,
        regularMarketLow: 148.00,
        regularMarketOpen: 149.00,
        regularMarketPreviousClose: 147.50
      };

      mockYahooFinance.quote.mockResolvedValue(mockQuote);

      const result = await provider.getQuote('AAPL');

      expect(mockYahooFinance.quote).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(mockQuote);
    });

    it('should handle errors gracefully', async () => {
      mockYahooFinance.quote.mockRejectedValue(new Error('API Error'));

      const result = await provider.getQuote('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('getHistorical', () => {
    it('should return historical data', async () => {
      const mockHistoricalData = [
        {
          date: new Date('2023-01-01'),
          open: 150.00,
          high: 155.00,
          low: 148.00,
          close: 152.00,
          volume: 50000000
        },
        {
          date: new Date('2023-01-02'),
          open: 152.00,
          high: 158.00,
          low: 151.00,
          close: 156.00,
          volume: 45000000
        }
      ];

      mockYahooFinance.historical.mockResolvedValue(mockHistoricalData);

      const result = await provider.getHistorical('AAPL', '1d', '2023-01-01', '2023-01-31');

      expect(mockYahooFinance.historical).toHaveBeenCalledWith('AAPL', {
        period1: '2023-01-01',
        period2: '2023-01-31'
      });
      expect(result).toEqual(mockHistoricalData);
    });

    it('should return empty array on error', async () => {
      mockYahooFinance.historical.mockRejectedValue(new Error('API Error'));

      const result = await provider.getHistorical('INVALID', '1d', '2023-01-01', '2023-01-31');

      expect(result).toEqual([]);
    });

    it('should return empty array when response is null', async () => {
      mockYahooFinance.historical.mockResolvedValue(null);

      const result = await provider.getHistorical('AAPL', '1d', '2023-01-01', '2023-01-31');

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
