import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { TradingDatabase } from "../src/database/tradingSchema";

// Database connection
const databaseUrl = process.env.DATABASE_URL || "";
// Only require DATABASE_URL if not in test environment (tests mock the database)
if (!databaseUrl && process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Shared helper to normalize booleans for SQL strings
export const toSqlBool = (value: boolean) => value;

// Create Postgres connection pool (only if DATABASE_URL is provided)
const pgPool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
if (pgPool) {
  pgPool.on('error', (err: any) => {
    console.error('Unexpected Postgres pool error', err);
  });
}

// Provide a minimal adapter to mimic sqlite3.Database API for compatibility with existing code
const db = {
  // SELECT one row
  get(sql: string, params: any[], callback: (err: any, row?: any) => void) {
    if (!pgPool) {
      if (callback) callback(new Error('Database pool not initialized'));
      return;
    }
    const { text, values } = toPg(sql, params);
    pgPool
      .query(text, values)
      .then((result: any) => {
        if (callback) callback(null, result.rows[0]);
      })
      .catch((err: any) => {
        if (callback) callback(err);
      });
  },

  // SELECT many rows
  all(sql: string, params: any[], callback: (err: any, rows?: any[]) => void) {
    if (!pgPool) {
      if (callback) callback(new Error('Database pool not initialized'));
      return;
    }
    const { text, values } = toPg(sql, params);
    pgPool
      .query(text, values)
      .then((result: any) => {
        if (callback) callback(null, result.rows);
      })
      .catch((err: any) => {
        if (callback) callback(err);
      });
  },

  // INSERT/UPDATE/DELETE
  run(sql: string, params: any[] = [], callback?: (...args: any[]) => void) {
    console.log('Postgres run method called with SQL:', sql.substring(0, 100) + '...');
    console.log('Callback provided:', !!callback);
    
    if (!pgPool) {
      console.error('Postgres pool is not initialized');
      if (callback) callback.call({ lastID: undefined, changes: 0 }, new Error('Postgres pool not initialized'));
      return;
    }
    
    try {
      // Add RETURNING id if it's an INSERT without RETURNING and an id column likely exists
      const needsId = /\binsert\s+into\s+\w+/i.test(sql) && !/returning\s+id/i.test(sql);
      const finalSql = needsId ? `${sql} RETURNING id` : sql;
      const { text, values } = toPg(finalSql, params);
      
      console.log('Executing Postgres query:', text.substring(0, 100) + '...');
      
      const queryPromise = pgPool.query(text, values);
      if (queryPromise && typeof queryPromise.then === 'function') {
        queryPromise
          .then((result: any) => {
            console.log('Postgres query successful, calling callback');
            const lastID = needsId && result.rows[0] && result.rows[0].id ? result.rows[0].id : undefined;
            const changes = typeof result.rowCount === "number" ? result.rowCount : 0;
            if (callback) callback.call({ lastID, changes }, null);
          })
          .catch((err: any) => {
            console.error('Postgres query failed:', err);
            if (callback) callback.call({ lastID: undefined, changes: 0 }, err);
          });
      } else {
        console.error('pgPool.query did not return a Promise');
        if (callback) callback.call({ lastID: undefined, changes: 0 }, new Error('Query did not return a Promise'));
      }
    } catch (error) {
      console.error('Error in run method:', error);
      if (callback) callback.call({ lastID: undefined, changes: 0 }, error);
    }
  },

  // Compatibility method for serialize - use Postgres transactions
  serialize(fn: () => void) {
    if (pgPool) {
      // Use Postgres transaction for serialize operations
      pgPool.query('BEGIN')
        .then(() => {
          try {
            fn();
            
            // Commit the transaction
            return pgPool!.query('COMMIT');
          } catch (error) {
            console.error('Error in transaction:', error);
            return pgPool!.query('ROLLBACK');
          }
        })
        .catch((err) => {
          console.error('Error starting transaction:', err);
          if (pgPool) pgPool.query('ROLLBACK').catch(() => {});
        });
    } else {
      // Fallback to immediate execution (for tests)
      fn();
    }
  },

  // Close pool
  close(cb?: (err?: any) => void) {
    if (pgPool) {
      pgPool
        .end()
        .then(() => cb && cb())
        .catch((err: any) => cb && cb(err));
    } else {
      if (cb) cb();
    }
  },
};

export { db };

// Convert `?` placeholders to Postgres-style `$1, $2, ...`
function toPg(sql: string, params: any[]): { text: string; values: any[] } {
  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values: params || [] };
}

