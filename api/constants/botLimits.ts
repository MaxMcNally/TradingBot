/**
 * Bot Limits Constants
 * 
 * Configurable limits for bot creation and execution per subscription tier.
 * These values can be adjusted as needed without changing application logic.
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
 * Bot limits configuration per subscription tier
 * 
 * Adjust these values to change limits for each tier:
 * - FREE: Basic access for new users
 * - BASIC: Entry-level paid tier
 * - PREMIUM: Advanced tier with higher limits
 * - ENTERPRISE: Unlimited for business customers
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

/**
 * Get the limits for a specific tier
 * @param tier The subscription tier
 * @returns The limits for that tier, defaults to FREE if tier is invalid
 */
export const getTierLimits = (tier?: PlanTier | string): TierLimits => {
  const normalizedTier = (tier || 'FREE').toUpperCase() as PlanTier;
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
