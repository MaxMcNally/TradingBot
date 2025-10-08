import { Migration } from '../migration-system';

export const migration: Migration = {
  version: '1.0.1',
  name: 'add-user-preferences',
  description: 'Add user preferences table for storing user-specific settings',
  
  async up(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          preference_key TEXT NOT NULL,
          preference_value TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, preference_key)
        )
      `);
      
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
        ON user_preferences(user_id)
      `);
    } else {
      return new Promise((resolve, reject) => {
        db.run(`
          CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            preference_key TEXT NOT NULL,
            preference_value TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, preference_key)
          )
        `, (err: any) => {
          if (err) reject(err);
          else {
            db.run(`
              CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
              ON user_preferences(user_id)
            `, (err: any) => {
              if (err) reject(err);
              else resolve();
            });
          }
        });
      });
    }
  },
  
  async down(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      await db.query('DROP TABLE IF EXISTS user_preferences');
    } else {
      return new Promise((resolve, reject) => {
        db.run('DROP TABLE IF EXISTS user_preferences', (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
};
