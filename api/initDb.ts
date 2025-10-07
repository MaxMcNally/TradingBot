import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { TradingDatabase } from "../src/database/tradingSchema";

// Ensure the database directory exists
const dbDir = path.resolve(__dirname, "../db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, "trading_bot.db");

// Create database connection
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
  }
});

// Initialize database tables
export const initDatabase = () => {
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
      `, (err) => {
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
      `, (err) => {
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
      `, (err) => {
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
      `, (err) => {
        if (err) {
          console.error("Error creating user_strategies table:", err);
          reject(err);
        } else {
          console.log("User strategies table created/verified");
        }
      });

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`, (err) => {
        if (err) console.error("Error creating users index:", err);
      });

      // Idempotent migrations for existing databases: add security columns if missing
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
        db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.ddl}`,(err)=>{
          if (err && !String(err.message).includes('duplicate column name')) {
            console.error(`Error adding users.${col.name} column:`, err);
          }
        });
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id)`, (err) => {
        if (err) console.error("Error creating settings index:", err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_backtest_results_user_id ON backtest_results(user_id)`, (err) => {
        if (err) console.error("Error creating backtest_results index:", err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_user_strategies_user_id ON user_strategies(user_id)`, (err) => {
        if (err) console.error("Error creating user_strategies index:", err);
      });

      // Add is_public column if it doesn't exist (migration for existing databases)
      db.run(`ALTER TABLE user_strategies ADD COLUMN is_public BOOLEAN DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error("Error adding is_public column:", err);
        } else if (!err) {
          console.log("Added is_public column to user_strategies table");
        }
      });

      // Initialize trading tables
      TradingDatabase.initializeTables().then(() => {
        console.log("Trading tables initialized successfully");
      }).catch((err) => {
        console.error("Error initializing trading tables:", err);
        reject(err);
      });

      // Create a default admin user if no users exist
      db.get("SELECT COUNT(*) as count FROM users", (err, row: any) => {
        if (err) {
          console.error("Error checking user count:", err);
          reject(err);
        } else if (row.count === 0) {
          const defaultPassword = "admin123";
          const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
          
          db.run(
            "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
            ["admin", hashedPassword, "admin@tradingbot.com"],
            (err) => {
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
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
      } else {
        console.log("Database connection closed");
      }
      resolve();
    });
  });
};
