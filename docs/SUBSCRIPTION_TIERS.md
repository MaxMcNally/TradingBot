# Subscription Tiers & Bot Limits

This document describes the subscription tier system, bot limits, and how to configure them.

## Overview

TradingBot offers four subscription tiers, each with different limits and features:

| Tier | Monthly Price | Max Bots | Max Running Bots | Best For |
|------|--------------|----------|------------------|----------|
| **Free** | $0 | 5 | 1 | Getting started, learning |
| **Basic** | $9.99 | 15 | 5 | Active individual traders |
| **Premium** | $29.99 | 50 | 25 | Serious traders, small teams |
| **Enterprise** | $199.99 | Unlimited | Unlimited | Professional operations |

## Tier Details

### 🆓 Free Tier

**Perfect for getting started with automated trading**

The Free tier is designed for users who want to explore automated trading without any commitment.

**Limits:**
- Create up to **5 trading bots**
- Run **1 bot** at a time

**Features:**
- ✅ Access to basic trading strategies (Moving Average, Bollinger Bands, Mean Reversion)
- ✅ Daily backtest capabilities
- ✅ Web dashboard access
- ✅ Community support & tutorials
- ✅ Paper trading mode

**Best for:**
- New users learning automated trading
- Testing strategies before committing
- Hobbyist traders

---

### 💼 Basic Tier - $9.99/month

**Ideal for active traders seeking automation**

The Basic tier unlocks more bots and simultaneous execution, perfect for traders ready to scale up.

**Limits:**
- Create up to **15 trading bots**
- Run **5 bots** simultaneously

**Features:**
- ✅ Everything in Free tier
- ✅ Unlimited intraday backtests
- ✅ Email alerts & notifications
- ✅ Advanced technical indicators
- ✅ Historical data access
- ✅ Email support (24hr response)

**Best for:**
- Active individual traders
- Users testing multiple strategies
- Traders who need alert notifications

---

### 🚀 Premium Tier - $29.99/month

**For serious traders who demand the best**

The Premium tier provides professional-grade features for traders who need advanced capabilities.

**Limits:**
- Create up to **50 trading bots**
- Run **25 bots** simultaneously

**Features:**
- ✅ Everything in Basic tier
- ✅ Priority data refresh (real-time)
- ✅ Advanced risk management tools
- ✅ Portfolio analytics dashboard
- ✅ API access for custom integrations
- ✅ Webhook notifications
- ✅ Priority support (4hr response)

**Best for:**
- Serious traders managing multiple strategies
- Small trading teams
- Developers building custom integrations

---

### 🏢 Enterprise Tier - $199.99/month

**Complete solution for professional trading operations**

The Enterprise tier removes all limits and provides dedicated support for professional operations.

**Limits:**
- **Unlimited** trading bots
- **Unlimited** concurrent bot execution

**Features:**
- ✅ Everything in Premium tier
- ✅ Custom integrations & white-labeling
- ✅ Dedicated success manager
- ✅ Compliance & audit controls
- ✅ SSO & advanced security
- ✅ Custom reporting & analytics
- ✅ 24/7 priority support with SLA
- ✅ Custom strategy development assistance

**Best for:**
- Professional trading firms
- Hedge funds
- Financial institutions
- Large trading teams

---

## Bot Limits Explained

### What is a "Bot"?

A bot (also called a strategy) is a saved trading configuration that can be executed to perform automated trades. Each bot contains:
- Strategy type (e.g., Moving Average Crossover)
- Configuration parameters
- Trading symbols
- Risk management settings

### What is "Max Bots"?

This is the maximum number of bots/strategies you can create and save in your account. This includes both active and inactive bots.

### What is "Max Running Bots"?

This is the maximum number of bots that can execute trades simultaneously. A "running" bot is one that has an active trading session.

---

## Configuration

### Backend Configuration

Bot limits are configured in `/api/constants/botLimits.ts`:

```typescript
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
```

### Database Configuration

Admins can also configure tier limits through the database. The `subscription_tiers` table stores:

| Column | Type | Description |
|--------|------|-------------|
| tier | TEXT | Tier identifier (FREE, BASIC, PREMIUM, ENTERPRISE) |
| name | TEXT | Display name |
| monthly_price | DECIMAL | Price in dollars |
| price_cents | INTEGER | Price in cents |
| max_bots | INTEGER | Max bots limit (-1 for unlimited) |
| max_running_bots | INTEGER | Max running bots (-1 for unlimited) |
| features | JSONB | Array of feature strings |
| is_active | BOOLEAN | Whether tier is available |

