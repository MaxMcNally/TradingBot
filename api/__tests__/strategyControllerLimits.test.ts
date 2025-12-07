import { Request, Response } from 'express';
import { db } from '../initDb';
import { BOT_LIMITS } from '../constants';

// Mock the database
jest.mock('../initDb', () => ({
  db: {
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
  }
}));

const mockDb = db as jest.Mocked<typeof db>;

// Import after mocking
import {
  createStrategy,
  saveStrategyFromBacktest,
  copyPublicStrategy
} from '../controllers/strategyController';

const createMockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

const createMockRequest = (params: any = {}, body: any = {}) => {
  return {
    params,
    body,
  } as Request;
};

describe('Strategy Controller - Bot Limits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createStrategy with limits', () => {
    it('should allow creation when under limit', async () => {
      const req = createMockRequest(
        { userId: '1' },
        { name: 'Test Strategy', strategy_type: 'momentum', config: {} }
      );
      const res = createMockResponse();

      // Mock user with FREE tier
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        if (sql.includes('plan_tier')) {
          callback(null, { plan_tier: 'FREE' });
        } else if (sql.includes('COUNT')) {
          callback(null, { count: 2 }); // Under limit of 5
        } else if (sql.includes('user_strategies WHERE user_id')) {
          callback(null, null); // No existing strategy with same name
        }
      });

      mockDb.run.mockImplementation((sql: string, params: any[], callback: any) => {
        callback.call({ lastID: 1 }, null);
      });

      await createStrategy(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Strategy created successfully',
          limitInfo: expect.objectContaining({
            currentCount: 3, // 2 + 1 new
            maxAllowed: BOT_LIMITS.FREE.maxBots,
            planTier: 'FREE'
          })
        })
      );
    });

    it('should reject creation when at FREE tier limit', async () => {
      const req = createMockRequest(
        { userId: '1' },
        { name: 'Test Strategy', strategy_type: 'momentum', config: {} }
      );
      const res = createMockResponse();

      // Mock user with FREE tier at limit
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        if (sql.includes('plan_tier')) {
          callback(null, { plan_tier: 'FREE' });
        } else if (sql.includes('COUNT')) {
          callback(null, { count: BOT_LIMITS.FREE.maxBots }); // At limit
        }
      });

      await createStrategy(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BOT_LIMIT_EXCEEDED',
          limitInfo: expect.objectContaining({
            currentCount: BOT_LIMITS.FREE.maxBots,
            maxAllowed: BOT_LIMITS.FREE.maxBots,
            planTier: 'FREE'
          })
        })
      );
    });

    it('should allow ENTERPRISE tier unlimited creation', async () => {
      const req = createMockRequest(
        { userId: '1' },
        { name: 'Test Strategy', strategy_type: 'momentum', config: {} }
      );
      const res = createMockResponse();

      // Mock user with ENTERPRISE tier (unlimited)
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        if (sql.includes('plan_tier')) {
          callback(null, { plan_tier: 'ENTERPRISE' });
        } else if (sql.includes('COUNT')) {
          callback(null, { count: 100 }); // High count but should still be allowed
        } else if (sql.includes('user_strategies WHERE user_id')) {
          callback(null, null);
        }
      });

      mockDb.run.mockImplementation((sql: string, params: any[], callback: any) => {
        callback.call({ lastID: 1 }, null);
      });

      await createStrategy(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Strategy created successfully',
          limitInfo: expect.objectContaining({
            maxAllowed: -1, // Unlimited
            planTier: 'ENTERPRISE'
          })
        })
      );
    });

    it('should allow PREMIUM tier with higher limits', async () => {
      const req = createMockRequest(
        { userId: '1' },
        { name: 'Test Strategy', strategy_type: 'momentum', config: {} }
      );
      const res = createMockResponse();

      // Mock user with PREMIUM tier
      const premiumUserCount = BOT_LIMITS.FREE.maxBots + 5; // More than FREE allows
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        if (sql.includes('plan_tier')) {
          callback(null, { plan_tier: 'PREMIUM' });
        } else if (sql.includes('COUNT')) {
          callback(null, { count: premiumUserCount }); // More than FREE limit but under PREMIUM
        } else if (sql.includes('user_strategies WHERE user_id')) {
          callback(null, null);
        }
      });

      mockDb.run.mockImplementation((sql: string, params: any[], callback: any) => {
        callback.call({ lastID: 1 }, null);
      });

      await createStrategy(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          limitInfo: expect.objectContaining({
            maxAllowed: BOT_LIMITS.PREMIUM.maxBots,
            planTier: 'PREMIUM'
          })
        })
      );
    });
  });

  describe('saveStrategyFromBacktest with limits', () => {
    it('should check limits before saving from backtest', async () => {
      const req = createMockRequest(
        { userId: '1' },
        { 
          name: 'Backtest Strategy', 
          strategy_type: 'momentum', 
          config: {},
          backtest_results: { totalReturn: 0.15 }
        }
      );
      const res = createMockResponse();

      // Mock user at limit
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        if (sql.includes('plan_tier')) {
          callback(null, { plan_tier: 'FREE' });
        } else if (sql.includes('COUNT')) {
          callback(null, { count: BOT_LIMITS.FREE.maxBots });
        }
      });

      await saveStrategyFromBacktest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BOT_LIMIT_EXCEEDED'
        })
      );
    });
  });

  describe('copyPublicStrategy with limits', () => {
    it('should check limits before copying public strategy', async () => {
      const req = createMockRequest(
        { userId: '1' },
        { strategyId: 100, customName: 'My Copy' }
      );
      const res = createMockResponse();

      // Mock user at limit
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        if (sql.includes('plan_tier')) {
          callback(null, { plan_tier: 'FREE' });
        } else if (sql.includes('COUNT')) {
          callback(null, { count: BOT_LIMITS.FREE.maxBots });
        }
      });

      await copyPublicStrategy(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BOT_LIMIT_EXCEEDED'
        })
      );
    });
  });

  describe('Tier limit values', () => {
    it('FREE tier should have correct limits', () => {
      expect(BOT_LIMITS.FREE.maxBots).toBe(5);
      expect(BOT_LIMITS.FREE.maxRunningBots).toBe(1);
    });

    it('BASIC tier should have higher limits than FREE', () => {
      expect(BOT_LIMITS.BASIC.maxBots).toBeGreaterThan(BOT_LIMITS.FREE.maxBots);
      expect(BOT_LIMITS.BASIC.maxRunningBots).toBeGreaterThan(BOT_LIMITS.FREE.maxRunningBots);
    });

    it('PREMIUM tier should have higher limits than BASIC', () => {
      expect(BOT_LIMITS.PREMIUM.maxBots).toBeGreaterThan(BOT_LIMITS.BASIC.maxBots);
      expect(BOT_LIMITS.PREMIUM.maxRunningBots).toBeGreaterThan(BOT_LIMITS.BASIC.maxRunningBots);
    });

    it('ENTERPRISE tier should be unlimited', () => {
      expect(BOT_LIMITS.ENTERPRISE.maxBots).toBe(-1);
      expect(BOT_LIMITS.ENTERPRISE.maxRunningBots).toBe(-1);
    });
  });
});
