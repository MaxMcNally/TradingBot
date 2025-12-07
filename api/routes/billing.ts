import { Router, Response } from "express";
import { db, isPostgres } from "../initDb";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";

export const billingRouter = Router();

export type PlanTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type PaymentProvider = 'STRIPE' | 'PAYPAL' | 'SQUARE';

export const BILLING_PLANS: Array<{
  tier: PlanTier;
  name: string;
  monthlyPrice: number;
  priceCents: number;
  currency: string;
  headline: string;
  badge?: string;
  features: string[];
}> = [
  {
    tier: 'FREE',
    name: 'Free',
    monthlyPrice: 0,
    priceCents: 0,
    currency: 'USD',
    headline: 'Essential tools to get started',
    features: [
      '1 active strategy',
      'Community indicators',
      'Backtest once per day'
    ]
  },
  {
    tier: 'BASIC',
    name: 'Basic',
    monthlyPrice: 9.99,
    priceCents: 999,
    currency: 'USD',
    headline: 'Unlock automation essentials',
    features: [
      '5 active strategies',
      'Intraday backtests',
      'Email alerts'
    ],
    badge: 'Popular'
  },
  {
    tier: 'PREMIUM',
    name: 'Premium',
    monthlyPrice: 29.99,
    priceCents: 2999,
    currency: 'USD',
    headline: 'Advanced analytics & execution',
    features: [
      'Unlimited strategies',
      'Priority data refresh',
      'Advanced risk tooling'
    ]
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 199.99,
    priceCents: 19999,
    currency: 'USD',
    headline: 'Dedicated support & SLAs',
    features: [
      'Custom integrations',
      'Dedicated success manager',
      'Audit controls'
    ],
    badge: 'Best Value'
  }
];

export const PROVIDERS: PaymentProvider[] = ['STRIPE', 'PAYPAL', 'SQUARE'];

const findPlan = (tier?: string) =>
  BILLING_PLANS.find(plan => plan.tier === (tier || '').toUpperCase());

const addMonths = (date: Date, months: number) => {
  const clone = new Date(date);
  clone.setMonth(clone.getMonth() + months);
  return clone;
};

billingRouter.get('/plans', (_req, res) => {
  return res.json({
    success: true,
    plans: BILLING_PLANS,
    providers: PROVIDERS
  });
});

billingRouter.get('/subscription', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  db.get(
    isPostgres
      ? `SELECT plan_tier, plan_status, subscription_provider, subscription_payment_reference,
                subscription_started_at, subscription_renews_at, subscription_cancel_at
           FROM users WHERE id = $1`
      : `SELECT plan_tier, plan_status, subscription_provider, subscription_payment_reference,
                subscription_started_at, subscription_renews_at, subscription_cancel_at
           FROM users WHERE id = ?`,
    [userId],
    (err: any, row: any) => {
      if (err) {
        console.error('Error fetching subscription', err);
        return res.status(500).json({ error: 'Failed to load subscription' });
      }

      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }

      db.all(
        isPostgres
          ? `SELECT id, plan_tier, plan_price_cents, currency, provider, status,
                    started_at, renews_at, canceled_at, created_at
               FROM subscriptions
               WHERE user_id = $1
               ORDER BY created_at DESC
               LIMIT 10`
          : `SELECT id, plan_tier, plan_price_cents, currency, provider, status,
                    started_at, renews_at, canceled_at, created_at
               FROM subscriptions
               WHERE user_id = ?
               ORDER BY created_at DESC
               LIMIT 10`,
        [userId],
        (historyErr: any, historyRows: any[]) => {
          if (historyErr) {
            console.error('Error fetching subscription history', historyErr);
            return res.status(500).json({ error: 'Failed to load subscription history' });
          }

          return res.json({
            success: true,
            subscription: {
              planTier: row.plan_tier,
              planStatus: row.plan_status,
              provider: row.subscription_provider,
              paymentReference: row.subscription_payment_reference,
              startedAt: row.subscription_started_at,
              renewsAt: row.subscription_renews_at,
              cancelAt: row.subscription_cancel_at
            },
            history: historyRows || []
          });
        }
      );
    }
  );
});

