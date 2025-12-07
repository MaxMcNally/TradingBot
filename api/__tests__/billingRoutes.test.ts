import billingRouter, { BILLING_PLANS, PROVIDERS } from '../routes/billing';
import { db } from '../initDb';
import { BOT_LIMITS } from '../constants';

jest.mock('../initDb', () => ({
  db: {
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
  }
}));

const mockDb = db as jest.Mocked<typeof db>;

const findHandler = (method: 'get' | 'post' | 'put', path: string) => {
  const layer = billingRouter.stack.find(
    (routeLayer: any) => routeLayer.route?.path === path && routeLayer.route?.methods?.[method]
  );
  const handlers = layer?.route?.stack;
  if (!handlers || handlers.length === 0) return undefined;
  return handlers[handlers.length - 1]?.handle;
};

const createRes = () => {
  const res: any = {};
  res.statusCode = 200;
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((payload: any) => {
    res.body = payload;
    return res;
  });
  return res;
};

describe('billingRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BILLING_PLANS configuration', () => {
    it('exposes four billing plans with expected tiers and providers', () => {
      const tiers = BILLING_PLANS.map(plan => plan.tier);
      expect(tiers).toEqual(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']);
      expect(BILLING_PLANS.find(p => p.tier === 'BASIC')?.priceCents).toBe(999);
      expect(PROVIDERS).toEqual(['STRIPE', 'PAYPAL', 'SQUARE']);
    });

    it('each plan includes limits configuration', () => {
      BILLING_PLANS.forEach(plan => {
        expect(plan.limits).toBeDefined();
        expect(plan.limits.maxBots).toBeDefined();
        expect(plan.limits.maxRunningBots).toBeDefined();
        expect(plan.limits.displayName).toBeDefined();
      });
    });

    it('plans have correct bot limits', () => {
      const freePlan = BILLING_PLANS.find(p => p.tier === 'FREE');
      const basicPlan = BILLING_PLANS.find(p => p.tier === 'BASIC');
      const premiumPlan = BILLING_PLANS.find(p => p.tier === 'PREMIUM');
      const enterprisePlan = BILLING_PLANS.find(p => p.tier === 'ENTERPRISE');

      expect(freePlan?.limits.maxBots).toBe(BOT_LIMITS.FREE.maxBots);
      expect(freePlan?.limits.maxRunningBots).toBe(BOT_LIMITS.FREE.maxRunningBots);
      
      expect(basicPlan?.limits.maxBots).toBe(BOT_LIMITS.BASIC.maxBots);
      expect(basicPlan?.limits.maxRunningBots).toBe(BOT_LIMITS.BASIC.maxRunningBots);
      
      expect(premiumPlan?.limits.maxBots).toBe(BOT_LIMITS.PREMIUM.maxBots);
      expect(premiumPlan?.limits.maxRunningBots).toBe(BOT_LIMITS.PREMIUM.maxRunningBots);
      
      expect(enterprisePlan?.limits.maxBots).toBe(-1); // Unlimited
      expect(enterprisePlan?.limits.maxRunningBots).toBe(-1); // Unlimited
    });

    it('features include bot limits information', () => {
      BILLING_PLANS.forEach(plan => {
        expect(plan.features.length).toBeGreaterThan(0);
        // Each plan should mention bots in features
        const hasBotFeature = plan.features.some(f => f.toLowerCase().includes('bot'));
        expect(hasBotFeature).toBe(true);
      });
    });
  });

  describe('GET /plans', () => {
    it('returns plan metadata with limits', () => {
      const handler = findHandler('get', '/plans');
      const res = createRes();

      handler?.({} as any, res, () => {});

      expect(res.json).toHaveBeenCalled();
      expect(res.body.success).toBe(true);
      expect(res.body.plans).toHaveLength(BILLING_PLANS.length);
      expect(res.body.allLimits).toBeDefined();
      
      // Check that allLimits contains all tiers
      expect(res.body.allLimits).toHaveProperty('FREE');
      expect(res.body.allLimits).toHaveProperty('BASIC');
      expect(res.body.allLimits).toHaveProperty('PREMIUM');
      expect(res.body.allLimits).toHaveProperty('ENTERPRISE');
    });
  });

  describe('POST /checkout', () => {
    it('updates subscription for paid plan', () => {
      const handler = findHandler('post', '/checkout');
      const res = createRes();

      mockDb.run.mockImplementation((_sql: string, _params: any[], callback?: (...args: any[]) => void) => {
        callback && callback.call({}, null);
        return {} as any;
      });

      handler?.(
        {
          user: { id: 42 },
          body: { planTier: 'BASIC', provider: 'STRIPE', paymentMethod: 'card' }
        } as any,
        res,
        () => {}
      );

      expect(mockDb.run).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalled();
      expect(res.body.subscription.planTier).toBe('BASIC');
      expect(res.body.subscription.provider).toBe('STRIPE');
    });

    it('fails without auth user', () => {
      const handler = findHandler('post', '/checkout');
      const res = createRes();

      handler?.({ body: { planTier: 'BASIC', provider: 'STRIPE' } } as any, res, () => {});

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body.error).toBeDefined();
    });

    it('fails with invalid plan tier', () => {
      const handler = findHandler('post', '/checkout');
      const res = createRes();

      handler?.(
        {
          user: { id: 42 },
          body: { planTier: 'INVALID_TIER', provider: 'STRIPE' }
        } as any,
        res,
        () => {}
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.error).toContain('Invalid plan');
    });

    it('requires provider for paid plans', () => {
      const handler = findHandler('post', '/checkout');
      const res = createRes();

      handler?.(
        {
          user: { id: 42 },
          body: { planTier: 'BASIC' } // No provider
        } as any,
        res,
        () => {}
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body.error).toContain('provider');
    });

    it('allows free plan without provider', () => {
      const handler = findHandler('post', '/checkout');
      const res = createRes();

      mockDb.run.mockImplementation((_sql: string, _params: any[], callback?: (...args: any[]) => void) => {
        callback && callback.call({}, null);
        return {} as any;
      });

      handler?.(
        {
          user: { id: 42 },
          body: { planTier: 'FREE' }
        } as any,
        res,
        () => {}
      );

      expect(res.body.subscription.planTier).toBe('FREE');
      expect(res.body.subscription.provider).toBe('NONE');
    });
  });

  describe('Tier limits integration', () => {
    it('FREE tier has most restrictive limits', () => {
      const freeLimits = BOT_LIMITS.FREE;
      const basicLimits = BOT_LIMITS.BASIC;
      
      expect(freeLimits.maxBots).toBeLessThan(basicLimits.maxBots);
      expect(freeLimits.maxRunningBots).toBeLessThan(basicLimits.maxRunningBots);
    });

    it('ENTERPRISE tier has unlimited limits', () => {
      const enterpriseLimits = BOT_LIMITS.ENTERPRISE;
      
      expect(enterpriseLimits.maxBots).toBe(-1);
      expect(enterpriseLimits.maxRunningBots).toBe(-1);
    });

    it('limits increase with tier level', () => {
      const tiers = ['FREE', 'BASIC', 'PREMIUM'] as const;
      
      for (let i = 0; i < tiers.length - 1; i++) {
        const currentTier = BOT_LIMITS[tiers[i]];
        const nextTier = BOT_LIMITS[tiers[i + 1]];
        
        expect(nextTier.maxBots).toBeGreaterThan(currentTier.maxBots);
        expect(nextTier.maxRunningBots).toBeGreaterThan(currentTier.maxRunningBots);
      }
    });
  });
});
