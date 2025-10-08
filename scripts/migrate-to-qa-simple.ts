import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// QA Database Configuration
const QA_DATABASE_URL = process.env.QA_DATABASE_URL || 'postgresql://trading:trading@localhost:5433/tradingbot_qa';
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../db/trading_bot.db');

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

    // Create strategy_performance table if it doesn't exist
    await pg.query(`
      CREATE TABLE IF NOT EXISTS strategy_performance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
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

    console.log('✅ Strategy performance table created');

    // Clear existing data
    console.log('🧹 Clearing existing strategy_performance data...');
    await pg.query('DELETE FROM strategy_performance');

    // Helpers to promisify sqlite queries
    const all = (sql: string, params: any[] = []) => new Promise<any[]>((resolve, reject) => 
      sqlite.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows))
    );

    // Migrate strategy_performance data
    console.log('📊 Migrating strategy_performance...');
    const performance = await all('SELECT * FROM strategy_performance');
    
    console.log(`Found ${performance.length} records to migrate`);
    
    for (let i = 0; i < performance.length; i++) {
      const sp = performance[i];
      
      try {
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
          )
        `, [
          sp.id, sp.user_id, sp.strategy_name, sp.strategy_type, sp.execution_type, sp.session_id,
          sp.symbols, sp.start_date, sp.end_date, sp.initial_capital, sp.final_capital,
          sp.total_return, sp.total_return_dollar, sp.max_drawdown, sp.sharpe_ratio, sp.sortino_ratio,
          sp.win_rate, sp.total_trades, sp.winning_trades, sp.losing_trades, sp.avg_win, sp.avg_loss,
          sp.profit_factor, sp.largest_win, sp.largest_loss, sp.avg_trade_duration, sp.volatility,
          sp.beta, sp.alpha, sp.config, sp.trades_data, sp.portfolio_history, sp.created_at, sp.updated_at
        ]);
        
        if ((i + 1) % 50 === 0) {
          console.log(`✅ Migrated ${i + 1}/${performance.length} records...`);
        }
      } catch (error: any) {
        console.error(`❌ Error migrating record ${sp.id}:`, error.message);
        console.error('Record data:', JSON.stringify(sp, null, 2));
        throw error;
      }
    }

    console.log(`✅ Successfully migrated ${performance.length} strategy performance records`);

    // Summary
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   - Strategy Performance Records: ${performance.length}`);

    console.log('\n🔧 Next Steps:');
    console.log('   1. Test the admin dashboard with the migrated data');
    console.log('   2. Verify all performance metrics are displaying correctly');

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
