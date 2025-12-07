export type PlanTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type PlanStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
export type SubscriptionProvider = 'NONE' | 'STRIPE' | 'PAYPAL' | 'SQUARE';
export type CheckoutProvider = Exclude<SubscriptionProvider, 'NONE'>;

export interface AppUser {
  id: number | string;
  email: string;
  name?: string;
  username?: string;
  email_verified?: number;
  two_factor_enabled?: number;
  role?: 'USER' | 'ADMIN';
  createdAt?: string;
  updatedAt?: string;
  plan_tier?: PlanTier;
  plan_status?: PlanStatus;
  subscription_provider?: SubscriptionProvider;
  subscription_renews_at?: string | null;
}
