import { db } from '../initDb';
import crypto from 'crypto';

export interface ApiKeyData {
  id?: number;
  user_id: number;
  key_name: string;
  api_key: string; // Hashed key
  api_secret: string; // Hashed secret
  key_prefix: string; // First 8 chars of the key for display
  last_used_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateApiKeyData {
  user_id: number;
  key_name: string;
}

export interface ApiKeyWithSecret {
  id: number;
  key_name: string;
  api_key: string; // Full key (only shown once)
  api_secret: string; // Full secret (only shown once)
  key_prefix: string;
  created_at: string;
}

export class ApiKey {
  static generateKey(): string {
    return `tb_${crypto.randomBytes(32).toString('hex')}`;
  }

  static generateSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  static hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  static hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  static async create(apiKeyData: CreateApiKeyData): Promise<ApiKeyWithSecret> {
    return new Promise((resolve, reject) => {
      const { user_id, key_name } = apiKeyData;
      
      const apiKey = this.generateKey();
      const apiSecret = this.generateSecret();
      const keyPrefix = apiKey.substring(0, 8);
      const hashedKey = this.hashKey(apiKey);
      const hashedSecret = this.hashSecret(apiSecret);

      const query = `
        INSERT INTO api_keys (user_id, key_name, api_key, api_secret, key_prefix, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;

      db.run(
        query,
        [user_id, key_name, hashedKey, hashedSecret, keyPrefix],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            // Fetch the created row to get created_at
            db.get(
              'SELECT id, key_name, key_prefix, created_at FROM api_keys WHERE id = $1',
              [this.lastID],
              (fetchErr: any, row: any) => {
                if (fetchErr) {
                  reject(fetchErr);
                } else {
                  resolve({
                    id: row.id,
                    key_name: row.key_name,
                    api_key: apiKey, // Return unhashed key only once
                    api_secret: apiSecret, // Return unhashed secret only once
                    key_prefix: row.key_prefix,
                    created_at: row.created_at || new Date().toISOString()
                  });
                }
              }
            );
          }
        }
      );
    });
  }

  static async findByKey(apiKey: string): Promise<ApiKeyData | null> {
    return new Promise((resolve, reject) => {
      const hashedKey = this.hashKey(apiKey);
      db.get(
        'SELECT * FROM api_keys WHERE api_key = $1',
        [hashedKey],
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

  static async findByUserId(userId: number): Promise<ApiKeyData[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT id, key_name, key_prefix, last_used_at, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
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

  static async findById(id: number): Promise<ApiKeyData | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM api_keys WHERE id = $1',
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

  static async delete(id: number, userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM api_keys WHERE id = $1 AND user_id = $2',
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

  static async updateLastUsed(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE api_keys SET last_used_at = NOW(), updated_at = NOW() WHERE id = $1',
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

  static verifyKey(apiKey: string, hashedKey: string): boolean {
    return this.hashKey(apiKey) === hashedKey;
  }

  static verifySecret(apiSecret: string, hashedSecret: string): boolean {
    return this.hashSecret(apiSecret) === hashedSecret;
  }
}

export default ApiKey;