### Admin Dashboard

Admins can manage subscription tiers through the admin dashboard:

1. Navigate to **Admin** → **Subscription Management**
2. View all tiers with current limits and user counts
3. Edit tier limits, prices, and features
4. View subscription statistics and revenue

---

## API Endpoints

### Get User Limits

```http
GET /api/billing/limits
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "planTier": "BASIC",
  "limits": {
    "maxBots": 15,
    "maxRunningBots": 5,
    "displayName": "Basic"
  },
  "usage": {
    "totalBots": 8,
    "runningBots": 2
  },
  "canCreateBot": true,
  "canRunBot": true,
  "botsRemaining": 7,
  "runningBotsRemaining": 3
}
```

### Get Billing Plans

```http
GET /api/billing/plans
```

Returns all available subscription plans with their limits and features.

### Admin: Get Subscription Stats

```http
GET /api/admin/subscriptions/stats
Authorization: Bearer <admin-token>
```

Returns subscription statistics including user counts per tier and revenue.

### Admin: Update Tier

```http
PUT /api/admin/subscriptions/tiers/:tier
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "max_bots": 20,
  "max_running_bots": 10,
  "monthly_price": 14.99,
  "features": ["Feature 1", "Feature 2"]
}
```

---

## Error Handling

When a user exceeds their limits, the API returns specific error codes:

### Bot Creation Limit Exceeded

```json
{
  "message": "You have reached the maximum number of bots (5) for your Free plan. Upgrade to create more bots.",
  "error": "BOT_LIMIT_EXCEEDED",
  "limitInfo": {
    "currentCount": 5,
    "maxAllowed": 5,
    "planTier": "FREE"
  }
}
```

### Running Bot Limit Exceeded

```json
{
  "message": "You have reached the maximum number of running bots (1) for your Free plan. Upgrade to run more bots simultaneously.",
  "error": "RUNNING_BOT_LIMIT_EXCEEDED",
  "limitInfo": {
    "currentCount": 1,
    "maxAllowed": 1,
    "planTier": "FREE"
  }
}
```

---

## Frontend Integration

### Using the useSubscription Hook

```typescript
import { useSubscription } from './hooks';

const MyComponent = () => {
  const { limits, usage, plans } = useSubscription();

  const canCreateBot = usage?.canCreateBot ?? true;
  const botsRemaining = usage?.botsRemaining ?? -1;

  return (
    <div>
      <p>Bots: {usage?.totalBots} / {limits?.maxBots === -1 ? '∞' : limits?.maxBots}</p>
      <p>Running: {usage?.runningBots} / {limits?.maxRunningBots === -1 ? '∞' : limits?.maxRunningBots}</p>
      {!canCreateBot && <UpsellDialog />}
    </div>
  );
};
```

### UpsellDialog Component

When users hit their limits, show the UpsellDialog to encourage upgrades:

```typescript
import { UpsellDialog } from './components/shared';

<UpsellDialog
  open={showUpsell}
  onClose={() => setShowUpsell(false)}
  type="bot_creation"
  currentTier={subscription?.planTier || 'FREE'}
  currentLimits={limits}
  currentUsage={usage}
  recommendedPlans={plans}
/>
```

---

## Upgrading/Downgrading

### Upgrading

Users can upgrade at any time through the Pricing page. The new limits take effect immediately.

### Downgrading

When downgrading:
- Existing bots are preserved
- Users cannot create new bots if over the new limit
- Running bots continue until stopped, but new sessions cannot start if over limit

---

## Best Practices

1. **Monitor Usage**: Use the `/billing/limits` endpoint to show users their current usage
2. **Proactive Upselling**: Show upgrade prompts when users approach their limits (e.g., at 80%)
3. **Clear Communication**: Always explain why an action was blocked due to limits
4. **Graceful Degradation**: When downgrading, don't delete user data, just prevent new creation

---

## Support

For questions about subscription tiers or limits:
- **Free/Basic users**: community@tradingbot.com
- **Premium users**: support@tradingbot.com (4hr response)
- **Enterprise users**: enterprise@tradingbot.com (24/7 support)
