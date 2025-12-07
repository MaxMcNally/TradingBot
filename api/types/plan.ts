export type PlanTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

export const PLAN_TIER_SEQUENCE: PlanTier[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];

export const isPlanTier = (tier?: string): tier is PlanTier =>
  tier !== undefined && (PLAN_TIER_SEQUENCE as string[]).includes(tier);
