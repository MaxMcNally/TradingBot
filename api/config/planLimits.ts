import { PlanTier, PLAN_TIER_SEQUENCE } from '../types/plan';

export interface PlanBotLimits {
  /**
   * Maximum number of bots a user can have running simultaneously.
   */
  maxActiveBots: number;
  /**
   * Maximum number of bots a user can configure/save overall.
   * This mirrors maxActiveBots for now but lives separately for future flexibility.
   */
  maxConfiguredBots: number;
}

export const PLAN_BOT_LIMITS: Record<PlanTier, PlanBotLimits> = {
  FREE: {
    maxActiveBots: 1,
    maxConfiguredBots: 1
  },
  BASIC: {
    maxActiveBots: 5,
    maxConfiguredBots: 5
  },
  PREMIUM: {
    maxActiveBots: 25,
    maxConfiguredBots: 25
  },
  ENTERPRISE: {
    maxActiveBots: 50,
    maxConfiguredBots: 50
  }
};

export const getPlanLimits = (tier?: string | null): PlanBotLimits => {
  if (tier && (PLAN_TIER_SEQUENCE as string[]).includes(tier)) {
    return PLAN_BOT_LIMITS[tier as PlanTier];
  }
  return PLAN_BOT_LIMITS.FREE;
};

export const getNextPlanTier = (currentTier: PlanTier): PlanTier | null => {
  const currentIndex = PLAN_TIER_SEQUENCE.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex + 1 >= PLAN_TIER_SEQUENCE.length) {
    return null;
  }
  return PLAN_TIER_SEQUENCE[currentIndex + 1];
};

export const findPlanWithCapacity = (requiredActiveBots: number): PlanTier | null => {
  return PLAN_TIER_SEQUENCE.find(
    tier => PLAN_BOT_LIMITS[tier].maxActiveBots >= requiredActiveBots
  ) ?? null;
};
