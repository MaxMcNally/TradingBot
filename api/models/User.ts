import { db } from '../initDb';

export interface UserData {
  id?: number;
  username: string;
  password_hash: string;
  email?: string;
  email_verified?: number | boolean;
  email_verification_token?: string | null;
  email_verification_sent_at?: string | null;
  two_factor_enabled?: number | boolean;
  two_factor_secret?: string | null;
  password_reset_token?: string | null;
  password_reset_expires_at?: string | null;
  role?: 'USER' | 'ADMIN';
  plan_tier?: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  plan_status?: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
  subscription_provider?: 'NONE' | 'STRIPE' | 'PAYPAL' | 'SQUARE';
  subscription_payment_reference?: string | null;
  subscription_started_at?: string | null;
  subscription_renews_at?: string | null;
  subscription_cancel_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export class User {
  static async findOne(where: { username: string; password?: string }): Promise<UserData | null> {
    return new Promise((resolve, reject) => {
      const { username, password } = where;
      let query = 'SELECT * FROM users WHERE username = $1';
      const params: any[] = [username];
      
      if (password) {
        query += ' AND password_hash = $2';
        params.push(password);
      }
      
      db.get(query, params, (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async findByUsername(username: string): Promise<UserData | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = $1', [username], (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async create(userData: Omit<UserData, 'id' | 'created_at' | 'updated_at'>): Promise<UserData> {
    return new Promise((resolve, reject) => {
      const {
        username,
        password_hash,
        email,
        role = 'USER',
        plan_tier = 'FREE',
        plan_status = 'ACTIVE',
        subscription_provider = 'NONE'
      } = userData;
      db.run(
        'INSERT INTO users (username, password_hash, email, email_verified, two_factor_enabled, role, plan_tier, plan_status, subscription_provider) VALUES ($1, $2, $3, FALSE, FALSE, $4, $5, $6, $7)',
        [username, password_hash, email, role, plan_tier, plan_status, subscription_provider],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              username,
              password_hash,
              email,
              email_verified: false,
              two_factor_enabled: false,
              role,
              plan_tier,
              plan_status,
              subscription_provider,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      );
    });
  }

  static async findById(id: number): Promise<UserData | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = $1', [id], (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }
}

export default User;
