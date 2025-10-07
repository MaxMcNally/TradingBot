import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Paths
const sqliteDbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../api/db/trading_bot.db');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required for Postgres');
  process.exit(1);
}

async function main() {
  if (!fs.existsSync(sqliteDbPath)) {
    console.error(`SQLite DB not found at ${sqliteDbPath}`);
    process.exit(1);
  }

  const sqlite = new sqlite3.Database(sqliteDbPath);
  const pg = new Pool({ connectionString: databaseUrl });

  // Ensure destination schema exists (idempotent)
  await pg.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, email TEXT, email_verified BOOLEAN DEFAULT FALSE, email_verification_token TEXT, email_verification_sent_at TIMESTAMP, two_factor_enabled BOOLEAN DEFAULT FALSE, two_factor_secret TEXT, password_reset_token TEXT, password_reset_expires_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())');
  await pg.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE');
  await pg.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT');
  await pg.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP');
  await pg.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE');
  await pg.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT');
  await pg.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT');
  await pg.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP');
  await pg.query('CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, key TEXT NOT NULL, value TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(user_id, key))');
  await pg.query('CREATE TABLE IF NOT EXISTS backtest_results (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, strategy TEXT NOT NULL, symbols TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, config TEXT NOT NULL, results TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())');
  await pg.query('CREATE TABLE IF NOT EXISTS user_strategies (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, strategy_type TEXT NOT NULL, config TEXT NOT NULL, backtest_results TEXT, is_active BOOLEAN DEFAULT TRUE, is_public BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(user_id, name))');
  await pg.query("CREATE TABLE IF NOT EXISTS trades (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, symbol TEXT NOT NULL, action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')), quantity DOUBLE PRECISION NOT NULL, price DOUBLE PRECISION NOT NULL, timestamp TEXT NOT NULL, strategy TEXT NOT NULL, mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')), pnl DOUBLE PRECISION, created_at TIMESTAMP DEFAULT NOW())");
  await pg.query("CREATE TABLE IF NOT EXISTS portfolio_snapshots (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, timestamp TEXT NOT NULL, total_value DOUBLE PRECISION NOT NULL, cash DOUBLE PRECISION NOT NULL, positions TEXT NOT NULL, mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')), created_at TIMESTAMP DEFAULT NOW())");
  await pg.query("CREATE TABLE IF NOT EXISTS trading_sessions (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, start_time TEXT NOT NULL, end_time TEXT, mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')), initial_cash DOUBLE PRECISION NOT NULL, final_cash DOUBLE PRECISION, total_trades INTEGER DEFAULT 0, winning_trades INTEGER DEFAULT 0, total_pnl DOUBLE PRECISION, status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'STOPPED')), created_at TIMESTAMP DEFAULT NOW())");

  // Helpers to promisify sqlite queries
  const all = (sql: string, params: any[] = []) => new Promise<any[]>((resolve, reject) => sqlite.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

  // Migrate in dependency order
  console.log('Migrating users...');
  const users = await all('SELECT * FROM users');
  for (const u of users) {
    await pg.query('INSERT INTO users (id, username, password_hash, email, email_verified, email_verification_token, email_verification_sent_at, two_factor_enabled, two_factor_secret, password_reset_token, password_reset_expires_at, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12,NOW()),COALESCE($13,NOW())) ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username', [u.id, u.username, u.password_hash, u.email, !!u.email_verified, u.email_verification_token, u.email_verification_sent_at, !!u.two_factor_enabled, u.two_factor_secret, u.password_reset_token, u.password_reset_expires_at, u.created_at, u.updated_at]);
  }

  console.log('Migrating settings...');
  const settings = await all('SELECT * FROM settings');
  for (const s of settings) {
    await pg.query('INSERT INTO settings (user_id, key, value, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value', [s.user_id, s.key, s.value]);
  }

  console.log('Migrating user_strategies...');
  const strategies = await all('SELECT * FROM user_strategies');
  for (const st of strategies) {
    await pg.query('INSERT INTO user_strategies (id, user_id, name, description, strategy_type, config, backtest_results, is_active, is_public, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::boolean, $9::boolean, NOW(), NOW()) ON CONFLICT (id) DO NOTHING', [st.id, st.user_id, st.name, st.description, st.strategy_type, st.config, st.backtest_results, !!st.is_active, !!st.is_public]);
  }

  console.log('Migrating trading_sessions...');
  const sessions = await all('SELECT * FROM trading_sessions');
  for (const ts of sessions) {
    await pg.query('INSERT INTO trading_sessions (id, user_id, start_time, end_time, mode, initial_cash, final_cash, total_trades, winning_trades, total_pnl, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) ON CONFLICT (id) DO NOTHING', [ts.id, ts.user_id, ts.start_time, ts.end_time, ts.mode, ts.initial_cash, ts.final_cash, ts.total_trades, ts.winning_trades, ts.total_pnl, ts.status]);
  }

  console.log('Migrating trades...');
  const trades = await all('SELECT * FROM trades');
  for (const t of trades) {
    await pg.query('INSERT INTO trades (id, user_id, symbol, action, quantity, price, timestamp, strategy, mode, pnl, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) ON CONFLICT (id) DO NOTHING', [t.id, t.user_id, t.symbol, t.action, t.quantity, t.price, t.timestamp, t.strategy, t.mode, t.pnl]);
  }

  console.log('Migrating portfolio_snapshots...');
  const snapshots = await all('SELECT * FROM portfolio_snapshots');
  for (const p of snapshots) {
    await pg.query('INSERT INTO portfolio_snapshots (id, user_id, timestamp, total_value, cash, positions, mode, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) ON CONFLICT (id) DO NOTHING', [p.id, p.user_id, p.timestamp, p.total_value, p.cash, p.positions, p.mode]);
  }

  console.log('Done. Closing connections.');
  await pg.end();
  await new Promise<void>((resolve) => sqlite.close(() => resolve()));
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
