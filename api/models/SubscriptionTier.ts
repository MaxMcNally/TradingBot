import { db } from '../initDb';

export interface SubscriptionTierData {
  id?: number;
  tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  name: string;
  monthly_price: number;
  price_cents: number;
  currency: string;
  headline?: string;
  badge?: string;
  max_bots: number;
  max_running_bots: number;
  features: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateSubscriptionTierData {
  name?: string;
  monthly_price?: number;
  price_cents?: number;
  currency?: string;
  headline?: string;
  badge?: string | null;
  max_bots?: number;
  max_running_bots?: number;
  features?: string[];
  is_active?: boolean;
}

export class SubscriptionTier {
  static async findAll(): Promise<SubscriptionTierData[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM subscription_tiers ORDER BY price_cents ASC',
        [],
        (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve((rows || []).map(row => this.parseRow(row)));
        }
      );
    });
  }

  static async findByTier(tier: string): Promise<SubscriptionTierData | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM subscription_tiers WHERE tier = $1',
        [tier.toUpperCase()],
        (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row ? this.parseRow(row) : null);
        }
      );
    });
  }

  static async findById(id: number): Promise<SubscriptionTierData | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM subscription_tiers WHERE id = $1',
        [id],
        (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row ? this.parseRow(row) : null);
        }
      );
    });
  }

  static async update(tier: string, data: UpdateSubscriptionTierData): Promise<SubscriptionTierData | null> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.monthly_price !== undefined) {
        fields.push(`monthly_price = $${paramIndex++}`);
        values.push(data.monthly_price);
      }
      if (data.price_cents !== undefined) {
        fields.push(`price_cents = $${paramIndex++}`);
        values.push(data.price_cents);
      }
      if (data.currency !== undefined) {
        fields.push(`currency = $${paramIndex++}`);
        values.push(data.currency);
      }
      if (data.headline !== undefined) {
        fields.push(`headline = $${paramIndex++}`);
        values.push(data.headline);
      }
      if (data.badge !== undefined) {
        fields.push(`badge = $${paramIndex++}`);
        values.push(data.badge);
      }
      if (data.max_bots !== undefined) {
        fields.push(`max_bots = $${paramIndex++}`);
        values.push(data.max_bots);
      }
      if (data.max_running_bots !== undefined) {
        fields.push(`max_running_bots = $${paramIndex++}`);
        values.push(data.max_running_bots);
      }
      if (data.features !== undefined) {
        fields.push(`features = $${paramIndex++}`);
        values.push(JSON.stringify(data.features));
      }
      if (data.is_active !== undefined) {
        fields.push(`is_active = $${paramIndex++}`);
        values.push(data.is_active);
      }

      if (fields.length === 0) {
        return resolve(null);
      }

      fields.push(`updated_at = NOW()`);
      values.push(tier.toUpperCase());

      const query = `UPDATE subscription_tiers SET ${fields.join(', ')} WHERE tier = $${paramIndex}`;

      db.run(query, values, function(this: any, err: any) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          SubscriptionTier.findByTier(tier).then(resolve).catch(reject);
        }
      });
    });
  }

  static async getLimitsForTier(tier: string): Promise<{ maxBots: number; maxRunningBots: number; displayName: string }> {
    const tierData = await this.findByTier(tier);
    if (!tierData) {
      // Return default FREE limits if tier not found
      return { maxBots: 5, maxRunningBots: 1, displayName: 'Free' };
    }
    return {
      maxBots: tierData.max_bots,
      maxRunningBots: tierData.max_running_bots,
      displayName: tierData.name
    };
  }

  static async getActiveTiers(): Promise<SubscriptionTierData[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM subscription_tiers WHERE is_active = TRUE ORDER BY price_cents ASC',
        [],
        (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve((rows || []).map(row => this.parseRow(row)));
        }
      );
    });
  }

  private static parseRow(row: any): SubscriptionTierData {
    return {
      ...row,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features || [],
      monthly_price: parseFloat(row.monthly_price) || 0
    };
  }
}

export default SubscriptionTier;
