import { Request, Response } from 'express';
import { runBacktest } from '../controllers/backtestController';
import { CustomStrategy } from '../models/CustomStrategy';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));
jest.mock('../models/CustomStrategy');
jest.mock('../services/performanceMetricsService', () => ({
  PerformanceMetricsService: {
    convertBacktestResults: jest.fn(),
    savePerformanceMetrics: jest.fn()
  }
}));

describe('Backtest Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    
    mockReq = {
      body: {},
      user: { id: 1 }
    } as any;

    mockRes = {
      json: mockJson,
      status: mockStatus
    } as any;
  });

  describe('runBacktest - Basic Validation', () => {
    it('should reject request with missing required fields', async () => {
      mockReq.body = {
        strategy: 'meanReversion',
        // Missing symbols, startDate, endDate
      };

      await runBacktest(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Missing required fields: strategy, symbols, startDate, endDate"
      });
    });

    it('should reject invalid strategy', async () => {
      mockReq.body = {
        strategy: 'invalidStrategy',
        symbols: ['AAPL'],
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };

      await runBacktest(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Invalid strategy')
        })
      );
    });

    it('should accept valid predefined strategies', async () => {
      const validStrategies = [
        'meanReversion',
        'movingAverageCrossover',
        'momentum',
        'bollingerBands',
        'breakout',
        'sentimentAnalysis'
      ];

      for (const strategy of validStrategies) {
        mockReq.body = {
          strategy,
          symbols: ['AAPL'],
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        };

        // Mock the spawn process to avoid actual execution
        const { spawn } = require('child_process');
        const mockChild = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn((event, callback) => {
            if (event === 'close') {
              setTimeout(() => callback(1), 10); // Simulate failure to avoid actual execution
            }
          })
        };
        spawn.mockReturnValue(mockChild);

        await runBacktest(mockReq as Request, mockRes as Response);

        // Should not reject the strategy
        expect(mockStatus).not.toHaveBeenCalledWith(400);
      }
    });
  });

  describe('runBacktest - Custom Strategy Support', () => {
    it('should accept custom strategy type', async () => {
      mockReq.body = {
        strategy: 'custom',
        symbols: ['AAPL'],
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        customStrategy: {
          id: 1,
          buy_conditions: { type: 'indicator', indicator: { type: 'sma', params: { period: 20 } } },
          sell_conditions: { type: 'indicator', indicator: { type: 'sma', params: { period: 20 } } }
        }
      };

      // Mock CustomStrategy.findById
      (CustomStrategy.findById as jest.Mock) = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        name: 'Test Strategy',
        buy_conditions: JSON.stringify(mockReq.body.customStrategy.buy_conditions),
        sell_conditions: JSON.stringify(mockReq.body.customStrategy.sell_conditions),
        is_active: true
      });

      // Mock parseStrategyData
      (CustomStrategy.parseStrategyData as jest.Mock) = jest.fn().mockReturnValue({
        buy_conditions: mockReq.body.customStrategy.buy_conditions,
        sell_conditions: mockReq.body.customStrategy.sell_conditions
      });

      // Mock spawn to avoid actual execution
      const { spawn } = require('child_process');
      const mockChild = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10);
          }
        })
      };
      spawn.mockReturnValue(mockChild);

      await runBacktest(mockReq as Request, mockRes as Response);

      // Should not reject custom strategy
      expect(mockStatus).not.toHaveBeenCalledWith(400);
      expect(CustomStrategy.findById).toHaveBeenCalledWith(1);
    });

    it('should reject custom strategy without customStrategy data', async () => {
      mockReq.body = {
        strategy: 'custom',
        symbols: ['AAPL'],
        startDate: '2023-01-01',
        endDate: '2023-12-31'
        // Missing customStrategy
      };

      await runBacktest(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Custom strategy ID is required')
        })
      );
    });

    it('should reject custom strategy if not found', async () => {
      mockReq.body = {
        strategy: 'custom',
        symbols: ['AAPL'],
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        customStrategy: {
          id: 999,
          buy_conditions: {},
          sell_conditions: {}
        }
      };

      (CustomStrategy.findById as jest.Mock) = jest.fn().mockResolvedValue(null);

      await runBacktest(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Custom strategy not found')
        })
      );
    });

    it('should reject custom strategy if user does not own it', async () => {
      mockReq.body = {
        strategy: 'custom',
        symbols: ['AAPL'],
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        customStrategy: {
          id: 1,
          buy_conditions: {},
          sell_conditions: {}
        }
      };

      (CustomStrategy.findById as jest.Mock) = jest.fn().mockResolvedValue({
        id: 1,
        user_id: 999, // Different user
        name: 'Test Strategy',
        buy_conditions: '{}',
        sell_conditions: '{}',
        is_active: true
      });

      await runBacktest(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Access denied')
        })
      );
    });
  });

  describe('runBacktest - Session Settings Support', () => {
    it('should accept request with session settings', async () => {
      mockReq.body = {
        strategy: 'meanReversion',
        symbols: ['AAPL'],
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        sessionSettings: {
          stop_loss_percentage: 5.0,
          take_profit_percentage: 10.0,
          max_position_size_percentage: 25.0,
          max_open_positions: 10,
          position_sizing_method: 'percentage',
          position_size_value: 10.0,
          time_in_force: 'day',
          allow_partial_fills: true,
          extended_hours: false,
          order_type_default: 'market',
          trading_hours_start: '09:30',
          trading_hours_end: '16:00',
          trading_days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
          enable_trailing_stop: false,
          enable_bracket_orders: false,
          enable_oco_orders: false,
          commission_rate: 0.0,
          slippage_model: 'none',
          slippage_value: 0.0,
          rebalance_frequency: 'never'
        }
      };

      // Mock spawn to avoid actual execution
      const { spawn } = require('child_process');
      const mockChild = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10);
          }
        })
      };
      spawn.mockReturnValue(mockChild);

      await runBacktest(mockReq as Request, mockRes as Response);

      // Should accept session settings without error
      expect(mockStatus).not.toHaveBeenCalledWith(400);
    });
  });

  describe('runBacktest - Date Validation', () => {
    it('should reject invalid date format', async () => {
      mockReq.body = {
        strategy: 'meanReversion',
        symbols: ['AAPL'],
        startDate: '01-01-2023', // Invalid format
        endDate: '2023-12-31'
      };

      await runBacktest(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Invalid date format')
        })
      );
    });

    it('should reject if start date is after end date', async () => {
      mockReq.body = {
        strategy: 'meanReversion',
        symbols: ['AAPL'],
        startDate: '2023-12-31',
        endDate: '2023-01-01' // End before start
      };

      await runBacktest(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Start date must be before end date')
        })
      );
    });
  });

  describe('runBacktest - Symbol Handling', () => {
    it('should handle single symbol as string', async () => {
      mockReq.body = {
        strategy: 'meanReversion',
        symbols: 'AAPL', // Single symbol as string
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };

      // Mock spawn
      const { spawn } = require('child_process');
      const mockChild = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10);
          }
        })
      };
      spawn.mockReturnValue(mockChild);

      await runBacktest(mockReq as Request, mockRes as Response);

      // Should convert string to array internally
      expect(mockStatus).not.toHaveBeenCalledWith(400);
    });

    it('should handle multiple symbols as array', async () => {
      mockReq.body = {
        strategy: 'meanReversion',
        symbols: ['AAPL', 'TSLA', 'MSFT'],
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };

      // Mock spawn
      const { spawn } = require('child_process');
      const mockChild = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10);
          }
        })
      };
      spawn.mockReturnValue(mockChild);

      await runBacktest(mockReq as Request, mockRes as Response);

      expect(mockStatus).not.toHaveBeenCalledWith(400);
    });
  });
});

