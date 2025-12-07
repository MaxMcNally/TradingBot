import {
  BOT_LIMITS,
  getTierLimits,
  isUnlimited,
  formatLimit,
  PlanTier
} from '../constants/botLimits';

describe('Bot Limits Constants', () => {
  describe('BOT_LIMITS', () => {
    it('should define limits for all four tiers', () => {
      expect(BOT_LIMITS).toHaveProperty('FREE');
      expect(BOT_LIMITS).toHaveProperty('BASIC');
      expect(BOT_LIMITS).toHaveProperty('PREMIUM');
      expect(BOT_LIMITS).toHaveProperty('ENTERPRISE');
    });

    it('should have correct FREE tier limits', () => {
      expect(BOT_LIMITS.FREE.maxBots).toBe(5);
      expect(BOT_LIMITS.FREE.maxRunningBots).toBe(1);
      expect(BOT_LIMITS.FREE.displayName).toBe('Free');
    });

    it('should have correct BASIC tier limits', () => {
      expect(BOT_LIMITS.BASIC.maxBots).toBe(15);
      expect(BOT_LIMITS.BASIC.maxRunningBots).toBe(5);
      expect(BOT_LIMITS.BASIC.displayName).toBe('Basic');
    });

    it('should have correct PREMIUM tier limits', () => {
      expect(BOT_LIMITS.PREMIUM.maxBots).toBe(50);
      expect(BOT_LIMITS.PREMIUM.maxRunningBots).toBe(25);
      expect(BOT_LIMITS.PREMIUM.displayName).toBe('Premium');
    });

    it('should have unlimited (-1) for ENTERPRISE tier', () => {
      expect(BOT_LIMITS.ENTERPRISE.maxBots).toBe(-1);
      expect(BOT_LIMITS.ENTERPRISE.maxRunningBots).toBe(-1);
      expect(BOT_LIMITS.ENTERPRISE.displayName).toBe('Enterprise');
    });

    it('should have increasing limits from FREE to PREMIUM', () => {
      expect(BOT_LIMITS.BASIC.maxBots).toBeGreaterThan(BOT_LIMITS.FREE.maxBots);
      expect(BOT_LIMITS.PREMIUM.maxBots).toBeGreaterThan(BOT_LIMITS.BASIC.maxBots);
      expect(BOT_LIMITS.BASIC.maxRunningBots).toBeGreaterThan(BOT_LIMITS.FREE.maxRunningBots);
      expect(BOT_LIMITS.PREMIUM.maxRunningBots).toBeGreaterThan(BOT_LIMITS.BASIC.maxRunningBots);
    });
  });

  describe('getTierLimits', () => {
    it('should return correct limits for each tier', () => {
      const tiers: PlanTier[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];
      
      tiers.forEach(tier => {
        const limits = getTierLimits(tier);
        expect(limits).toEqual(BOT_LIMITS[tier]);
      });
    });

    it('should handle lowercase tier names', () => {
      expect(getTierLimits('free')).toEqual(BOT_LIMITS.FREE);
      expect(getTierLimits('basic')).toEqual(BOT_LIMITS.BASIC);
      expect(getTierLimits('premium')).toEqual(BOT_LIMITS.PREMIUM);
      expect(getTierLimits('enterprise')).toEqual(BOT_LIMITS.ENTERPRISE);
    });

    it('should handle mixed case tier names', () => {
      expect(getTierLimits('Free')).toEqual(BOT_LIMITS.FREE);
      expect(getTierLimits('BaSiC')).toEqual(BOT_LIMITS.BASIC);
    });

    it('should default to FREE tier for undefined input', () => {
      expect(getTierLimits(undefined)).toEqual(BOT_LIMITS.FREE);
    });

    it('should default to FREE tier for invalid input', () => {
      expect(getTierLimits('INVALID_TIER')).toEqual(BOT_LIMITS.FREE);
      expect(getTierLimits('')).toEqual(BOT_LIMITS.FREE);
    });
  });

  describe('isUnlimited', () => {
    it('should return true for -1', () => {
      expect(isUnlimited(-1)).toBe(true);
    });

    it('should return false for positive numbers', () => {
      expect(isUnlimited(0)).toBe(false);
      expect(isUnlimited(1)).toBe(false);
      expect(isUnlimited(100)).toBe(false);
    });

    it('should return false for other negative numbers', () => {
      expect(isUnlimited(-2)).toBe(false);
      expect(isUnlimited(-100)).toBe(false);
    });
  });

  describe('formatLimit', () => {
    it('should return "Unlimited" for -1', () => {
      expect(formatLimit(-1)).toBe('Unlimited');
    });

    it('should return string representation of positive numbers', () => {
      expect(formatLimit(0)).toBe('0');
      expect(formatLimit(1)).toBe('1');
      expect(formatLimit(5)).toBe('5');
      expect(formatLimit(100)).toBe('100');
    });
  });

  describe('TierLimits structure', () => {
    it('should have required properties for each tier', () => {
      const tiers: PlanTier[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];
      
      tiers.forEach(tier => {
        const limits = BOT_LIMITS[tier];
        expect(limits).toHaveProperty('maxBots');
        expect(limits).toHaveProperty('maxRunningBots');
        expect(limits).toHaveProperty('displayName');
        expect(typeof limits.maxBots).toBe('number');
        expect(typeof limits.maxRunningBots).toBe('number');
        expect(typeof limits.displayName).toBe('string');
      });
    });
  });
});
