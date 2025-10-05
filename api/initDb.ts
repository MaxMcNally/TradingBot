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

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`, (err) => {
        if (err) console.error("Error creating users index:", err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id)`, (err) => {
        if (err) console.error("Error creating settings index:", err);
      });

      db.run(`CREATE INDEX IF NOT EXISTS idx_backtest_results_user_id ON backtest_results(user_id)`, (err) => {
        if (err) console.error("Error creating backtest_results index:", err);
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
