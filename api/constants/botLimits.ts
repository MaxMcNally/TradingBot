/**
 * Bot Limits Constants
 * 
 * Default configurable limits for bot creation and execution per subscription tier.
 * These values serve as fallbacks when database configuration is not available.
 * Admin users can modify these limits through the admin dashboard.
 */

export type PlanTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

export interface TierLimits {
  /** Maximum number of bots/strategies the user can create */
  maxBots: number;
  /** Maximum number of bots/strategies that can run simultaneously */
  maxRunningBots: number;
  /** Display name for the tier */
  displayName: string;
}

/**
 * Default bot limits configuration per subscription tier
 * 
 * These are the default values used when database config is not available:
 * - FREE: Basic access for new users (5 bots, 1 running)
 * - BASIC: Entry-level paid tier (15 bots, 5 running)
 * - PREMIUM: Advanced tier with higher limits (50 bots, 25 running)
 * - ENTERPRISE: Unlimited for business customers
 * 
 * Note: Admin users can override these values through the admin dashboard.
 */
export const BOT_LIMITS: Record<PlanTier, TierLimits> = {
  FREE: {
    maxBots: 5,
    maxRunningBots: 1,
    displayName: 'Free'
  },
  BASIC: {
    maxBots: 15,
    maxRunningBots: 5,
    displayName: 'Basic'
  },
  PREMIUM: {
    maxBots: 50,
    maxRunningBots: 25,
    displayName: 'Premium'
  },
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
