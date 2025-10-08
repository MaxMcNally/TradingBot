import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// QA Database Configuration
const QA_DATABASE_URL = process.env.QA_DATABASE_URL || 'postgresql://trading:trading@localhost:5433/tradingbot_qa';
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../api/db/trading_bot.db');

console.log('🚀 Starting migration to QA database...');
console.log(`📊 Source: ${SQLITE_DB_PATH}`);
console.log(`🎯 Target: ${QA_DATABASE_URL}`);

async function main() {
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.error(`❌ SQLite DB not found at ${SQLITE_DB_PATH}`);
    process.exit(1);
  }

  const sqlite = new sqlite3.Database(SQLITE_DB_PATH);
  const pg = new Pool({ connectionString: QA_DATABASE_URL });

  try {
    // Test connection to QA database
    await pg.query('SELECT 1');
    console.log('✅ Connected to QA database');

    // Create QA database schema (idempotent)
    console.log('📋 Creating QA database schema...');
    
    // Users table
    await pg.query(`
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
    
    // Add role column if it doesn't exist
    try {
      await pg.query(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN'))`);
    } catch (error: any) {
      if (error.code !== '42701') { // Column already exists
        console.log('Note: Role column may already exist');
      }
    }

    // Settings table
    await pg.query(`
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

    // Backtest results table
    await pg.query(`
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

    // User strategies table
    await pg.query(`
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

    // Trades table
    await pg.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY, 
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
        symbol TEXT NOT NULL, 
        action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')), 
        quantity DOUBLE PRECISION NOT NULL, 
        price DOUBLE PRECISION NOT NULL, 
        timestamp TEXT NOT NULL, 
        strategy TEXT NOT NULL, 
        mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')), 
        pnl DOUBLE PRECISION, 
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Portfolio snapshots table
    await pg.query(`
      CREATE TABLE IF NOT EXISTS portfolio_snapshots (
        id SERIAL PRIMARY KEY, 
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
        timestamp TEXT NOT NULL, 
        total_value DOUBLE PRECISION NOT NULL, 
        cash DOUBLE PRECISION NOT NULL, 
        positions TEXT NOT NULL, 
        mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')), 
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Trading sessions table
    await pg.query(`
      CREATE TABLE IF NOT EXISTS trading_sessions (
        id SERIAL PRIMARY KEY, 
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
        start_time TEXT NOT NULL, 
        end_time TEXT, 
        mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')), 
        initial_cash DOUBLE PRECISION NOT NULL, 
        final_cash DOUBLE PRECISION, 
        total_trades INTEGER DEFAULT 0, 
        winning_trades INTEGER DEFAULT 0, 
        total_pnl DOUBLE PRECISION, 
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'STOPPED')), 
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Strategy performance table (the main one we want to migrate)
    await pg.query(`
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

    console.log('✅ QA database schema created');

    // Helpers to promisify sqlite queries
    const all = (sql: string, params: any[] = []) => new Promise<any[]>((resolve, reject) => 
      sqlite.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows))
    );

    // Clear existing QA data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing QA data...');
    await pg.query('DELETE FROM strategy_performance');
    await pg.query('DELETE FROM portfolio_snapshots');
    await pg.query('DELETE FROM trades');
    await pg.query('DELETE FROM trading_sessions');
    await pg.query('DELETE FROM user_strategies');
    await pg.query('DELETE FROM backtest_results');
    await pg.query('DELETE FROM settings');
    await pg.query('DELETE FROM users');

    // Migrate in dependency order
    console.log('👥 Migrating users...');
    const users = await all('SELECT * FROM users');
    for (const u of users) {
      // Check if role column exists in source data
      const userRole = u.role || 'USER';
      
      await pg.query(`
        INSERT INTO users (
          id, username, password_hash, email, email_verified, email_verification_token, 
          email_verification_sent_at, two_factor_enabled, two_factor_secret, 
          password_reset_token, password_reset_expires_at, role, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) ON CONFLICT (id) DO UPDATE SET 
          username = EXCLUDED.username,
          role = EXCLUDED.role
      `, [
        u.id, u.username, u.password_hash, u.email, !!u.email_verified, 
        u.email_verification_token, u.email_verification_sent_at, 
        !!u.two_factor_enabled, u.two_factor_secret, u.password_reset_token, 
        u.password_reset_expires_at, userRole, u.created_at, u.updated_at
      ]);
    }
    console.log(`✅ Migrated ${users.length} users`);

    console.log('⚙️ Migrating settings...');
    const settings = await all('SELECT * FROM settings');
    for (const s of settings) {
      await pg.query(`
        INSERT INTO settings (user_id, key, value, created_at, updated_at) 
        VALUES ($1, $2, $3, NOW(), NOW()) 
        ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value
      `, [s.user_id, s.key, s.value]);
    }
    console.log(`✅ Migrated ${settings.length} settings`);

    console.log('📊 Migrating strategy_performance...');
    const performance = await all('SELECT * FROM strategy_performance');
    for (const sp of performance) {
      await pg.query(`
        INSERT INTO strategy_performance (
          id, user_id, strategy_name, strategy_type, execution_type, session_id,
          symbols, start_date, end_date, initial_capital, final_capital,
          total_return, total_return_dollar, max_drawdown, sharpe_ratio, sortino_ratio,
          win_rate, total_trades, winning_trades, losing_trades, avg_win, avg_loss,
          profit_factor, largest_win, largest_loss, avg_trade_duration, volatility,
          beta, alpha, config, trades_data, portfolio_history, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
        ) ON CONFLICT (id) DO NOTHING
      `, [
        sp.id, sp.user_id, sp.strategy_name, sp.strategy_type, sp.execution_type, sp.session_id,
        sp.symbols, sp.start_date, sp.end_date, sp.initial_capital, sp.final_capital,
        sp.total_return, sp.total_return_dollar, sp.max_drawdown, sp.sharpe_ratio, sp.sortino_ratio,
        sp.win_rate, sp.total_trades, sp.winning_trades, sp.losing_trades, sp.avg_win, sp.avg_loss,
        sp.profit_factor, sp.largest_win, sp.largest_loss, sp.avg_trade_duration, sp.volatility,
        sp.beta, sp.alpha, sp.config, sp.trades_data, sp.portfolio_history, sp.created_at, sp.updated_at
      ]);
    }
    console.log(`✅ Migrated ${performance.length} strategy performance records`);

    console.log('📈 Migrating backtest_results...');
    const backtests = await all('SELECT * FROM backtest_results');
    for (const b of backtests) {
      await pg.query(`
        INSERT INTO backtest_results (
          id, user_id, strategy, symbols, start_date, end_date, config, results, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
        ON CONFLICT (id) DO NOTHING
      `, [b.id, b.user_id, b.strategy, b.symbols, b.start_date, b.end_date, b.config, b.results]);
    }
    console.log(`✅ Migrated ${backtests.length} backtest results`);

    console.log('🎯 Migrating user_strategies...');
    const strategies = await all('SELECT * FROM user_strategies');
    for (const st of strategies) {
      await pg.query(`
        INSERT INTO user_strategies (
          id, user_id, name, description, strategy_type, config, backtest_results, 
          is_active, is_public, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::boolean, $9::boolean, NOW(), NOW()) 
        ON CONFLICT (id) DO NOTHING
      `, [st.id, st.user_id, st.name, st.description, st.strategy_type, st.config, st.backtest_results, !!st.is_active, !!st.is_public]);
    }
    console.log(`✅ Migrated ${strategies.length} user strategies`);

    console.log('💼 Migrating trading_sessions...');
    const sessions = await all('SELECT * FROM trading_sessions');
    for (const ts of sessions) {
      await pg.query(`
        INSERT INTO trading_sessions (
          id, user_id, start_time, end_time, mode, initial_cash, final_cash, 
          total_trades, winning_trades, total_pnl, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
        ON CONFLICT (id) DO NOTHING
      `, [ts.id, ts.user_id, ts.start_time, ts.end_time, ts.mode, ts.initial_cash, ts.final_cash, ts.total_trades, ts.winning_trades, ts.total_pnl, ts.status]);
    }
    console.log(`✅ Migrated ${sessions.length} trading sessions`);

    console.log('📊 Migrating trades...');
    const trades = await all('SELECT * FROM trades');
    for (const t of trades) {
      await pg.query(`
        INSERT INTO trades (
          id, user_id, symbol, action, quantity, price, timestamp, strategy, mode, pnl, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
        ON CONFLICT (id) DO NOTHING
      `, [t.id, t.user_id, t.symbol, t.action, t.quantity, t.price, t.timestamp, t.strategy, t.mode, t.pnl]);
    }
    console.log(`✅ Migrated ${trades.length} trades`);

    console.log('📈 Migrating portfolio_snapshots...');
    const snapshots = await all('SELECT * FROM portfolio_snapshots');
    for (const p of snapshots) {
      await pg.query(`
        INSERT INTO portfolio_snapshots (
          id, user_id, timestamp, total_value, cash, positions, mode, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
        ON CONFLICT (id) DO NOTHING
      `, [p.id, p.user_id, p.timestamp, p.total_value, p.cash, p.positions, p.mode]);
    }
    console.log(`✅ Migrated ${snapshots.length} portfolio snapshots`);

    // Summary
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Settings: ${settings.length}`);
    console.log(`   - Strategy Performance: ${performance.length}`);
    console.log(`   - Backtest Results: ${backtests.length}`);
    console.log(`   - User Strategies: ${strategies.length}`);
    console.log(`   - Trading Sessions: ${sessions.length}`);
    console.log(`   - Trades: ${trades.length}`);
    console.log(`   - Portfolio Snapshots: ${snapshots.length}`);

    console.log('\n🔧 Next Steps:');
    console.log('   1. Update your QA environment to use the QA database');
    console.log('   2. Test the admin dashboard with the migrated data');
    console.log('   3. Verify all performance metrics are displaying correctly');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pg.end();
    await new Promise<void>((resolve) => sqlite.close(() => resolve()));
  }
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
