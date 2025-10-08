import { TradingBot } from '../../bot/TradingBot';
import { PolygonProvider } from '../../dataProviders/PolygonProvider';

// Mock fetch and WebSocket
global.fetch = jest.fn();
global.WebSocket = jest.fn() as any;

describe('Polygon TradingBot Integration', () => {
  let bot: TradingBot;
  let provider: PolygonProvider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    provider = new PolygonProvider(mockApiKey);
    
    const config = {
      mode: 'PAPER',
      initialCash: 10000,
      symbols: ['AAPL'],
      strategies: [
        {
          name: 'MeanReversion',
          enabled: true,
          symbols: ['AAPL'],
          parameters: {
            window: 10,
            threshold: 0.02
          }
        }
      ],
      riskManagement: {
        maxPositionSize: 0.1,
        stopLoss: 0.05,
        takeProfit: 0.1
      }
    };

    bot = new TradingBot(config, provider, 1);
    
    // Mock portfolio properly
    (bot as any).portfolio = {
      buy: jest.fn(),
      sell: jest.fn(),
      status: jest.fn().mockReturnValue({
        totalValue: 10000,
        cash: 10000,
        positions: {}
      })
    };
    
    jest.clearAllMocks();
  });

  describe('PAPER mode polling integration', () => {
    it('should use polling data feed in PAPER mode', async () => {
      const mockQuote = {
        symbol: 'AAPL',
        price: 150.25,
        timestamp: Date.now()
      };

      (provider.getQuote as jest.Mock).mockResolvedValue(mockQuote);

      // Mock database operations
      const mockDatabase = require('../../database/tradingSchema');
      mockDatabase.TradingDatabase.initializeTables = jest.fn().mockResolvedValue(undefined);
      mockDatabase.TradingDatabase.createTradingSession = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        start_time: new Date().toISOString(),
        mode: 'PAPER',
        initial_cash: 10000,
        total_trades: 0,
        winning_trades: 0,
        status: 'ACTIVE'
      });

      await bot.start();

      // Wait for polling to occur
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(provider.getQuote).toHaveBeenCalledWith('AAPL');
    });

    it('should handle polling errors gracefully', async () => {
      (provider.getQuote as jest.Mock).mockRejectedValue(new Error('API Error'));

      const mockDatabase = require('../../database/tradingSchema');
      mockDatabase.TradingDatabase.initializeTables = jest.fn().mockResolvedValue(undefined);
      mockDatabase.TradingDatabase.createTradingSession = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        start_time: new Date().toISOString(),
        mode: 'PAPER',
        initial_cash: 10000,
        total_trades: 0,
        winning_trades: 0,
        status: 'ACTIVE'
      });

      const errorListener = jest.fn();
      bot.on('error', errorListener);

      await bot.start();

      // Wait for polling to occur and error to be handled
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorListener).toHaveBeenCalled();
    });
  });

  describe('WebSocket fallback integration', () => {
    it('should fallback to polling when WebSocket fails in PAPER mode', async () => {
      const mockQuote = {
        symbol: 'AAPL',
        price: 150.25,
        timestamp: Date.now()
      };

      (provider.getQuote as jest.Mock).mockResolvedValue(mockQuote);
      (provider.connectStream as jest.Mock).mockRejectedValue(new Error('WebSocket failed'));

      const mockDatabase = require('../../database/tradingSchema');
      mockDatabase.TradingDatabase.initializeTables = jest.fn().mockResolvedValue(undefined);
      mockDatabase.TradingDatabase.createTradingSession = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        start_time: new Date().toISOString(),
        mode: 'PAPER',
        initial_cash: 10000,
        total_trades: 0,
        winning_trades: 0,
        status: 'ACTIVE'
      });

      await bot.start();

      // Wait for fallback to occur
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(provider.connectStream).toHaveBeenCalled();
      expect(provider.getQuote).toHaveBeenCalledWith('AAPL');
    });
  });

  describe('Market data processing integration', () => {
    beforeEach(async () => {
      const mockDatabase = require('../../database/tradingSchema');
      mockDatabase.TradingDatabase.initializeTables = jest.fn().mockResolvedValue(undefined);
      mockDatabase.TradingDatabase.createTradingSession = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        start_time: new Date().toISOString(),
        mode: 'PAPER',
        initial_cash: 10000,
        total_trades: 0,
        winning_trades: 0,
        status: 'ACTIVE'
      });

      await bot.start();
    });

    it('should process market data and generate signals', async () => {
      const mockTradeData = [{
        ev: 'T',
        sym: 'AAPL',
        p: 150.25,
        s: 100,
        t: Date.now()
      }];

      // Mock strategy to return a signal
      const mockStrategy = {
        addPrice: jest.fn(),
        getSignal: jest.fn().mockReturnValue('BUY'),
        getStrategyName: jest.fn().mockReturnValue('MeanReversion')
      };
      (bot as any).strategies.set('AAPL', mockStrategy);

      // Mock risk management
      jest.spyOn(bot as any, 'shouldExecuteTrade').mockReturnValue({ allowed: true });
      jest.spyOn(bot as any, 'executeTrade').mockResolvedValue(undefined);

      await (bot as any).processMarketData(mockTradeData);

      expect(mockStrategy.addPrice).toHaveBeenCalledWith(150.25);
      expect(mockStrategy.getSignal).toHaveBeenCalled();
    });

    it('should handle portfolio updates correctly', async () => {
      const mockTradeData = [{
        ev: 'T',
        sym: 'AAPL',
        p: 150.25,
        s: 100,
        t: Date.now()
      }];

      const mockStrategy = {
        addPrice: jest.fn(),
        getSignal: jest.fn().mockReturnValue(null),
        getStrategyName: jest.fn().mockReturnValue('MeanReversion')
      };
      (bot as any).strategies.set('AAPL', mockStrategy);

      // Mock portfolio status
      (bot as any).portfolio = {
        status: jest.fn().mockReturnValue({
          totalValue: 10000,
          cash: 10000,
          positions: {}
        })
      };

      await (bot as any).processMarketData(mockTradeData);

      expect((bot as any).latestPrices.AAPL).toBe(150.25);
    });
  });

  describe('Trade execution integration', () => {
    beforeEach(async () => {
      const mockDatabase = require('../../database/tradingSchema');
      mockDatabase.TradingDatabase.initializeTables = jest.fn().mockResolvedValue(undefined);
      mockDatabase.TradingDatabase.createTradingSession = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        start_time: new Date().toISOString(),
        mode: 'PAPER',
        initial_cash: 10000,
        total_trades: 0,
        winning_trades: 0,
        status: 'ACTIVE'
      });

      await bot.start();
    });

    it('should execute trades and save to database', async () => {
      const mockDatabase = require('../../database/tradingSchema');
      const mockSavedTrade = {
        id: 1,
        user_id: 1,
        symbol: 'AAPL',
        action: 'BUY',
        quantity: 1,
        price: 150.25,
        timestamp: new Date().toISOString(),
        strategy: 'MeanReversion',
        mode: 'PAPER'
      };
      mockDatabase.TradingDatabase.saveTrade = jest.fn().mockResolvedValue(mockSavedTrade);

      // Mock portfolio
      (bot as any).portfolio = {
        buy: jest.fn(),
        status: jest.fn().mockReturnValue({
          totalValue: 10000,
          cash: 10000,
          positions: {}
        })
      };

      // Mock strategy
      (bot as any).strategies = new Map([
        ['AAPL', {
          getStrategyName: jest.fn().mockReturnValue('MeanReversion')
        }]
      ]);

      (bot as any).latestPrices = { AAPL: 150.25 };

      const tradeListener = jest.fn();
      bot.on('trade', tradeListener);

      await (bot as any).executeTrade('AAPL', 150.25, 'BUY');

      expect((bot as any).portfolio.buy).toHaveBeenCalledWith('AAPL', 150.25, 1);
      expect(mockDatabase.TradingDatabase.saveTrade).toHaveBeenCalled();
      expect(tradeListener).toHaveBeenCalledWith(mockSavedTrade);
    });

    it('should handle trade execution errors', async () => {
      const mockDatabase = require('../../database/tradingSchema');
      mockDatabase.TradingDatabase.saveTrade = jest.fn().mockRejectedValue(new Error('DB Error'));

      (bot as any).portfolio = {
        buy: jest.fn(),
        status: jest.fn().mockReturnValue({
          totalValue: 10000,
          cash: 10000,
          positions: {}
        })
      };

      (bot as any).strategies = new Map([
        ['AAPL', {
          getStrategyName: jest.fn().mockReturnValue('MeanReversion')
        }]
      ]);

      (bot as any).latestPrices = { AAPL: 150.25 };

      const errorListener = jest.fn();
      bot.on('error', errorListener);

      await (bot as any).executeTrade('AAPL', 150.25, 'BUY');

      expect(errorListener).toHaveBeenCalled();
    });
  });

  describe('End-to-end trading simulation', () => {
    it('should complete a full trading cycle', async () => {
      const mockQuote = {
        symbol: 'AAPL',
        price: 150.25,
        timestamp: Date.now()
      };

      (provider.getQuote as jest.Mock).mockResolvedValue(mockQuote);

      const mockDatabase = require('../../database/tradingSchema');
      mockDatabase.TradingDatabase.initializeTables = jest.fn().mockResolvedValue(undefined);
      mockDatabase.TradingDatabase.createTradingSession = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        start_time: new Date().toISOString(),
        mode: 'PAPER',
        initial_cash: 10000,
        total_trades: 0,
        winning_trades: 0,
        status: 'ACTIVE'
      });
      mockDatabase.TradingDatabase.saveTrade = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        symbol: 'AAPL',
        action: 'BUY',
        quantity: 1,
        price: 150.25,
        timestamp: new Date().toISOString(),
        strategy: 'MeanReversion',
        mode: 'PAPER'
      });

      const tradeListener = jest.fn();
      bot.on('trade', tradeListener);

      await bot.start();

      // Simulate a trade signal
      const mockStrategy = {
        addPrice: jest.fn(),
        getSignal: jest.fn().mockReturnValue('BUY'),
        getStrategyName: jest.fn().mockReturnValue('MeanReversion')
      };
      (bot as any).strategies.set('AAPL', mockStrategy);

      jest.spyOn(bot as any, 'shouldExecuteTrade').mockReturnValue({ allowed: true });

      // Process market data to trigger trade
      await (bot as any).processMarketData([{
        ev: 'T',
        sym: 'AAPL',
        p: 150.25,
        s: 100,
        t: Date.now()
      }]);

      await bot.stop();

      expect(tradeListener).toHaveBeenCalled();
      expect(bot.getStatus().isRunning).toBe(false);
    });
  });
});
