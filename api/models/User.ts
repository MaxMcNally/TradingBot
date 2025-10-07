import { db } from '../initDb';

export interface UserData {
  id?: number;
  username: string;
  password_hash: string;
  email?: string;
  email_verified?: number; // 0 or 1
  email_verification_token?: string | null;
  email_verification_sent_at?: string | null;
  two_factor_enabled?: number; // 0 or 1
  two_factor_secret?: string | null;
  password_reset_token?: string | null;
  password_reset_expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export class User {
  static async findOne(where: { username: string; password?: string }): Promise<UserData | null> {
    return new Promise((resolve, reject) => {
      const { username, password } = where;
      let query = 'SELECT * FROM users WHERE username = ?';
      const params: any[] = [username];
      
      if (password) {
        query += ' AND password_hash = ?';
        params.push(password);
      }
      
      db.get(query, params, (err, row: any) => {
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
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row: any) => {
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
      const { username, password_hash, email } = userData;
      db.run(
        'INSERT INTO users (username, password_hash, email, email_verified, two_factor_enabled) VALUES (?, ?, ?, 0, 0)',
        [username, password_hash, email],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              username,
              password_hash,
              email,
              email_verified: 0,
              two_factor_enabled: 0,
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
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row: any) => {
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
