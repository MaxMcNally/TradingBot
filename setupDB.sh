#!/bin/bash
set -e

DB_FILE="api/db/trading_bot.db"
mkdir -p api/db

echo "Creating SQLite DB at $DB_FILE..."

sqlite3 $DB_FILE <<EOF
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  setting_key TEXT,
  setting_value TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  symbol TEXT,
  qty INTEGER,
  price REAL,
  trade_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Backtests table
CREATE TABLE IF NOT EXISTS backtests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  strategy TEXT,
  result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
EOF

echo "SQLite DB and tables created."