billingRouter.post('/checkout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { planTier, provider, paymentMethod, paymentReference } = req.body as {
    planTier?: string;
    provider?: PaymentProvider;
    paymentMethod?: string;
    paymentReference?: string;
  };

  const normalizedPlan = findPlan(planTier);
  if (!normalizedPlan) {
    return res.status(400).json({ error: 'Invalid plan selection' });
  }

  if (normalizedPlan.tier !== 'FREE' && (!provider || !PROVIDERS.includes(provider))) {
    return res.status(400).json({ error: 'Valid payment provider is required' });
  }

  const nextRenewal = normalizedPlan.tier === 'FREE'
    ? null
    : addMonths(new Date(), 1).toISOString();

  const updateSql = isPostgres
    ? `UPDATE users
         SET plan_tier = $1,
             plan_status = $2,
             subscription_provider = $3,
             subscription_payment_reference = $4,
             subscription_renews_at = $5,
             subscription_started_at = COALESCE(subscription_started_at, NOW()),
             subscription_cancel_at = NULL,
             updated_at = NOW()
       WHERE id = $6`
    : `UPDATE users
         SET plan_tier = ?,
             plan_status = ?,
             subscription_provider = ?,
             subscription_payment_reference = ?,
             subscription_renews_at = ?,
             subscription_started_at = COALESCE(subscription_started_at, CURRENT_TIMESTAMP),
             subscription_cancel_at = NULL,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`;

  db.run(
    updateSql,
    [
      normalizedPlan.tier,
      'ACTIVE',
      normalizedPlan.tier === 'FREE' ? 'NONE' : provider,
      paymentReference || null,
      nextRenewal,
      userId
    ],
    function(err: any) {
      if (err) {
        console.error('Error updating subscription', err);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }

      const insertSql = isPostgres
        ? `INSERT INTO subscriptions
             (user_id, plan_tier, plan_price_cents, currency, provider, status, external_subscription_id, payment_method, started_at, renews_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)`
        : `INSERT INTO subscriptions
             (user_id, plan_tier, plan_price_cents, currency, provider, status, external_subscription_id, payment_method, started_at, renews_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`;

      const providerValue = normalizedPlan.tier === 'FREE' ? 'NONE' : provider;

      db.run(
        insertSql,
        [
          userId,
          normalizedPlan.tier,
          normalizedPlan.priceCents,
          normalizedPlan.currency,
          providerValue,
          normalizedPlan.tier === 'FREE' ? 'ACTIVE' : 'ACTIVE',
          paymentReference || null,
          paymentMethod || null,
          nextRenewal
        ],
        (historyErr: any) => {
          if (historyErr) {
            console.error('Failed to record subscription history', historyErr);
          }

          return res.json({
            success: true,
            subscription: {
              planTier: normalizedPlan.tier,
              planStatus: 'ACTIVE',
              provider: providerValue,
              renewsAt: nextRenewal,
              paymentReference: paymentReference || null
            }
          });
        }
      );
    }
  );
});

billingRouter.put('/subscription', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { action, planTier } = req.body as { action?: string; planTier?: PlanTier };
  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  const normalizedAction = action.toUpperCase();

  if (normalizedAction === 'CANCEL') {
    const cancelSql = isPostgres
      ? `UPDATE users
           SET plan_tier = 'FREE',
               plan_status = 'CANCELED',
               subscription_provider = 'NONE',
               subscription_payment_reference = NULL,
               subscription_renews_at = NULL,
               subscription_cancel_at = NOW(),
               updated_at = NOW()
         WHERE id = $1`
      : `UPDATE users
           SET plan_tier = 'FREE',
               plan_status = 'CANCELED',
               subscription_provider = 'NONE',
               subscription_payment_reference = NULL,
               subscription_renews_at = NULL,
               subscription_cancel_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`;

    db.run(cancelSql, [userId], (err: any) => {
      if (err) {
        console.error('Failed to cancel subscription', err);
        return res.status(500).json({ error: 'Failed to cancel subscription' });
      }

      const insertSql = isPostgres
        ? `INSERT INTO subscriptions
             (user_id, plan_tier, plan_price_cents, currency, provider, status, canceled_at, created_at, updated_at)
           VALUES ($1, 'FREE', 0, 'USD', 'NONE', 'CANCELED', NOW(), NOW(), NOW())`
        : `INSERT INTO subscriptions
             (user_id, plan_tier, plan_price_cents, currency, provider, status, canceled_at, created_at, updated_at)
           VALUES (?, 'FREE', 0, 'USD', 'NONE', 'CANCELED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;

      db.run(insertSql, [userId], (historyErr: any) => {
        if (historyErr) {
          console.error('Failed to record cancellation history', historyErr);
        }

        return res.json({
          success: true,
          subscription: {
            planTier: 'FREE',
            planStatus: 'CANCELED',
            provider: 'NONE'
          }
        });
      });
    });

    return;
  }

  if (normalizedAction === 'SWITCH') {
    if (!planTier) {
      return res.status(400).json({ error: 'Plan tier is required to switch' });
    }

    if (planTier !== 'FREE') {
      return res.status(400).json({ error: 'Use checkout to switch to paid plans' });
    }

    const switchSql = isPostgres
      ? `UPDATE users
           SET plan_tier = 'FREE',
               plan_status = 'ACTIVE',
               subscription_provider = 'NONE',
               subscription_payment_reference = NULL,
               subscription_renews_at = NULL,
               subscription_cancel_at = NULL,
               updated_at = NOW()
         WHERE id = $1`
      : `UPDATE users
           SET plan_tier = 'FREE',
               plan_status = 'ACTIVE',
               subscription_provider = 'NONE',
               subscription_payment_reference = NULL,
               subscription_renews_at = NULL,
               subscription_cancel_at = NULL,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`;

    db.run(switchSql, [userId], (err: any) => {
      if (err) {
        console.error('Failed to switch plan', err);
        return res.status(500).json({ error: 'Failed to update plan' });
      }

      const insertSql = isPostgres
        ? `INSERT INTO subscriptions
             (user_id, plan_tier, plan_price_cents, currency, provider, status, started_at, created_at, updated_at)
           VALUES ($1, 'FREE', 0, 'USD', 'NONE', 'ACTIVE', NOW(), NOW(), NOW())`
        : `INSERT INTO subscriptions
             (user_id, plan_tier, plan_price_cents, currency, provider, status, started_at, created_at, updated_at)
           VALUES (?, 'FREE', 0, 'USD', 'NONE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;

      db.run(insertSql, [userId], (historyErr: any) => {
        if (historyErr) {
          console.error('Failed to record switch history', historyErr);
        }

        return res.json({
          success: true,
          subscription: {
            planTier: 'FREE',
            planStatus: 'ACTIVE',
            provider: 'NONE'
          }
        });
      });
    });

    return;
  }

  return res.status(400).json({ error: 'Unsupported action' });
});

export default billingRouter;
