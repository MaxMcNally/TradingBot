import billingRouter, { BILLING_PLANS, PROVIDERS } from '../routes/billing';
import { db } from '../initDb';

jest.mock('../initDb', () => ({
  isPostgres: false,
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

  it('exposes four billing plans with expected tiers and providers', () => {
    const tiers = BILLING_PLANS.map(plan => plan.tier);
    expect(tiers).toEqual(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']);
    expect(BILLING_PLANS.find(p => p.tier === 'BASIC')?.priceCents).toBe(999);
    expect(PROVIDERS).toEqual(['STRIPE', 'PAYPAL', 'SQUARE']);
  });

  it('GET /plans returns plan metadata', () => {
    const handler = findHandler('get', '/plans');
    const res = createRes();

    handler?.({} as any, res, () => {});

    expect(res.json).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.plans).toHaveLength(BILLING_PLANS.length);
  });

  it('POST /checkout updates subscription for paid plan', () => {
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

  it('POST /checkout fails without auth user', () => {
    const handler = findHandler('post', '/checkout');
    const res = createRes();

    handler?.({ body: { planTier: 'BASIC', provider: 'STRIPE' } } as any, res, () => {});

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.error).toBeDefined();
  });
});
