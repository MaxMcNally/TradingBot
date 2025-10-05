import { db } from '../initDb';
import User, { UserData } from './User';

export interface SettingsData {
  id?: number;
  user_id: number;
  key: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithSettings extends UserData {
  Settings?: SettingsData;
}

export class Settings {
  static async upsert(settingsData: { UserId: number; [key: string]: any }): Promise<[SettingsData, boolean]> {
    return new Promise((resolve, reject) => {
      const { UserId, ...settings } = settingsData;
      
      // For each setting key-value pair, upsert it
      const promises = Object.entries(settings).map(([key, value]) => {
        return new Promise<void>((resolveSetting, rejectSetting) => {
          // First, try to update existing setting
          db.run(
            'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND key = ?',
            [value, UserId, key],
            function(err) {
              if (err) {
                rejectSetting(err);
                return;
              }
              
              // If no rows were affected, insert new setting
              if (this.changes === 0) {
                db.run(
                  'INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)',
                  [UserId, key, value],
                  function(insertErr) {
                    if (insertErr) {
                      rejectSetting(insertErr);
                    } else {
                      resolveSetting();
                    }
                  }
                );
              } else {
                resolveSetting();
              }
            }
          );
        });
      });
      
      Promise.all(promises)
        .then(() => {
          // Return the first setting as a representative result
          const firstKey = Object.keys(settings)[0];
          const firstValue = settings[firstKey];
          resolve([{
            user_id: UserId,
            key: firstKey,
            value: firstValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, true]);
        })
        .catch(reject);
    });
  }

  static async findByUserId(userId: number): Promise<SettingsData[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM settings WHERE user_id = ?', [userId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async findOne(where: { user_id: number; key: string }): Promise<SettingsData | null> {
    return new Promise((resolve, reject) => {
      const { user_id, key } = where;
      db.get('SELECT * FROM settings WHERE user_id = ? AND key = ?', [user_id, key], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }
}

// Extend User class to include settings relationship
export class UserWithSettings extends User {
  static async findOneWithSettings(where: { username: string }): Promise<UserWithSettings | null> {
    return new Promise((resolve, reject) => {
      const { username } = where;
      
      // First get the user
      User.findByUsername(username)
        .then(user => {
          if (!user) {
            resolve(null);
            return;
          }
          
          // Then get their settings
          Settings.findByUserId(user.id!)
            .then(settings => {
              const userWithSettings: UserWithSettings = {
                ...user,
                Settings: settings.length > 0 ? settings[0] : undefined
              };
              resolve(userWithSettings);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }
}

export default Settings;
