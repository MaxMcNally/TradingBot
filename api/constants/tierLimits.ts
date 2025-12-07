import { PlanTier } from '../routes/billing';

/**
 * Maximum number of active bots (strategies) allowed per tier
 * These values are configurable constants that can be adjusted as needed
 */
export const TIER_BOT_LIMITS: Record<PlanTier, number> = {
  FREE: 1,
  BASIC: 5,
  PREMIUM: 25,
  ENTERPRISE: 50, // Enterprise tier gets 50 bots
};

/**
 * Get the bot limit for a given tier
 * @param tier - The plan tier
 * @returns The maximum number of active bots allowed for the tier
 */
export const getBotLimitForTier = (tier: PlanTier | string | undefined): number => {
  if (!tier) {
    return TIER_BOT_LIMITS.FREE;
  }
  
  const normalizedTier = tier.toUpperCase() as PlanTier;
  return TIER_BOT_LIMITS[normalizedTier] || TIER_BOT_LIMITS.FREE;
};
