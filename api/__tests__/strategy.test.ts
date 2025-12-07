import { Strategy, StrategyData, CreateStrategyData } from '../models/Strategy';
import { db } from '../initDb';

// Mock the database
jest.mock('../initDb', () => ({
  db: {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
  }
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('Strategy Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a strategy with is_public field', async () => {
      const strategyData: CreateStrategyData = {
        user_id: 1,
        name: 'Test Strategy',
        description: 'Test description',
        strategy_type: 'moving_average_crossover',
        config: { fastWindow: 10, slowWindow: 30 },
        is_public: true
      };

      const mockLastID = 123;
      mockDb.run.mockImplementation((query: string, params: any[], callback: (...args: any[]) => void) => {
        callback.call({ lastID: mockLastID });
        return {} as any;
      });

      const result = await Strategy.create(strategyData);

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO user_strategies (user_id, name, description, strategy_type, config, backtest_results, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [1, 'Test Strategy', 'Test description', 'moving_average_crossover', '{"fastWindow":10,"slowWindow":30}', null, true],
        expect.any(Function)
      );

      expect(result).toEqual({
        id: mockLastID,
        user_id: 1,
        name: 'Test Strategy',
        description: 'Test description',
        strategy_type: 'moving_average_crossover',
        config: '{"fastWindow":10,"slowWindow":30}',
        backtest_results: undefined,
        is_active: true,
        is_public: true,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
    });

    it('should create a strategy with is_public defaulting to false', async () => {
      const strategyData: CreateStrategyData = {
        user_id: 1,
        name: 'Test Strategy',
        description: 'Test description',
        strategy_type: 'moving_average_crossover',
        config: { fastWindow: 10, slowWindow: 30 }
      };

      const mockLastID = 123;
      mockDb.run.mockImplementation((query: string, params: any[], callback: (...args: any[]) => void) => {
        callback.call({ lastID: mockLastID });
        return {} as any;
      });

      const result = await Strategy.create(strategyData);

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO user_strategies (user_id, name, description, strategy_type, config, backtest_results, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [1, 'Test Strategy', 'Test description', 'moving_average_crossover', '{"fastWindow":10,"slowWindow":30}', null, false],
        expect.any(Function)
      );

      expect(result.is_public).toBe(false);
    });
  });

  describe('findPublicStrategies', () => {
    it('should find all public strategies', async () => {
      const mockStrategies = [
        {
          id: 1,
          user_id: 1,
          name: 'Public Strategy 1',
          strategy_type: 'moving_average_crossover',
          is_public: 1,
          is_active: 1,
          created_at: '2023-01-01'
        },
        {
          id: 2,
          user_id: 2,
          name: 'Public Strategy 2',
          strategy_type: 'bollinger_bands',
          is_public: 1,
          is_active: 1,
          created_at: '2023-01-02'
        }
      ];

      mockDb.all.mockImplementation((query: string, params: any[], callback: (...args: any[]) => void) => {
        callback(null, mockStrategies);
        return {} as any;
      });

      const result = await Strategy.findPublicStrategies();

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM user_strategies WHERE is_public = 1 AND is_active = 1 ORDER BY created_at DESC',
        [],
        expect.any(Function)
      );

      expect(result).toEqual(mockStrategies);
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');
      mockDb.all.mockImplementation((query: string, params: any[], callback: (...args: any[]) => void) => {
        callback(mockError, null);
        return {} as any;
      });

      await expect(Strategy.findPublicStrategies()).rejects.toThrow('Database error');
    });
  });

  describe('findPublicStrategiesByType', () => {
    it('should find public strategies by type', async () => {
      const mockStrategies = [
        {
          id: 1,
          user_id: 1,
          name: 'Moving Average Strategy',
          strategy_type: 'moving_average_crossover',
          is_public: 1,
          is_active: 1,
          created_at: '2023-01-01'
        }
      ];

      mockDb.all.mockImplementation((query: string, params: any[], callback: (...args: any[]) => void) => {
        callback(null, mockStrategies);
        return {} as any;
      });

      const result = await Strategy.findPublicStrategiesByType('moving_average_crossover');

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM user_strategies WHERE is_public = 1 AND is_active = 1 AND strategy_type = ? ORDER BY created_at DESC',
        ['moving_average_crossover'],
        expect.any(Function)
      );

      expect(result).toEqual(mockStrategies);
    });
  });

  describe('update', () => {
    it('should update strategy including is_public field', async () => {
      const updateData = {
        name: 'Updated Strategy',
        is_public: true
      };

      const mockUpdatedStrategy = {
        id: 1,
        user_id: 1,
        name: 'Updated Strategy',
        is_public: 1,
        updated_at: '2023-01-01'
      };

      mockDb.run.mockImplementation((query: string, params: any[], callback: (...args: any[]) => void) => {
        callback.call({ changes: 1 });
        return {} as any;
      });

      mockDb.get.mockImplementation((query: string, params: any[], callback: (...args: any[]) => void) => {
        callback(null, mockUpdatedStrategy);
        return {} as any;
      });

      const result = await Strategy.update(1, updateData);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_strategies SET'),
        expect.arrayContaining(['Updated Strategy', true, 1]),
        expect.any(Function)
      );

      expect(result).toEqual(mockUpdatedStrategy);
    });
  });

  describe('parseStrategyData', () => {
    it('should parse JSON fields correctly', () => {
      const strategyData: StrategyData = {
        id: 1,
        user_id: 1,
        name: 'Test Strategy',
        strategy_type: 'moving_average_crossover',
        config: '{"fastWindow":10,"slowWindow":30}',
        backtest_results: '{"totalReturn":0.15,"winRate":0.65}',
        is_active: true,
        is_public: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      const result = Strategy.parseStrategyData(strategyData);

      expect(result.config).toEqual({ fastWindow: 10, slowWindow: 30 });
      expect(result.backtest_results).toEqual({ totalReturn: 0.15, winRate: 0.65 });
      expect(result.is_public).toBe(true);
    });

    it('should handle invalid JSON gracefully', () => {
      const strategyData: StrategyData = {
        id: 1,
        user_id: 1,
        name: 'Test Strategy',
        strategy_type: 'moving_average_crossover',
        config: 'invalid json',
        backtest_results: '{"totalReturn":0.15}',
        is_active: true,
        is_public: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      const result = Strategy.parseStrategyData(strategyData);

      expect(result.config).toBe('invalid json');
      expect(result.backtest_results).toBe('{"totalReturn":0.15}');
    });
  });
});
