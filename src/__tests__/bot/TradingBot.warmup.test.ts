import { TradingBot } from '../../bot/TradingBot';
import { TradingConfig } from '../../config/tradingConfig';
import { DataProvider } from '../../dataProviders/baseProvider';
import { Portfolio } from '../../portfolio';

// Mock dependencies
jest.mock('../../database/tradingSchema');
jest.mock('../../portfolio');

describe('TradingBot - Warmup Functionality', () => {
  let mockDataProvider: jest.Mocked<DataProvider>;
  let mockConfig: TradingConfig;
  let tradingBot: TradingBot;

  beforeEach(() => {
    // Create mock data provider
    mockDataProvider = {
      getQuote: jest.fn(),
      getHistorical: jest.fn(),
      getNews: jest.fn(),
      connectStream: jest.fn()
    } as jest.Mocked<DataProvider>;

    // Create test configuration
    mockConfig = {
      mode: 'PAPER',
      initialCash: 10000,
      symbols: ['AAPL', 'SPY'],
      strategies: [
        {
          name: 'MovingAverage',
          enabled: true,
          parameters: { shortWindow: 5, longWindow: 30 },
          symbols: ['AAPL', 'SPY']
        },
        {
          name: 'Breakout',
          enabled: true,
          parameters: { lookbackWindow: 20, breakoutThreshold: 0.01, minVolumeRatio: 1.5, confirmationPeriod: 2 },
          symbols: ['AAPL']
        }
      ],
      dataProvider: {
        type: 'polygon',
        rateLimit: 1000
      },
      riskManagement: {
        maxPositionSize: 0.2,
        stopLoss: 0.05,
        takeProfit: 0.15,
        maxDailyLoss: 0.1,
        maxDrawdown: 0.2
      },
      logging: {
        level: 'info',
        saveToDatabase: true,
        consoleOutput: true,
        logTrades: true,
        logPortfolioSnapshots: true
      },
      warmup: {
        enabled: true,
        maxLookbackDays: 200,
        bufferDays: 10,
        skipWeekends: true,
        dataInterval: 'day',
        failOnWarmupError: false
      }
    };

    tradingBot = new TradingBot(mockConfig, mockDataProvider, 1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('areStrategiesReady', () => {
    it('should return false when warmup is disabled', () => {
      const configWithoutWarmup = {
        ...mockConfig,
        warmup: { 
          enabled: false,
          maxLookbackDays: 200,
          bufferDays: 10,
          skipWeekends: true,
          dataInterval: 'day' as const,
          failOnWarmupError: false
        }
      };
      const botWithoutWarmup = new TradingBot(configWithoutWarmup, mockDataProvider, 1);
      
      expect(botWithoutWarmup.areStrategiesReady()).toBe(false);
    });

    it('should return true when warmup is enabled and strategies are initialized', () => {
      expect(tradingBot.areStrategiesReady()).toBe(true);
    });
  });

  describe('getWarmupStatus', () => {
    it('should return correct warmup status', () => {
      const status = tradingBot.getWarmupStatus();
      
      expect(status).toEqual({
        enabled: true,
        maxLookbackDays: 200,
        bufferDays: 10,
        strategiesReady: true,
        symbolsWarmedUp: ['AAPL', 'SPY']
      });
    });

    it('should return correct status when warmup is disabled', () => {
      const configWithoutWarmup = {
        ...mockConfig,
        warmup: { 
          enabled: false,
          maxLookbackDays: 200,
          bufferDays: 10,
          skipWeekends: true,
          dataInterval: 'day' as const,
          failOnWarmupError: false
        }
      };
      const botWithoutWarmup = new TradingBot(configWithoutWarmup, mockDataProvider, 1);
      
      const status = botWithoutWarmup.getWarmupStatus();
      
      expect(status.enabled).toBe(false);
      expect(status.strategiesReady).toBe(false);
    });
  });

  describe('warmupStrategies (private method)', () => {
    it('should fetch historical data for all symbols', async () => {
      // Mock historical data
      const mockHistoricalData = [
        { date: '2023-01-01', close: 100, open: 99 },
        { date: '2023-01-02', close: 102, open: 100 },
        { date: '2023-01-03', close: 98, open: 102 },
        { date: '2023-01-04', close: 105, open: 98 },
        { date: '2023-01-05', close: 103, open: 105 }
      ];

      mockDataProvider.getHistorical.mockResolvedValue(mockHistoricalData);

      // Access private method through type assertion
      const warmupStrategies = (tradingBot as any).warmupStrategies.bind(tradingBot);
      
      await warmupStrategies();

      // Should fetch data for both symbols
      expect(mockDataProvider.getHistorical).toHaveBeenCalledTimes(2);
      expect(mockDataProvider.getHistorical).toHaveBeenCalledWith(
        'AAPL',
        'day',
        expect.any(String),
        expect.any(String)
      );
      expect(mockDataProvider.getHistorical).toHaveBeenCalledWith(
        'SPY',
        'day',
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle missing historical data gracefully', async () => {
      mockDataProvider.getHistorical.mockResolvedValue([]);

      const warmupStrategies = (tradingBot as any).warmupStrategies.bind(tradingBot);
      
      // Should not throw error
      await expect(warmupStrategies()).resolves.not.toThrow();
    });

    it('should handle data provider errors gracefully', async () => {
      mockDataProvider.getHistorical.mockRejectedValue(new Error('API Error'));

      const warmupStrategies = (tradingBot as any).warmupStrategies.bind(tradingBot);
      
      // Should not throw error when failOnWarmupError is false
      await expect(warmupStrategies()).resolves.not.toThrow();
    });

    it('should throw error when failOnWarmupError is true', async () => {
      const configWithFailOnError = {
        ...mockConfig,
        warmup: {
          ...mockConfig.warmup!,
          failOnWarmupError: true
        }
      };
      const botWithFailOnError = new TradingBot(configWithFailOnError, mockDataProvider, 1);
      
      mockDataProvider.getHistorical.mockRejectedValue(new Error('API Error'));

      const warmupStrategies = (botWithFailOnError as any).warmupStrategies.bind(botWithFailOnError);
      
      // Should throw error when failOnWarmupError is true
      await expect(warmupStrategies()).rejects.toThrow('API Error');
    });

    it('should calculate correct date range for warmup', async () => {
      const mockHistoricalData = [
        { date: '2023-01-01', close: 100, open: 99 }
      ];
      mockDataProvider.getHistorical.mockResolvedValue(mockHistoricalData);

      const warmupStrategies = (tradingBot as any).warmupStrategies.bind(tradingBot);
      
      await warmupStrategies();

      // Check that the date range is calculated correctly
      const calls = mockDataProvider.getHistorical.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      const [symbol, interval, startDate, endDate] = calls[0];
      expect(symbol).toBe('AAPL');
      expect(interval).toBe('day');
      
      // Start date should be in the past
      const start = new Date(startDate);
      const end = new Date(endDate);
      expect(start.getTime()).toBeLessThan(end.getTime());
      expect(start.getTime()).toBeLessThan(Date.now());
    });

    it('should adjust date range when skipWeekends is enabled', async () => {
      const configWithWeekends = {
        ...mockConfig,
        warmup: {
          ...mockConfig.warmup!,
          skipWeekends: true
        }
      };
      const botWithWeekends = new TradingBot(configWithWeekends, mockDataProvider, 1);
      
      const mockHistoricalData = [
        { date: '2023-01-01', close: 100, open: 99 }
      ];
      mockDataProvider.getHistorical.mockResolvedValue(mockHistoricalData);

      const warmupStrategies = (botWithWeekends as any).warmupStrategies.bind(botWithWeekends);
      
      await warmupStrategies();

      // Should still call getHistorical with adjusted date range
      expect(mockDataProvider.getHistorical).toHaveBeenCalled();
    });
  });

  describe('start method with warmup', () => {
    it('should call warmupStrategies when warmup is enabled', async () => {
      // Mock the warmupStrategies method
      const warmupStrategiesSpy = jest.spyOn(tradingBot as any, 'warmupStrategies').mockResolvedValue(undefined);
      
      // Mock other required methods
      jest.spyOn(tradingBot as any, 'fetchInitialQuotes').mockResolvedValue(undefined);
      jest.spyOn(tradingBot as any, 'startDataStream').mockResolvedValue(undefined);
      
      // Mock database initialization
      const mockTradingDatabase = require('../../database/tradingSchema');
      mockTradingDatabase.TradingDatabase.initializeTables = jest.fn().mockResolvedValue(undefined);
      mockTradingDatabase.TradingDatabase.createTradingSession = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        start_time: new Date().toISOString(),
        mode: 'PAPER',
        initial_cash: 10000,
        total_trades: 0,
        winning_trades: 0,
        status: 'ACTIVE'
      });

      await tradingBot.start();

      expect(warmupStrategiesSpy).toHaveBeenCalled();
    });

    it('should not call warmupStrategies when warmup is disabled', async () => {
      const configWithoutWarmup = {
        ...mockConfig,
        warmup: { 
          enabled: false,
          maxLookbackDays: 200,
          bufferDays: 10,
          skipWeekends: true,
          dataInterval: 'day' as const,
          failOnWarmupError: false
        }
      };
      const botWithoutWarmup = new TradingBot(configWithoutWarmup, mockDataProvider, 1);
      
      const warmupStrategiesSpy = jest.spyOn(botWithoutWarmup as any, 'warmupStrategies').mockResolvedValue(undefined);
      
      // Mock other required methods
      jest.spyOn(botWithoutWarmup as any, 'fetchInitialQuotes').mockResolvedValue(undefined);
      jest.spyOn(botWithoutWarmup as any, 'startDataStream').mockResolvedValue(undefined);
      
      // Mock database initialization
      const mockTradingDatabase = require('../../database/tradingSchema');
      mockTradingDatabase.TradingDatabase.initializeTables = jest.fn().mockResolvedValue(undefined);
      mockTradingDatabase.TradingDatabase.createTradingSession = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        start_time: new Date().toISOString(),
        mode: 'PAPER',
        initial_cash: 10000,
        total_trades: 0,
        winning_trades: 0,
        status: 'ACTIVE'
      });

      await botWithoutWarmup.start();

      expect(warmupStrategiesSpy).not.toHaveBeenCalled();
    });
  });

  describe('Configuration edge cases', () => {
    it('should handle configuration with no warmup settings', () => {
      const configWithoutWarmup = {
        ...mockConfig
      };
      delete (configWithoutWarmup as any).warmup;
      
      const botWithoutWarmup = new TradingBot(configWithoutWarmup, mockDataProvider, 1);
      
      const status = botWithoutWarmup.getWarmupStatus();
      expect(status.enabled).toBe(true); // Should use default
    });

    it('should handle configuration with partial warmup settings', () => {
      const configWithPartialWarmup = {
        ...mockConfig,
        warmup: {
          enabled: true,
          maxLookbackDays: 100,
          bufferDays: 10,
          skipWeekends: true,
          dataInterval: 'day' as const,
          failOnWarmupError: false
        }
      };
      
      const botWithPartialWarmup = new TradingBot(configWithPartialWarmup, mockDataProvider, 1);
      
      const status = botWithPartialWarmup.getWarmupStatus();
      expect(status.enabled).toBe(true);
      expect(status.maxLookbackDays).toBe(100);
      expect(status.bufferDays).toBe(10); // Default
    });
  });
});
