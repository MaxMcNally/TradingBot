import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { TradingDatabase } from "../src/database/tradingSchema";

// Determine database backend
const databaseUrl = process.env.DATABASE_URL || "";
export const isPostgres = /^postgres(ql)?:\/\//i.test(databaseUrl);

// Shared helper to normalize booleans for SQL strings when needed
export const toSqlBool = (value: boolean) => (isPostgres ? value : value ? 1 : 0);

// Ensure the database directory exists
const dbDir = path.resolve(__dirname, "../db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, "trading_bot.db");

// Create database connection or adapter depending on backend
let pgPool: Pool | null = null;
let db: any;

if (isPostgres) {
  pgPool = new Pool({ connectionString: databaseUrl });
  pgPool.on('error', (err: any) => {
    console.error('Unexpected Postgres pool error', err);
  });
  pgPool.on('error', (err: any) => {
    console.error('Unexpected Postgres pool error', err);
  });

  // Provide a minimal adapter to mimic sqlite3.Database API used by the app
  db = {
    // SELECT one row
    get(sql: string, params: any[], callback: (err: any, row?: any) => void) {
      const { text, values } = toPg(sql, params);
      pgPool!
        .query(text, values)
        .then((result: any) => callback(null, result.rows[0]))
        .catch((err: any) => callback(err));
    },

    // SELECT many rows
    all(sql: string, params: any[], callback: (err: any, rows?: any[]) => void) {
      const { text, values } = toPg(sql, params);
      pgPool!
        .query(text, values)
        .then((result: any) => callback(null, result.rows))
        .catch((err: any) => callback(err));
    },

    // INSERT/UPDATE/DELETE
    run(sql: string, params: any[], callback: (...args: any[]) => void) {
      // Add RETURNING id if it's an INSERT without RETURNING and an id column likely exists
      const needsId = /\binsert\s+into\s+\w+/i.test(sql) && !/returning\s+id/i.test(sql);
      const finalSql = needsId ? `${sql} RETURNING id` : sql;
      const { text, values } = toPg(finalSql, params);
      pgPool!
        .query(text, values)
        .then((result: any) => {
          const lastID = needsId && result.rows[0] && result.rows[0].id ? result.rows[0].id : undefined;
          const changes = typeof result.rowCount === "number" ? result.rowCount : 0;
          callback.call({ lastID, changes }, null);
        })
        .catch((err: any) => callback.call({ lastID: undefined, changes: 0 }, err));
    },

    // Compatibility method for serialize - use Postgres transactions
    serialize(fn: () => void) {
      if (pgPool) {
        // Use Postgres transaction for serialize operations
        pgPool.query('BEGIN', (err) => {
          if (err) {
            console.error('Error starting transaction:', err);
            return;
          }
          
          try {
            fn();
            
            // Commit the transaction
            pgPool!.query('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('Error committing transaction:', commitErr);
                pgPool!.query('ROLLBACK');
              }
            });
          } catch (error) {
            console.error('Error in transaction:', error);
            pgPool!.query('ROLLBACK');
          }
        });
      } else {
        // Fallback to immediate execution
        fn();
      }
    },

    // Close pool
    close(cb: (err?: any) => void) {
      pgPool!
        .end()
        .then(() => cb())
        .catch((err: any) => cb(err));
    },
  };
} else {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Could not connect to database", err);
    } else {
      console.log(`Connected to SQLite database at: ${dbPath}`);
    }
  });
}

export { db };

// Convert sqlite-style `?` placeholders to Postgres-style `$1, $2, ...`
function toPg(sql: string, params: any[]): { text: string; values: any[] } {
  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values: params || [] };
}

