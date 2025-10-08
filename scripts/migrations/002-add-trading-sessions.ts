import { Migration } from '../migration-system';

export const migration: Migration = {
  version: '1.0.2',
  name: 'add-trading-sessions',
  description: 'Add trading sessions table for tracking live trading sessions',
  
  async up(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS trading_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          strategy_id INTEGER,
          session_name TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'STOPPED', 'ERROR')),
          start_time TIMESTAMP DEFAULT NOW(),
          end_time TIMESTAMP,
          initial_capital DOUBLE PRECISION NOT NULL,
          current_capital DOUBLE PRECISION NOT NULL,
          total_trades INTEGER DEFAULT 0,
          winning_trades INTEGER DEFAULT 0,
          losing_trades INTEGER DEFAULT 0,
          config TEXT NOT NULL,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_trading_sessions_user_id 
        ON trading_sessions(user_id)
      `);
      
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_trading_sessions_status 
        ON trading_sessions(status)
      `);
    } else {
      return new Promise((resolve, reject) => {
        db.run(`
          CREATE TABLE IF NOT EXISTS trading_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            strategy_id INTEGER,
            session_name TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'STOPPED', 'ERROR')),
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME,
            initial_capital REAL NOT NULL,
            current_capital REAL NOT NULL,
            total_trades INTEGER DEFAULT 0,
            winning_trades INTEGER DEFAULT 0,
            losing_trades INTEGER DEFAULT 0,
            config TEXT NOT NULL,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `, (err: any) => {
          if (err) reject(err);
          else {
            const indexes = [
              'CREATE INDEX IF NOT EXISTS idx_trading_sessions_user_id ON trading_sessions(user_id)',
              'CREATE INDEX IF NOT EXISTS idx_trading_sessions_status ON trading_sessions(status)'
            ];
            
            let completed = 0;
            indexes.forEach(indexSql => {
              db.run(indexSql, (err: any) => {
                if (err) reject(err);
                else {
                  completed++;
                  if (completed === indexes.length) resolve();
                }
              });
            });
          }
        });
      });
    }
  },
  
  async down(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      await db.query('DROP TABLE IF EXISTS trading_sessions');
    } else {
      return new Promise((resolve, reject) => {
        db.run('DROP TABLE IF EXISTS trading_sessions', (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
};
