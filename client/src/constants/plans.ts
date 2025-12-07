import { PlanTier } from "../types/user";

export const PLAN_TIER_SEQUENCE: PlanTier[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];

export const getNextPlanTier = (tier?: PlanTier | null): PlanTier | null => {
  if (!tier) return null;
  const index = PLAN_TIER_SEQUENCE.indexOf(tier);
  if (index === -1 || index + 1 >= PLAN_TIER_SEQUENCE.length) {
    return null;
  }
  return PLAN_TIER_SEQUENCE[index + 1];
};
