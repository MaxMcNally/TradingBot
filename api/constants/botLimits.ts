/**
 * Bot Limits Constants
 * 
 * @description
 * Default configurable limits for bot creation and execution per subscription tier.
 * These values serve as fallbacks when database configuration is not available.
 * Admin users can modify these limits through the admin dashboard.
 * 
 * @see /docs/SUBSCRIPTION_TIERS.md for full documentation
 * 
 * @example
 * // Get limits for a user's tier
 * const limits = getTierLimits(user.plan_tier);
 * if (userBotCount >= limits.maxBots && limits.maxBots !== -1) {
 *   throw new Error('Bot limit exceeded');
 * }
 */

/**
 * Available subscription plan tiers
 * - FREE: Entry-level, no payment required
 * - BASIC: $9.99/month, ideal for active traders
 * - PREMIUM: $29.99/month, for serious traders
 * - ENTERPRISE: $199.99/month, unlimited for professionals
 */
export type PlanTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

/**
 * Tier limits configuration interface
 */
export interface TierLimits {
  /** 
   * Maximum number of bots/strategies the user can create
   * -1 represents unlimited
   */
  maxBots: number;
  
  /** 
   * Maximum number of bots/strategies that can run simultaneously
   * -1 represents unlimited
   */
  maxRunningBots: number;
  
  /** Human-readable display name for the tier */
  displayName: string;
}

/**
 * Default bot limits configuration per subscription tier
 * 
 * | Tier       | Max Bots | Max Running | Price    | Best For                    |
 * |------------|----------|-------------|----------|-----------------------------|
 * | FREE       | 5        | 1           | $0       | Learning, exploration       |
 * | BASIC      | 15       | 5           | $9.99    | Active individual traders   |
 * | PREMIUM    | 50       | 25          | $29.99   | Serious traders, teams      |
 * | ENTERPRISE | ∞        | ∞           | $199.99  | Professional operations     |
 * 
 * Note: Admin users can override these values through the admin dashboard.
 * The database `subscription_tiers` table takes precedence when available.
 */
export const BOT_LIMITS: Record<PlanTier, TierLimits> = {
  /**
   * FREE Tier - Perfect for getting started
   * - 5 bots max: Enough to test different strategies
   * - 1 running: Focus on one strategy at a time
   */
  FREE: {
    maxBots: 5,
    maxRunningBots: 1,
    displayName: 'Free'
  },
  
  /**
   * BASIC Tier - For active traders ($9.99/month)
   * - 15 bots: Room to diversify strategies
   * - 5 running: Multi-asset or multi-strategy execution
   */
  BASIC: {
    maxBots: 15,
    maxRunningBots: 5,
    displayName: 'Basic'
  },
  
  /**
   * PREMIUM Tier - For serious traders ($29.99/month)
   * - 50 bots: Comprehensive strategy library
   * - 25 running: High-throughput trading operations
   */
  PREMIUM: {
    maxBots: 50,
    maxRunningBots: 25,
    displayName: 'Premium'
  },
  
  /**
   * ENTERPRISE Tier - For professionals ($199.99/month)
   * - Unlimited bots: No restrictions
   * - Unlimited running: Scale without limits
   */
  ENTERPRISE: {
    maxBots: -1, // -1 means unlimited
    maxRunningBots: -1,
    displayName: 'Enterprise'
  }
};

// Cache for database-loaded limits
let dbLimitsCache: Record<string, TierLimits> | null = null;
let cacheLoadedAt: number = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Load limits from database (used internally)
 */
export const loadDbLimits = async (): Promise<Record<string, TierLimits>> => {
  // Lazy import to avoid circular dependencies
  try {
    const { SubscriptionTier } = await import('../models/SubscriptionTier');
    const tiers = await SubscriptionTier.findAll();
    const limits: Record<string, TierLimits> = {};
    
    for (const tier of tiers) {
      limits[tier.tier] = {
        maxBots: tier.max_bots,
        maxRunningBots: tier.max_running_bots,
        displayName: tier.name
      };
    }
    
    return limits;
  } catch (error) {
    console.warn('Could not load tier limits from database, using defaults');
    return {};
  }
};

/**
 * Refresh the limits cache from database
 */
export const refreshLimitsCache = async (): Promise<void> => {
  try {
    dbLimitsCache = await loadDbLimits();
    cacheLoadedAt = Date.now();
  } catch (error) {
    console.warn('Failed to refresh limits cache');
  }
};

/**
 * Get the limits for a specific tier
 * Uses database configuration if available, falls back to constants
 * @param tier The subscription tier
 * @returns The limits for that tier, defaults to FREE if tier is invalid
 */
export const getTierLimits = (tier?: PlanTier | string): TierLimits => {
  const normalizedTier = (tier || 'FREE').toUpperCase() as PlanTier;
  
  // Check if we have cached DB limits that are still valid
  if (dbLimitsCache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    if (dbLimitsCache[normalizedTier]) {
      return dbLimitsCache[normalizedTier];
    }
  }
  
  // Fall back to constants
  return BOT_LIMITS[normalizedTier] || BOT_LIMITS.FREE;
};

/**
 * Get limits asynchronously (loads from DB if cache is stale)
 * Recommended for non-hot-path operations
 */
export const getTierLimitsAsync = async (tier?: PlanTier | string): Promise<TierLimits> => {
  const normalizedTier = (tier || 'FREE').toUpperCase() as PlanTier;
  
  // Refresh cache if stale
  if (!dbLimitsCache || Date.now() - cacheLoadedAt > CACHE_TTL_MS) {
    await refreshLimitsCache();
  }
  
  if (dbLimitsCache && dbLimitsCache[normalizedTier]) {
    return dbLimitsCache[normalizedTier];
  }
  
  return BOT_LIMITS[normalizedTier] || BOT_LIMITS.FREE;
};

/**
 * Check if a limit value represents "unlimited"
 * @param limit The limit value to check
 * @returns True if the limit is unlimited (-1)
 */
export const isUnlimited = (limit: number): boolean => limit === -1;

/**
 * Get a human-readable string for a limit value
 * @param limit The limit value
 * @returns A string representation (e.g., "5" or "Unlimited")
 */
export const formatLimit = (limit: number): string => {
  return isUnlimited(limit) ? 'Unlimited' : limit.toString();
};

export default BOT_LIMITS;
