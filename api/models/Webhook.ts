import { db } from '../initDb';

export type WebhookEventType = 'bot.started' | 'bot.finished' | 'bot.error' | 'trade.executed';

export interface WebhookData {
  id?: number;
  user_id: number;
  url: string;
  event_types: string; // JSON array of event types
  secret?: string | null; // Optional webhook secret for signing
  is_active: boolean;
  last_triggered_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWebhookData {
  user_id: number;
  url: string;
  event_types: WebhookEventType[];
  secret?: string;
}

export class Webhook {
  static async create(webhookData: CreateWebhookData): Promise<WebhookData> {
    return new Promise((resolve, reject) => {
      const { user_id, url, event_types, secret } = webhookData;
      const eventTypesJson = JSON.stringify(event_types);

      const query = `
        INSERT INTO webhooks (user_id, url, event_types, secret, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
        RETURNING id
      `;

      db.run(
        query,
        [user_id, url, eventTypesJson, secret || null],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              user_id,
              url,
              event_types: eventTypesJson,
              secret: secret || null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      );
    });
  }

  static async findByUserId(userId: number): Promise<WebhookData[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC',
        [userId],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  static async findById(id: number): Promise<WebhookData | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM webhooks WHERE id = $1',
        [id],
        (err: any, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  }

  static async findByUserIdAndEventType(userId: number, eventType: WebhookEventType): Promise<WebhookData[]> {
    return new Promise((resolve, reject) => {
      // For Postgres JSONB, we check if the event_type is in the array
      // event_types is stored as JSON array, so we use @> (contains) operator
      db.all(
        `SELECT * FROM webhooks 
         WHERE user_id = $1 
         AND is_active = TRUE 
         AND event_types::jsonb @> $2::jsonb
         ORDER BY created_at DESC`,
        [userId, JSON.stringify([eventType])],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  static async update(id: number, userId: number, updates: Partial<CreateWebhookData>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const updatesList: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.url !== undefined) {
        updatesList.push(`url = $${paramIndex++}`);
        values.push(updates.url);
      }
      if (updates.event_types !== undefined) {
        updatesList.push(`event_types = $${paramIndex++}`);
        values.push(JSON.stringify(updates.event_types));
      }
      if (updates.secret !== undefined) {
        updatesList.push(`secret = $${paramIndex++}`);
        values.push(updates.secret);
      }

      updatesList.push(`updated_at = NOW()`);
      values.push(id, userId);

      const query = `
        UPDATE webhooks 
        SET ${updatesList.join(', ')}
        WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      `;

      db.run(query, values, function(this: any, err: any) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static async toggleActive(id: number, userId: number, isActive: boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE webhooks SET is_active = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
        [isActive, id, userId],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM webhooks WHERE id = $1 AND user_id = $2',
        [id, userId],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  static async updateLastTriggered(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE webhooks SET last_triggered_at = NOW(), updated_at = NOW() WHERE id = $1',
        [id],
        (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}

export default Webhook;

