import { db } from '../initDb';

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
import { SubscriptionTier, SubscriptionTierData } from '../models/SubscriptionTier';

describe('SubscriptionTier Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTierData: SubscriptionTierData = {
    id: 1,
    tier: 'BASIC',
    name: 'Basic',
    monthly_price: 9.99,
    price_cents: 999,
    currency: 'USD',
    headline: 'Unlock automation essentials',
    badge: 'Popular',
    max_bots: 15,
    max_running_bots: 5,
    features: ['Feature 1', 'Feature 2'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  describe('findAll', () => {
    it('should return all subscription tiers', async () => {
      const mockTiers = [
        { ...mockTierData, tier: 'FREE', features: '["Feature 1"]' },
        { ...mockTierData, tier: 'BASIC', features: '["Feature 1", "Feature 2"]' },
        { ...mockTierData, tier: 'PREMIUM', features: '["Feature 1", "Feature 2", "Feature 3"]' },
        { ...mockTierData, tier: 'ENTERPRISE', features: '["All Features"]' }
      ];

      mockDb.all.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, mockTiers);
      });

      const tiers = await SubscriptionTier.findAll();

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM subscription_tiers'),
        [],
        expect.any(Function)
      );
      expect(tiers).toHaveLength(4);
      expect(tiers[0].features).toBeInstanceOf(Array);
    });

    it('should return empty array when no tiers exist', async () => {
      mockDb.all.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, []);
      });

      const tiers = await SubscriptionTier.findAll();

      expect(tiers).toEqual([]);
    });
  });

  describe('findByTier', () => {
    it('should find a tier by name', async () => {
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, { ...mockTierData, features: JSON.stringify(mockTierData.features) });
      });

      const tier = await SubscriptionTier.findByTier('BASIC');

      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tier = $1'),
        ['BASIC'],
        expect.any(Function)
      );
      expect(tier?.tier).toBe('BASIC');
      expect(tier?.features).toBeInstanceOf(Array);
    });

    it('should handle lowercase tier names', async () => {
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, { ...mockTierData, features: JSON.stringify(mockTierData.features) });
      });

      await SubscriptionTier.findByTier('basic');

      expect(mockDb.get).toHaveBeenCalledWith(
        expect.any(String),
        ['BASIC'],
        expect.any(Function)
      );
    });

    it('should return null for non-existent tier', async () => {
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, null);
      });

      const tier = await SubscriptionTier.findByTier('INVALID');

      expect(tier).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a tier by ID', async () => {
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, { ...mockTierData, features: JSON.stringify(mockTierData.features) });
      });

      const tier = await SubscriptionTier.findById(1);

      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1],
        expect.any(Function)
      );
      expect(tier?.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should update tier properties', async () => {
      mockDb.run.mockImplementation((sql: string, params: any[], callback: any) => {
        callback.call({ changes: 1 }, null);
      });

      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, { 
          ...mockTierData, 
          max_bots: 20, 
          features: JSON.stringify(mockTierData.features) 
        });
      });

      const updated = await SubscriptionTier.update('BASIC', { max_bots: 20 });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscription_tiers SET'),
        expect.arrayContaining([20, 'BASIC']),
        expect.any(Function)
      );
      expect(updated?.max_bots).toBe(20);
    });

    it('should return null when no fields to update', async () => {
      const updated = await SubscriptionTier.update('BASIC', {});

      expect(mockDb.run).not.toHaveBeenCalled();
      expect(updated).toBeNull();
    });

    it('should stringify features array when updating', async () => {
      mockDb.run.mockImplementation((sql: string, params: any[], callback: any) => {
        callback.call({ changes: 1 }, null);
      });

      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, { 
          ...mockTierData, 
          features: '["New Feature 1", "New Feature 2"]'
        });
      });

      await SubscriptionTier.update('BASIC', { features: ['New Feature 1', 'New Feature 2'] });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.stringContaining('New Feature')]),
        expect.any(Function)
      );
    });
  });

  describe('getLimitsForTier', () => {
    it('should return limits for a valid tier', async () => {
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, { 
          ...mockTierData, 
          features: JSON.stringify(mockTierData.features) 
        });
      });

      const limits = await SubscriptionTier.getLimitsForTier('BASIC');

      expect(limits.maxBots).toBe(15);
      expect(limits.maxRunningBots).toBe(5);
      expect(limits.displayName).toBe('Basic');
    });

    it('should return default FREE limits for invalid tier', async () => {
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, null);
      });

      const limits = await SubscriptionTier.getLimitsForTier('INVALID');

      expect(limits.maxBots).toBe(5);
      expect(limits.maxRunningBots).toBe(1);
      expect(limits.displayName).toBe('Free');
    });
  });

  describe('getActiveTiers', () => {
    it('should return only active tiers', async () => {
      const activeTiers = [
        { ...mockTierData, tier: 'FREE', is_active: true, features: '[]' },
        { ...mockTierData, tier: 'BASIC', is_active: true, features: '[]' }
      ];

      mockDb.all.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, activeTiers);
      });

      const tiers = await SubscriptionTier.getActiveTiers();

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE is_active = TRUE'),
        [],
        expect.any(Function)
      );
      expect(tiers).toHaveLength(2);
    });
  });

  describe('Data parsing', () => {
    it('should parse JSON features string to array', async () => {
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, { 
          ...mockTierData, 
          features: '["Feature 1", "Feature 2", "Feature 3"]'
        });
      });

      const tier = await SubscriptionTier.findByTier('BASIC');

      expect(tier?.features).toBeInstanceOf(Array);
      expect(tier?.features).toHaveLength(3);
    });

    it('should handle features already as array', async () => {
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, { 
          ...mockTierData, 
          features: ['Already', 'An', 'Array']
        });
      });

      const tier = await SubscriptionTier.findByTier('BASIC');

      expect(tier?.features).toBeInstanceOf(Array);
    });

    it('should parse monthly_price as float', async () => {
      mockDb.get.mockImplementation((sql: string, params: any[], callback: any) => {
        callback(null, { 
          ...mockTierData, 
          monthly_price: '9.99',
          features: '[]'
        });
      });

      const tier = await SubscriptionTier.findByTier('BASIC');

      expect(typeof tier?.monthly_price).toBe('number');
      expect(tier?.monthly_price).toBe(9.99);
    });
  });
});