// Initialize database tables
export const initDatabase = () => {
  if (isPostgres) {
    return new Promise<void>(async (resolve, reject) => {
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

        // Indexes
        await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
        await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id)`);
        await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_backtest_results_user_id ON backtest_results(user_id)`);
        await pgPool!.query(`CREATE INDEX IF NOT EXISTS idx_user_strategies_user_id ON user_strategies(user_id)`);

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
            `INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3)`,
            ["admin", hashedPassword, "admin@tradingbot.com"]
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
  }

  // SQLite path (existing behavior)
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email TEXT,
          email_verified INTEGER DEFAULT 0,
          email_verification_token TEXT,
          email_verification_sent_at DATETIME,
          two_factor_enabled INTEGER DEFAULT 0,
          two_factor_secret TEXT,
          password_reset_token TEXT,
          password_reset_expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err: any) => {
        if (err) {
          console.error("Error creating users table:", err);
          reject(err);
        } else {
          console.log("Users table created/verified");
        }
      });

      // Create settings table
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, key)
        )
      `, (err: any) => {
        if (err) {
          console.error("Error creating settings table:", err);
          reject(err);
        } else {
          console.log("Settings table created/verified");
        }
      });

      // Create backtest_results table
      db.run(`
        CREATE TABLE IF NOT EXISTS backtest_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          strategy TEXT NOT NULL,
          symbols TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          config TEXT NOT NULL,
          results TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err: any) => {
        if (err) {
          console.error("Error creating backtest_results table:", err);
          reject(err);
        } else {
          console.log("Backtest results table created/verified");
        }
      });

      // Create user_strategies table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_strategies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          strategy_type TEXT NOT NULL,
          config TEXT NOT NULL,
          backtest_results TEXT,
          is_active BOOLEAN DEFAULT 1,
          is_public BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, name)
        )
      `, (err: any) => {
        if (err) {
          console.error("Error creating user_strategies table:", err);
          reject(err);
        } else {
          console.log("User strategies table created/verified");
        }
      });

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`, (err: any) => {
        if (err) console.error("Error creating users index:", err);
      });

      // Idempotent migrations for existing databases: add security columns if missing (SQLite)
      const userSecurityColumns = [
        { name: 'email_verified', ddl: 'INTEGER DEFAULT 0' },
        { name: 'email_verification_token', ddl: 'TEXT' },
        { name: 'email_verification_sent_at', ddl: 'DATETIME' },
        { name: 'two_factor_enabled', ddl: 'INTEGER DEFAULT 0' },
        { name: 'two_factor_secret', ddl: 'TEXT' },
        { name: 'password_reset_token', ddl: 'TEXT' },
        { name: 'password_reset_expires_at', ddl: 'DATETIME' },
      ];
      userSecurityColumns.forEach((col) => {
        db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.ddl}`,(err: any)=>{
          if (err && !String(err.message).includes('duplicate column name')) {
            console.error(`Error adding users.${col.name} column:`, err);
          }
        });
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id)`, (err: any) => {
        if (err) console.error("Error creating settings index:", err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_backtest_results_user_id ON backtest_results(user_id)`, (err: any) => {
        if (err) console.error("Error creating backtest_results index:", err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_user_strategies_user_id ON user_strategies(user_id)`, (err: any) => {
        if (err) console.error("Error creating user_strategies index:", err);
      });

      // Add is_public column if it doesn't exist (migration for existing databases)
      db.run(`ALTER TABLE user_strategies ADD COLUMN is_public BOOLEAN DEFAULT 0`, (err: any) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error("Error adding is_public column:", err);
        } else if (!err) {
          console.log("Added is_public column to user_strategies table");
        }
      });

      // Initialize trading tables
      TradingDatabase.initializeTables().then(() => {
        console.log("Trading tables initialized successfully");
      }).catch((err: any) => {
        console.error("Error initializing trading tables:", err);
        reject(err);
      });

      // Create a default admin user if no users exist
      db.get("SELECT COUNT(*) as count FROM users", (err: any, row: any) => {
        if (err) {
          console.error("Error checking user count:", err);
          reject(err);
        } else if (row.count === 0) {
          const defaultPassword = "admin123";
          const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
          
          db.run(
            "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
            ["admin", hashedPassword, "admin@tradingbot.com"],
            (err: any) => {
              if (err) {
                console.error("Error creating default admin user:", err);
                reject(err);
              } else {
                console.log("Default admin user created (username: admin, password: admin123)");
                resolve();
              }
            }
          );
        } else {
          console.log("Database initialization complete");
          resolve();
        }
      });
    });
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
