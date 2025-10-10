import { Request, Response } from 'express';
import { getAvailableStrategies } from '../controllers/tradingController';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Trading Strategies API', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    mockRequest = {};

    jest.clearAllMocks();
  });

  describe('GET /api/trading/strategies', () => {
    it('should return success response with correct structure', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          strategies: expect.any(Array)
        }
      });
    });

    it('should include all expected strategies', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      const payload = mockJson.mock.calls[0][0];
      const strategies = payload.data.strategies;
      
      const expectedStrategyNames = [
        'meanReversion',
        'movingAverageCrossover', 
        'momentum',
        'bollingerBands',
        'breakout',
        'sentimentAnalysis'
      ];

      expectedStrategyNames.forEach(name => {
        const strategy = strategies.find((s: any) => s.name === name);
        expect(strategy).toBeDefined();
      });
    });

    it('should include display names for all strategies', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      const payload = mockJson.mock.calls[0][0];
      const strategies = payload.data.strategies;
      
      const expectedDisplayNames = {
        'meanReversion': 'Mean Reversion',
        'movingAverageCrossover': 'Moving Average Crossover',
        'momentum': 'Momentum',
        'bollingerBands': 'Bollinger Bands',
        'breakout': 'Breakout',
        'sentimentAnalysis': 'Sentiment Analysis'
      };

      Object.entries(expectedDisplayNames).forEach(([name, displayName]) => {
        const strategy = strategies.find((s: any) => s.name === name);
        expect(strategy.displayName).toBe(displayName);
      });
    });

    it('should include descriptions and categories for all strategies', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      const payload = mockJson.mock.calls[0][0];
      const strategies = payload.data.strategies;

      strategies.forEach((strategy: any) => {
        expect(strategy).toHaveProperty('description');
        expect(strategy).toHaveProperty('category');
        expect(typeof strategy.description).toBe('string');
        expect(typeof strategy.category).toBe('string');
        expect(strategy.description.length).toBeGreaterThan(0);
        expect(strategy.category.length).toBeGreaterThan(0);
      });
    });

    it('should include parameters with correct structure', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      const payload = mockJson.mock.calls[0][0];
      const strategies = payload.data.strategies;

      strategies.forEach((strategy: any) => {
        expect(strategy).toHaveProperty('parameters');
        expect(typeof strategy.parameters).toBe('object');
        
        Object.values(strategy.parameters).forEach((param: any) => {
          expect(param).toHaveProperty('type');
          expect(param).toHaveProperty('description');
          expect(param).toHaveProperty('default');
          expect(['number', 'select', 'boolean']).toContain(param.type);
          expect(typeof param.description).toBe('string');
        });
      });
    });

    it('should include min/max limits for number parameters', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      const payload = mockJson.mock.calls[0][0];
      const meanReversion = payload.data.strategies.find((s: any) => s.name === 'meanReversion');
      
      // Check window parameter
      expect(meanReversion.parameters.window).toHaveProperty('min', 5);
      expect(meanReversion.parameters.window).toHaveProperty('max', 200);
      
      // Check threshold parameter
      expect(meanReversion.parameters.threshold).toHaveProperty('min', 0.01);
      expect(meanReversion.parameters.threshold).toHaveProperty('max', 0.2);
      expect(meanReversion.parameters.threshold).toHaveProperty('step', 0.01);
    });

    it('should include options for select parameters', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      const payload = mockJson.mock.calls[0][0];
      const maCrossover = payload.data.strategies.find((s: any) => s.name === 'movingAverageCrossover');
      
      expect(maCrossover.parameters.maType).toHaveProperty('options');
      expect(maCrossover.parameters.maType.options).toEqual(['SMA', 'EMA']);
    });

    it('should include trading-specific parameters', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      const payload = mockJson.mock.calls[0][0];
      const strategies = payload.data.strategies;

      strategies.forEach((strategy: any) => {
        expect(strategy.parameters).toHaveProperty('initialCapital');
        expect(strategy.parameters).toHaveProperty('sharesPerTrade');
        
        expect(strategy.parameters.initialCapital).toHaveProperty('type', 'number');
        expect(strategy.parameters.initialCapital).toHaveProperty('default', 10000);
        expect(strategy.parameters.initialCapital).toHaveProperty('min', 1000);
        
        expect(strategy.parameters.sharesPerTrade).toHaveProperty('type', 'number');
        expect(strategy.parameters.sharesPerTrade).toHaveProperty('default', 100);
        expect(strategy.parameters.sharesPerTrade).toHaveProperty('min', 1);
      });
    });

    it('should handle errors gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock StrategiesService to throw an error
      const mockStrategiesService = {
        getStrategiesForBacktest: jest.fn().mockImplementation(() => {
          throw new Error('Service error');
        })
      };
      
      // Temporarily replace the service
      const originalService = require('../services/strategiesService').StrategiesService;
      require('../services/strategiesService').StrategiesService = mockStrategiesService;

      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });

      // Restore original service
      require('../services/strategiesService').StrategiesService = originalService;
      consoleSpy.mockRestore();
    });
  });

  describe('Strategy-specific parameter validation', () => {
    it('should have correct parameters for mean reversion strategy', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      const payload = mockJson.mock.calls[0][0];
      const meanReversion = payload.data.strategies.find((s: any) => s.name === 'meanReversion');
      
      expect(meanReversion.parameters).toHaveProperty('window');
      expect(meanReversion.parameters).toHaveProperty('threshold');
      expect(meanReversion.parameters.window.type).toBe('number');
      expect(meanReversion.parameters.threshold.type).toBe('number');
    });

    it('should have correct parameters for moving average crossover strategy', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      const payload = mockJson.mock.calls[0][0];
      const maCrossover = payload.data.strategies.find((s: any) => s.name === 'movingAverageCrossover');
      
      expect(maCrossover.parameters).toHaveProperty('fastWindow');
      expect(maCrossover.parameters).toHaveProperty('slowWindow');
      expect(maCrossover.parameters).toHaveProperty('maType');
      expect(maCrossover.parameters.fastWindow.type).toBe('number');
      expect(maCrossover.parameters.slowWindow.type).toBe('number');
      expect(maCrossover.parameters.maType.type).toBe('select');
    });

    it('should have correct parameters for sentiment analysis strategy', async () => {
      await getAvailableStrategies(mockRequest as Request, mockResponse as Response);

      const payload = mockJson.mock.calls[0][0];
      const sentiment = payload.data.strategies.find((s: any) => s.name === 'sentimentAnalysis');
      
      expect(sentiment.parameters).toHaveProperty('lookbackDays');
      expect(sentiment.parameters).toHaveProperty('buyThreshold');
      expect(sentiment.parameters).toHaveProperty('sellThreshold');
      expect(sentiment.parameters).toHaveProperty('minArticles');
      expect(sentiment.parameters.lookbackDays.type).toBe('number');
      expect(sentiment.parameters.buyThreshold.type).toBe('number');
      expect(sentiment.parameters.sellThreshold.type).toBe('number');
    });
  });
});