// Initialize database tables
export const initDatabase = () => {
  return new Promise<void>(async (resolve, reject) => {
    if (!pgPool) {
      reject(new Error('Database pool not initialized'));
      return;
    }
    try {
      // Core tables
      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email TEXT,
          email_verified BOOLEAN DEFAULT FALSE,
          email_verification_token TEXT,
          email_verification_sent_at TIMESTAMP,
          two_factor_enabled BOOLEAN DEFAULT FALSE,
          two_factor_secret TEXT,
          password_reset_token TEXT,
          password_reset_expires_at TIMESTAMP,
          role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
          plan_tier TEXT DEFAULT 'FREE' CHECK (plan_tier IN ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE')),
          plan_status TEXT DEFAULT 'ACTIVE' CHECK (plan_status IN ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING')),
          subscription_provider TEXT DEFAULT 'NONE' CHECK (subscription_provider IN ('NONE', 'STRIPE', 'PAYPAL', 'SQUARE')),
          subscription_payment_reference TEXT,
          subscription_started_at TIMESTAMP DEFAULT NOW(),
          subscription_renews_at TIMESTAMP,
          subscription_cancel_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      // Idempotent ensure of new security columns for existing DBs
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN'))`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'FREE'`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'ACTIVE'`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_provider TEXT DEFAULT 'NONE'`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_payment_reference TEXT`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP DEFAULT NOW()`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMP`);
      await pgPool!.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cancel_at TIMESTAMP`);

      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, key)
        )
      `);

      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS backtest_results (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          strategy TEXT NOT NULL,
          symbols TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          config TEXT NOT NULL,
          results TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS user_strategies (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          strategy_type TEXT NOT NULL,
          config TEXT NOT NULL,
          backtest_results TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          is_public BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, name)
        )
      `);

      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS custom_strategies (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          buy_conditions TEXT NOT NULL,
          sell_conditions TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          is_public BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, name)
        )
      `);
      
      // Add is_public column if it doesn't exist (for existing databases)
      await pgPool!.query(`ALTER TABLE custom_strategies ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`);

      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS strategy_performance (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          strategy_name TEXT NOT NULL,
          strategy_type TEXT NOT NULL,
          execution_type TEXT NOT NULL CHECK (execution_type IN ('BACKTEST', 'LIVE_TRADING')),
          session_id INTEGER,
          symbols TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          initial_capital DOUBLE PRECISION NOT NULL,
          final_capital DOUBLE PRECISION NOT NULL,
          total_return DOUBLE PRECISION NOT NULL,
          total_return_dollar DOUBLE PRECISION NOT NULL,
          max_drawdown DOUBLE PRECISION NOT NULL,
          sharpe_ratio DOUBLE PRECISION,
          sortino_ratio DOUBLE PRECISION,
          win_rate DOUBLE PRECISION NOT NULL,
          total_trades INTEGER NOT NULL,
          winning_trades INTEGER NOT NULL,
          losing_trades INTEGER NOT NULL,
          avg_win DOUBLE PRECISION NOT NULL,
          avg_loss DOUBLE PRECISION NOT NULL,
          profit_factor DOUBLE PRECISION NOT NULL,
          largest_win DOUBLE PRECISION NOT NULL,
          largest_loss DOUBLE PRECISION NOT NULL,
          avg_trade_duration DOUBLE PRECISION NOT NULL,
          volatility DOUBLE PRECISION NOT NULL,
          beta DOUBLE PRECISION,
          alpha DOUBLE PRECISION,
          config TEXT NOT NULL,
          trades_data TEXT NOT NULL,
          portfolio_history TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          plan_tier TEXT NOT NULL,
          plan_price_cents INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          provider TEXT NOT NULL,
          status TEXT NOT NULL,
          external_subscription_id TEXT,
          payment_method TEXT,
          notes TEXT,
          started_at TIMESTAMP DEFAULT NOW(),
          renews_at TIMESTAMP,
          canceled_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          key_name TEXT NOT NULL,
          api_key TEXT NOT NULL,
          api_secret TEXT NOT NULL,
          key_prefix TEXT NOT NULL,
          last_used_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS webhooks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          event_types JSONB NOT NULL,
          secret TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          last_triggered_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS webhook_events (
          id SERIAL PRIMARY KEY,
          webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          payload JSONB NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
          response_code INTEGER,
          response_body TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          sent_at TIMESTAMP
        )
      `);

      await pgPool!.query(`
        CREATE TABLE IF NOT EXISTS api_usage_logs (
          id SERIAL PRIMARY KEY,
          api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          status_code INTEGER NOT NULL,
          response_time_ms INTEGER,
          request_size INTEGER,
          response_size INTEGER,
          ip_address TEXT,
          user_agent TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Indexes
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_backtest_results_user_id ON backtest_results(user_id)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_user_strategies_user_id ON user_strategies(user_id)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_strategy_performance_user_id ON strategy_performance(user_id)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_strategy_performance_strategy_name ON strategy_performance(strategy_name)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_strategy_performance_strategy_type ON strategy_performance(strategy_type)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_strategy_performance_execution_type ON strategy_performance(execution_type)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_strategy_performance_created_at ON strategy_performance(created_at)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON webhook_events(webhook_id)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at)`);
      await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint)`);

      // Ensure is_public column exists (idempotent)
      await pgPool!.query(`ALTER TABLE user_strategies ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`);

      // Initialize trading tables (will handle its own dialect)
      await TradingDatabase.initializeTables();

      // Seed default user if none exists
      const { rows } = await pgPool!.query(`SELECT COUNT(*)::int as count FROM users`);
      if (rows[0].count === 0) {
        const defaultPassword = "admin123";
        const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
        await pgPool!.query(
          `INSERT INTO users (username, password_hash, email, role) VALUES ($1, $2, $3, $4)`,
          ["admin", hashedPassword, "admin@tradingbot.com", "ADMIN"]
        );
        console.log("Default admin user created (username: admin, password: admin123)");
      }

      console.log("Database initialization complete");
      resolve();
    } catch (err) {
      console.error("Failed to initialize Postgres database:", err);
      reject(err);
    }
  });
};

// Close database connection
export const closeDatabase = () => {
  return new Promise<void>((resolve) => {
    db.close((err: any) => {
      if (err) {
        console.error("Error closing database:", err);
      } else {
        console.log("Database connection closed");
      }
      resolve();
    });
  });
};
