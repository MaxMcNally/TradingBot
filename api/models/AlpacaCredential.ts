import { db, isPostgres } from "../initDb";
import { decryptSecret, encryptSecret } from "../utils/secretManager";

export interface AlpacaCredentialRecord {
  id?: number;
  user_id: number;
  encrypted_key: string;
  encrypted_secret: string;
  key_last4?: string | null;
  is_paper_only: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DecryptedAlpacaCredential {
  apiKey: string;
  apiSecret: string;
  keyLastFour?: string | null;
  isPaperOnly: boolean;
}

const withPlaceholders = (sql: string): string => {
  if (isPostgres) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  }
  return sql;
};

const mapRow = (row?: any): AlpacaCredentialRecord | null => {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    encrypted_key: row.encrypted_key,
    encrypted_secret: row.encrypted_secret,
    key_last4: row.key_last4,
    is_paper_only: typeof row.is_paper_only === "boolean"
      ? row.is_paper_only
      : Number(row.is_paper_only) === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export class AlpacaCredential {
  static async upsert(userId: number, data: { apiKey: string; apiSecret: string; isPaperOnly?: boolean }): Promise<AlpacaCredentialRecord> {
    const encryptedKey = encryptSecret(data.apiKey.trim());
    const encryptedSecret = encryptSecret(data.apiSecret.trim());
    const keyLast4 = data.apiKey.slice(-4);
    const isPaper = data.isPaperOnly !== false;
    const nowFn = isPostgres ? "NOW()" : "CURRENT_TIMESTAMP";

    const sql = withPlaceholders(`
      INSERT INTO alpaca_credentials (user_id, encrypted_key, encrypted_secret, key_last4, is_paper_only, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ${nowFn}, ${nowFn})
      ON CONFLICT(user_id) DO UPDATE SET
        encrypted_key = excluded.encrypted_key,
        encrypted_secret = excluded.encrypted_secret,
        key_last4 = excluded.key_last4,
        is_paper_only = excluded.is_paper_only,
        updated_at = ${nowFn}
    `);

    await new Promise<void>((resolve, reject) => {
      db.run(
        sql,
        [userId, encryptedKey, encryptedSecret, keyLast4, isPaper ? 1 : 0],
        function(err: Error | null) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });

    const updated = await this.getByUser(userId);
    if (!updated) {
      throw new Error("Failed to persist Alpaca credentials");
    }
    return updated;
  }

  static async getByUser(userId: number): Promise<AlpacaCredentialRecord | null> {
    const sql = withPlaceholders(`
      SELECT id, user_id, encrypted_key, encrypted_secret, key_last4, is_paper_only, created_at, updated_at
      FROM alpaca_credentials
      WHERE user_id = ?
      LIMIT 1
    `);

    return new Promise((resolve, reject) => {
      db.get(sql, [userId], (err: Error | null, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(mapRow(row));
        }
      });
    });
  }

  static async deleteForUser(userId: number): Promise<void> {
    const sql = withPlaceholders(`DELETE FROM alpaca_credentials WHERE user_id = ?`);
    await new Promise<void>((resolve, reject) => {
      db.run(sql, [userId], function(err: Error | null) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static async getDecryptedCredentials(userId: number): Promise<DecryptedAlpacaCredential | null> {
    const record = await this.getByUser(userId);
    if (!record) {
      return null;
    }
    return {
      apiKey: decryptSecret(record.encrypted_key),
      apiSecret: decryptSecret(record.encrypted_secret),
      keyLastFour: record.key_last4 || undefined,
      isPaperOnly: record.is_paper_only,
    };
  }
}

export default AlpacaCredential;
