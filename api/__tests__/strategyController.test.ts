import { Request, Response } from 'express';
import {
  createStrategy,
  getPublicStrategies,
  getPublicStrategiesByType,
  copyPublicStrategy
} from '../controllers/strategyController';
import { Strategy } from '../models/Strategy';

// Mock the Strategy model
jest.mock('../models/Strategy');
const MockStrategy = Strategy as jest.Mocked<typeof Strategy>;

describe('Strategy Controller', () => {
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

    jest.clearAllMocks();
  });

  describe('createStrategy', () => {
    it('should create a strategy with is_public field', async () => {
      mockRequest = {
        params: { userId: '1' },
        body: {
          name: 'Test Strategy',
          description: 'Test description',
          strategy_type: 'moving_average_crossover',
          config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
          is_public: true
        }
      };

      const mockCreatedStrategy = {
        id: 1,
        user_id: 1,
        name: 'Test Strategy',
        description: 'Test description',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        is_public: true,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      MockStrategy.findByName.mockResolvedValue(null);
      MockStrategy.create.mockResolvedValue(mockCreatedStrategy);
      MockStrategy.parseStrategyData.mockReturnValue(mockCreatedStrategy);

      await createStrategy(mockRequest as Request, mockResponse as Response);

      expect(MockStrategy.create).toHaveBeenCalledWith({
        user_id: 1,
        name: 'Test Strategy',
        description: 'Test description',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        backtest_results: undefined,
        is_public: true
      });

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Strategy created successfully',
        strategy: mockCreatedStrategy
      });
    });

    it('should create a strategy with is_public defaulting to false', async () => {
      mockRequest = {
        params: { userId: '1' },
        body: {
          name: 'Test Strategy',
          description: 'Test description',
          strategy_type: 'moving_average_crossover',
          config: JSON.stringify({ fastWindow: 10, slowWindow: 30 })
        }
      };

      const mockCreatedStrategy = {
        id: 1,
        user_id: 1,
        name: 'Test Strategy',
        description: 'Test description',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        is_public: false,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      MockStrategy.findByName.mockResolvedValue(null);
      MockStrategy.create.mockResolvedValue(mockCreatedStrategy);
      MockStrategy.parseStrategyData.mockReturnValue(mockCreatedStrategy);

      await createStrategy(mockRequest as Request, mockResponse as Response);

      expect(MockStrategy.create).toHaveBeenCalledWith({
        user_id: 1,
        name: 'Test Strategy',
        description: 'Test description',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        backtest_results: undefined,
        is_public: false
      });
    });
  });

  describe('getPublicStrategies', () => {
    it('should return all public strategies', async () => {
      const mockPublicStrategies = [
        {
          id: 1,
          user_id: 1,
          name: 'Public Strategy 1',
          strategy_type: 'moving_average_crossover',
          config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
          is_public: true,
          is_active: true,
          created_at: '2023-01-01'
        },
        {
          id: 2,
          user_id: 2,
          name: 'Public Strategy 2',
          strategy_type: 'bollinger_bands',
          config: JSON.stringify({ period: 20, stdDev: 2 }),
          is_public: true,
          is_active: true,
          created_at: '2023-01-02'
        }
      ];

      MockStrategy.findPublicStrategies.mockResolvedValue(mockPublicStrategies);
      MockStrategy.parseStrategyData.mockImplementation((strategy) => strategy);

      await getPublicStrategies(mockRequest as Request, mockResponse as Response);

      expect(MockStrategy.findPublicStrategies).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        strategies: mockPublicStrategies,
        count: 2
      });
    });

    it('should handle errors when getting public strategies', async () => {
      MockStrategy.findPublicStrategies.mockRejectedValue(new Error('Database error'));

      await getPublicStrategies(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
    });
  });

  describe('getPublicStrategiesByType', () => {
    it('should return public strategies by type', async () => {
      mockRequest = {
        params: { strategyType: 'moving_average_crossover' }
      };

      const mockStrategies = [
        {
          id: 1,
          user_id: 1,
          name: 'Moving Average Strategy',
          strategy_type: 'moving_average_crossover',
          config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
          is_public: true,
          is_active: true,
          created_at: '2023-01-01'
        }
      ];

      MockStrategy.findPublicStrategiesByType.mockResolvedValue(mockStrategies);
      MockStrategy.parseStrategyData.mockImplementation((strategy) => strategy);

      await getPublicStrategiesByType(mockRequest as Request, mockResponse as Response);

      expect(MockStrategy.findPublicStrategiesByType).toHaveBeenCalledWith('moving_average_crossover');
      expect(mockJson).toHaveBeenCalledWith({
        strategies: mockStrategies,
        count: 1
      });
    });

    it('should return error when strategy type is missing', async () => {
      mockRequest = {
        params: {}
      };

      await getPublicStrategiesByType(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Strategy type is required'
      });
    });
  });

  describe('copyPublicStrategy', () => {
    it('should copy a public strategy to user collection', async () => {
      mockRequest = {
        params: { userId: '1' },
        body: {
          strategyId: 123,
          customName: 'My Copy'
        }
      };

      const mockPublicStrategy = {
        id: 123,
        user_id: 2,
        name: 'Original Public Strategy',
        description: 'Original description',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        backtest_results: JSON.stringify({ totalReturn: 0.15 }),
        is_public: true,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      const mockCopiedStrategy = {
        id: 124,
        user_id: 1,
        name: 'My Copy',
        description: 'Copied from public strategy: Original description',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        backtest_results: JSON.stringify({ totalReturn: 0.15 }),
        is_public: false,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      MockStrategy.findById.mockResolvedValue(mockPublicStrategy);
      MockStrategy.findByName.mockResolvedValue(null);
      MockStrategy.create.mockResolvedValue(mockCopiedStrategy);
      MockStrategy.parseStrategyData.mockReturnValue(mockCopiedStrategy);

      await copyPublicStrategy(mockRequest as Request, mockResponse as Response);

      expect(MockStrategy.findById).toHaveBeenCalledWith(123);
      expect(MockStrategy.findByName).toHaveBeenCalledWith(1, 'My Copy');
      expect(MockStrategy.create).toHaveBeenCalledWith({
        user_id: 1,
        name: 'My Copy',
        description: 'Copied from public strategy: Original description',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        backtest_results: JSON.stringify({ totalReturn: 0.15 }),
        is_public: false
      });

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Strategy copied successfully',
        strategy: mockCopiedStrategy
      });
    });

    it('should use default name when customName is not provided', async () => {
      mockRequest = {
        params: { userId: '1' },
        body: {
          strategyId: 123
        }
      };

      const mockPublicStrategy = {
        id: 123,
        user_id: 2,
        name: 'Original Public Strategy',
        description: 'Original description',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        is_public: true,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      MockStrategy.findById.mockResolvedValue(mockPublicStrategy);
      MockStrategy.findByName.mockResolvedValue(null);
      MockStrategy.create.mockResolvedValue({} as any);
      MockStrategy.parseStrategyData.mockReturnValue({} as any);

      await copyPublicStrategy(mockRequest as Request, mockResponse as Response);

      expect(MockStrategy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Original Public Strategy (Copy)'
        })
      );
    });

    it('should return error when public strategy is not found', async () => {
      mockRequest = {
        params: { userId: '1' },
        body: {
          strategyId: 999
        }
      };

      MockStrategy.findById.mockResolvedValue(null);

      await copyPublicStrategy(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Public strategy not found'
      });
    });

    it('should return error when trying to copy a non-public strategy', async () => {
      mockRequest = {
        params: { userId: '1' },
        body: {
          strategyId: 123
        }
      };

      const mockPrivateStrategy = {
        id: 123,
        user_id: 2,
        name: 'Private Strategy',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        is_public: false,
        is_active: true
      };

      MockStrategy.findById.mockResolvedValue(mockPrivateStrategy);

      await copyPublicStrategy(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Strategy is not public'
      });
    });

    it('should return error when user already has a strategy with the same name', async () => {
      mockRequest = {
        params: { userId: '1' },
        body: {
          strategyId: 123,
          customName: 'Existing Strategy'
        }
      };

      const mockPublicStrategy = {
        id: 123,
        user_id: 2,
        name: 'Public Strategy',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        is_public: true,
        is_active: true
      };

      const mockExistingStrategy = {
        id: 456,
        user_id: 1,
        name: 'Existing Strategy',
        strategy_type: 'moving_average_crossover',
        config: JSON.stringify({ fastWindow: 10, slowWindow: 30 }),
        is_public: false,
        is_active: true
      };

      MockStrategy.findById.mockResolvedValue(mockPublicStrategy);
      MockStrategy.findByName.mockResolvedValue(mockExistingStrategy);

      await copyPublicStrategy(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'You already have a strategy with this name. Please choose a different name.'
      });
    });
  });
});
