import { Request, Response } from 'express';
import { getUserPerformanceMetrics } from '../controllers/tradingController';

// Mock the StrategyPerformance model
jest.mock('../models/StrategyPerformance', () => ({
  StrategyPerformance: {
    findByUserId: jest.fn(),
    parsePerformanceData: jest.fn()
  }
}));

import { StrategyPerformance } from '../models/StrategyPerformance';
const MockStrategyPerformance = StrategyPerformance as jest.Mocked<typeof StrategyPerformance>;

describe('Trading Controller - getUserPerformanceMetrics', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.clearAllMocks();
  });

  it('should return performance metrics for valid user ID', async () => {
    const mockPerformances = [
      {
        id: 1,
        user_id: 1,
        strategy_name: 'MovingAverageCrossover',
        strategy_type: 'MOMENTUM',
        execution_type: 'BACKTEST' as const,
        symbols: '["AAPL", "GOOGL"]',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        initial_capital: 10000,
        final_capital: 11125,
        total_return: 0.125,
        total_return_dollar: 1125,
        max_drawdown: -0.05,
        sharpe_ratio: 1.25,
        sortino_ratio: 1.5,
        win_rate: 65.0,
        total_trades: 20,
        winning_trades: 13,
        losing_trades: 7,
        avg_win: 150,
        avg_loss: -100,
        profit_factor: 1.8,
        largest_win: 500,
        largest_loss: -300,
        avg_trade_duration: 24,
        volatility: 0.25,
        beta: 1.1,
        alpha: 0.05,
        config: '{"param1": "value1"}',
        trades_data: '[]',
        portfolio_history: '[]',
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    const mockParsedPerformances = [
      {
        id: 1,
        user_id: 1,
        strategy_name: 'MovingAverageCrossover',
        strategy_type: 'MOMENTUM',
        execution_type: 'BACKTEST' as const,
        symbols: ['AAPL', 'GOOGL'],
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        initial_capital: 10000,
        final_capital: 11125,
        total_return: 0.125,
        total_return_dollar: 1125,
        max_drawdown: -0.05,
        sharpe_ratio: 1.25,
        sortino_ratio: 1.5,
        win_rate: 65.0,
        total_trades: 20,
        winning_trades: 13,
        losing_trades: 7,
        avg_win: 150,
        avg_loss: -100,
        profit_factor: 1.8,
        largest_win: 500,
        largest_loss: -300,
        avg_trade_duration: 24,
        volatility: 0.25,
        beta: 1.1,
        alpha: 0.05,
        config: { param1: 'value1' },
        trades_data: [],
        portfolio_history: [],
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    MockStrategyPerformance.findByUserId.mockResolvedValue(mockPerformances);
    MockStrategyPerformance.parsePerformanceData.mockReturnValue(mockParsedPerformances[0] as any);

    mockRequest = {
      params: { userId: '1' },
      query: { limit: '10' }
    };

    await getUserPerformanceMetrics(mockRequest as Request, mockResponse as Response);

    expect(MockStrategyPerformance.findByUserId).toHaveBeenCalledWith(1, 10);
    expect(MockStrategyPerformance.parsePerformanceData).toHaveBeenCalledWith(mockPerformances[0]);
    expect(mockJson).toHaveBeenCalledWith(mockParsedPerformances);
  });

  it('should use default limit when not provided', async () => {
    const mockPerformances = [];
    MockStrategyPerformance.findByUserId.mockResolvedValue(mockPerformances);

    mockRequest = {
      params: { userId: '1' },
      query: {}
    };

    await getUserPerformanceMetrics(mockRequest as Request, mockResponse as Response);

    expect(MockStrategyPerformance.findByUserId).toHaveBeenCalledWith(1, 50);
  });

  it('should return 400 for invalid user ID', async () => {
    mockRequest = {
      params: { userId: 'invalid' },
      query: {}
    };

    await getUserPerformanceMetrics(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid user ID' });
  });

  it('should handle database errors', async () => {
    MockStrategyPerformance.findByUserId.mockRejectedValue(new Error('Database error'));

    mockRequest = {
      params: { userId: '1' },
      query: {}
    };

    await getUserPerformanceMetrics(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
