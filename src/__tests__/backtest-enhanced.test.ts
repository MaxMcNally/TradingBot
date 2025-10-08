import { PolygonProvider } from '../dataProviders/PolygonProvider';
import { runMeanReversionStrategy } from '../strategies/meanReversionStrategy';
import { runMomentumStrategy } from '../strategies/momentumStrategy';
import { runMovingAverageCrossoverStrategy } from '../strategies/movingAverageCrossoverStrategy';

// Mock fetch
global.fetch = jest.fn();

describe('Enhanced Backtesting with Polygon Provider', () => {
  let provider: PolygonProvider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    provider = new PolygonProvider(mockApiKey);
    jest.clearAllMocks();
  });

  describe('Minute-level backtesting', () => {
    const generateMinuteData = (length: number, startPrice = 100) => {
      const data = [];
      let price = startPrice;
      const baseTime = new Date('2023-12-20T09:30:00Z').getTime();
      
      for (let i = 0; i < length; i++) {
        const change = (Math.sin(i / 10) + Math.random() - 0.5) * 0.5;
        const open = price;
        price = Math.max(1, price + change);
        
        data.push({
          date: new Date(baseTime + i * 60000).toDateString(), // 1 minute intervals
          close: price,
          open: open,
          volume: 1000 + Math.random() * 500
        });
      }
      return data;
    };

    it('should run mean reversion strategy on minute data', () => {
      const minuteData = generateMinuteData(1000); // 1000 minutes of data
      
      const result = runMeanReversionStrategy('AAPL', minuteData, {
        window: 10,
        threshold: 0.01,
        initialCapital: 10000,
        sharesPerTrade: 10
      });

      expect(result).toBeDefined();
      expect(result.trades).toBeDefined();
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
      expect(result.totalReturn).toBeDefined();
      expect(result.winRate).toBeDefined();
      expect(result.maxDrawdown).toBeDefined();
    });

    it('should run momentum strategy on minute data', () => {
      const minuteData = generateMinuteData(1000);
      
      const result = runMomentumStrategy('AAPL', minuteData, {
        rsiWindow: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        momentumWindow: 10,
        momentumThreshold: 0.01,
        initialCapital: 10000,
        sharesPerTrade: 10
      });

      expect(result).toBeDefined();
      expect(result.trades).toBeDefined();
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
    });

    it('should run moving average crossover on minute data', () => {
      const minuteData = generateMinuteData(1000);
      
      const result = runMovingAverageCrossoverStrategy('AAPL', minuteData, {
        fastWindow: 5,
        slowWindow: 15,
        maType: 'SMA',
        initialCapital: 10000,
        sharesPerTrade: 10
      });

      expect(result).toBeDefined();
      expect(result.trades).toBeDefined();
      expect(result.finalPortfolioValue).toBeGreaterThan(0);
    });

    it('should generate more trades with minute data than daily data', () => {
      const minuteData = generateMinuteData(1000);
      const dailyData = minuteData.filter((_, index) => index % 390 === 0); // Simulate daily data
      
      const minuteResult = runMeanReversionStrategy('AAPL', minuteData, {
        window: 10,
        threshold: 0.01,
        initialCapital: 10000,
        sharesPerTrade: 10
      });

      const dailyResult = runMeanReversionStrategy('AAPL', dailyData, {
        window: 10,
        threshold: 0.01,
        initialCapital: 10000,
        sharesPerTrade: 10
      });

      expect(minuteResult.trades.length).toBeGreaterThan(dailyResult.trades.length);
    });
  });

  describe('Polygon provider integration', () => {
    it('should fetch minute data from Polygon API', async () => {
      const mockResponse = {
        results: [
          {
            t: 1703000000000,
            c: 150.25,
            o: 149.50,
            h: 151.00,
            l: 149.00,
            v: 1000
          },
          {
            t: 1703000060000,
            c: 150.75,
            o: 150.25,
            h: 151.25,
            l: 150.00,
            v: 1200
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
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        timestamp: 1703000000000,
        date: '2023-12-20T00:00:00.000Z',
        close: 150.25,
        open: 149.50,
        high: 151.00,
        low: 149.00,
        volume: 1000
      });
    });

    it('should fetch technical indicators for strategy signals', async () => {
      const mockResponse = {
        status: 'OK',
        results: {
          values: [
            { value: 150.25, timestamp: 1703000000 },
            { value: 150.50, timestamp: 1703000060 }
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
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        value: 150.25,
        timestamp: 1703000000
      });
    });
  });

  describe('Performance with high-frequency data', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = generateMinuteData(10000); // 10,000 minutes
      
      const startTime = Date.now();
      const result = runMeanReversionStrategy('AAPL', largeDataset, {
        window: 20,
        threshold: 0.02,
        initialCapital: 100000,
        sharesPerTrade: 100
      });
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.trades).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain accuracy with high-frequency data', () => {
      const minuteData = generateMinuteData(2000);
      
      const result = runMeanReversionStrategy('AAPL', minuteData, {
        window: 10,
        threshold: 0.01,
        initialCapital: 10000,
        sharesPerTrade: 10
      });

      // Should have reasonable number of trades
      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.trades.length).toBeLessThan(minuteData.length / 10); // Not too many trades
      
      // Should have reasonable performance metrics
      expect(result.totalReturn).toBeGreaterThan(-1); // Not 100% loss
      expect(result.totalReturn).toBeLessThan(10); // Not 1000% gain (unrealistic)
      expect(result.winRate).toBeGreaterThanOrEqual(0);
      expect(result.winRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Strategy parameter sensitivity', () => {
    it('should show different results with different thresholds', () => {
      const minuteData = generateMinuteData(1000);
      
      const conservativeResult = runMeanReversionStrategy('AAPL', minuteData, {
        window: 10,
        threshold: 0.05, // Higher threshold
        initialCapital: 10000,
        sharesPerTrade: 10
      });

      const aggressiveResult = runMeanReversionStrategy('AAPL', minuteData, {
        window: 10,
        threshold: 0.01, // Lower threshold
        initialCapital: 10000,
        sharesPerTrade: 10
      });

      // Aggressive strategy should have more trades
      expect(aggressiveResult.trades.length).toBeGreaterThan(conservativeResult.trades.length);
    });

    it('should show different results with different window sizes', () => {
      const minuteData = generateMinuteData(1000);
      
      const shortWindowResult = runMeanReversionStrategy('AAPL', minuteData, {
        window: 5,
        threshold: 0.02,
        initialCapital: 10000,
        sharesPerTrade: 10
      });

      const longWindowResult = runMeanReversionStrategy('AAPL', minuteData, {
        window: 20,
        threshold: 0.02,
        initialCapital: 10000,
        sharesPerTrade: 10
      });

      // Different window sizes should produce different results
      expect(shortWindowResult.trades.length).not.toBe(longWindowResult.trades.length);
    });
  });
});
