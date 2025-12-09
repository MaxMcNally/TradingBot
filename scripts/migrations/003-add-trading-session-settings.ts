import { Migration } from '../migration-system';

export const migration: Migration = {
  version: '1.0.3',
  name: 'add-trading-session-settings',
  description: 'Add trading session settings table for configurable session parameters',
  
  async up(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS trading_session_settings (
          id SERIAL PRIMARY KEY,
          session_id INTEGER NOT NULL REFERENCES trading_sessions(id) ON DELETE CASCADE,
          
          -- Risk Management
          stop_loss_percentage DOUBLE PRECISION,
          take_profit_percentage DOUBLE PRECISION,
          max_position_size_percentage DOUBLE PRECISION DEFAULT 25.0,
          max_daily_loss_percentage DOUBLE PRECISION,
          max_daily_loss_absolute DOUBLE PRECISION,
          
          -- Order Execution
          time_in_force TEXT NOT NULL DEFAULT 'day' CHECK (time_in_force IN ('day', 'gtc', 'opg', 'cls', 'ioc', 'fok')),
          allow_partial_fills BOOLEAN DEFAULT TRUE,
          extended_hours BOOLEAN DEFAULT FALSE,
          order_type_default TEXT DEFAULT 'market' CHECK (order_type_default IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop')),
          limit_price_offset_percentage DOUBLE PRECISION,
          
          -- Position Management
          max_open_positions INTEGER DEFAULT 10,
          position_sizing_method TEXT DEFAULT 'percentage' CHECK (position_sizing_method IN ('fixed', 'percentage', 'kelly', 'equal_weight')),
          position_size_value DOUBLE PRECISION DEFAULT 10.0,
          rebalance_frequency TEXT DEFAULT 'never' CHECK (rebalance_frequency IN ('never', 'daily', 'weekly', 'on_signal')),
          
          -- Trading Window
          trading_hours_start TEXT DEFAULT '09:30',
          trading_hours_end TEXT DEFAULT '16:00',
          trading_days TEXT[] DEFAULT ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI'],
          
          -- Advanced
          enable_trailing_stop BOOLEAN DEFAULT FALSE,
          trailing_stop_percentage DOUBLE PRECISION,
          enable_bracket_orders BOOLEAN DEFAULT FALSE,
          enable_oco_orders BOOLEAN DEFAULT FALSE,
          commission_rate DOUBLE PRECISION DEFAULT 0.0,
          slippage_model TEXT DEFAULT 'none' CHECK (slippage_model IN ('none', 'fixed', 'proportional')),
          slippage_value DOUBLE PRECISION DEFAULT 0.0,
          
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          
          UNIQUE(session_id)
        )
      `);
      
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_trading_session_settings_session_id 
        ON trading_session_settings(session_id)
      `);
    } else {
      return new Promise((resolve, reject) => {
        // SQLite doesn't support arrays, so we'll store trading_days as JSON string
        db.run(`
          CREATE TABLE IF NOT EXISTS trading_session_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            
            -- Risk Management
            stop_loss_percentage REAL,
            take_profit_percentage REAL,
            max_position_size_percentage REAL DEFAULT 25.0,
            max_daily_loss_percentage REAL,
            max_daily_loss_absolute REAL,
            
            -- Order Execution
            time_in_force TEXT NOT NULL DEFAULT 'day' CHECK (time_in_force IN ('day', 'gtc', 'opg', 'cls', 'ioc', 'fok')),
            allow_partial_fills INTEGER DEFAULT 1,
            extended_hours INTEGER DEFAULT 0,
            order_type_default TEXT DEFAULT 'market' CHECK (order_type_default IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop')),
            limit_price_offset_percentage REAL,
            
            -- Position Management
            max_open_positions INTEGER DEFAULT 10,
            position_sizing_method TEXT DEFAULT 'percentage' CHECK (position_sizing_method IN ('fixed', 'percentage', 'kelly', 'equal_weight')),
            position_size_value REAL DEFAULT 10.0,
            rebalance_frequency TEXT DEFAULT 'never' CHECK (rebalance_frequency IN ('never', 'daily', 'weekly', 'on_signal')),
            
            -- Trading Window
            trading_hours_start TEXT DEFAULT '09:30',
            trading_hours_end TEXT DEFAULT '16:00',
            trading_days TEXT DEFAULT '["MON","TUE","WED","THU","FRI"]',
            
            -- Advanced
            enable_trailing_stop INTEGER DEFAULT 0,
            trailing_stop_percentage REAL,
            enable_bracket_orders INTEGER DEFAULT 0,
            enable_oco_orders INTEGER DEFAULT 0,
            commission_rate REAL DEFAULT 0.0,
            slippage_model TEXT DEFAULT 'none' CHECK (slippage_model IN ('none', 'fixed', 'proportional')),
            slippage_value REAL DEFAULT 0.0,
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (session_id) REFERENCES trading_sessions (id) ON DELETE CASCADE,
            UNIQUE(session_id)
          )
        `, (err: any) => {
          if (err) reject(err);
          else {
            db.run(`
              CREATE INDEX IF NOT EXISTS idx_trading_session_settings_session_id 
              ON trading_session_settings(session_id)
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
      await db.query('DROP TABLE IF EXISTS trading_session_settings');
    } else {
      return new Promise((resolve, reject) => {
        db.run('DROP TABLE IF EXISTS trading_session_settings', (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
};

