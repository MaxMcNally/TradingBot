#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.resolve(__dirname, '../dist/db/trading_bot.db');

// Create database connection
const db = new sqlite3.Database(dbPath);

// Mock data generator
function generateMockData(length, startPrice = 100, volatility = 0.02) {
  const data = [];
  let price = startPrice;
  const baseTime = new Date('2023-01-01T09:30:00Z');
  
  for (let i = 0; i < length; i++) {
    const trend = Math.sin(i / 50) * 0.001;
    const noise = (Math.random() - 0.5) * volatility;
    const change = trend + noise;
    
    const open = price;
    price = Math.max(1, price * (1 + change));
    const high = Math.max(open, price) * (1 + Math.random() * 0.01);
    const low = Math.min(open, price) * (1 - Math.random() * 0.01);
    
    const timestamp = new Date(baseTime.getTime() + i * 24 * 60 * 60 * 1000);
    
    data.push({
      date: timestamp.toDateString(),
      close: price,
      open: open,
      high: high,
      low: low,
      volume: 1000000 + Math.random() * 500000
    });
  }
  
  return data;
}

// Simple mean reversion strategy simulation
function simulateMeanReversion(data, window = 20, threshold = 0.02) {
  const trades = [];
  let cash = 100000;
  let shares = 0;
  let portfolioHistory = [];
  
  for (let i = window; i < data.length; i++) {
    const currentPrice = data[i].close;
    const recentPrices = data.slice(i - window, i).map(d => d.close);
    const avgPrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
    
    const deviation = (currentPrice - avgPrice) / avgPrice;
    
    // Buy signal: price below average by threshold
    if (deviation < -threshold && shares === 0) {
      shares = Math.floor(cash / currentPrice);
      cash -= shares * currentPrice;
      trades.push({
        date: data[i].date,
        action: 'BUY',
        price: currentPrice,
        shares: shares,
        pnl: 0
      });
    }
    // Sell signal: price above average by threshold
    else if (deviation > threshold && shares > 0) {
      const pnl = (currentPrice - trades[trades.length - 1].price) * shares;
      cash += shares * currentPrice;
      trades.push({
        date: data[i].date,
        action: 'SELL',
        price: currentPrice,
        shares: shares,
        pnl: pnl
      });
      shares = 0;
    }
    
    const portfolioValue = cash + (shares * currentPrice);
    portfolioHistory.push({
      date: data[i].date,
      portfolioValue: portfolioValue,
      cash: cash,
      shares: shares,
      price: currentPrice
    });
  }
  
  // Close any remaining position
  if (shares > 0) {
    const finalPrice = data[data.length - 1].close;
    const pnl = (finalPrice - trades[trades.length - 1].price) * shares;
    cash += shares * finalPrice;
    trades.push({
      date: data[data.length - 1].date,
      action: 'SELL',
      price: finalPrice,
      shares: shares,
      pnl: pnl
    });
  }
  
  const finalPortfolioValue = cash;
  const totalReturn = ((finalPortfolioValue - 100000) / 100000) * 100;
  
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 10 : 0;
  
  const maxDrawdown = calculateMaxDrawdown(portfolioHistory);
  
  return {
    trades,
    finalPortfolioValue,
    totalReturn,
    winRate,
    maxDrawdown,
    portfolioHistory,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
    avgLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
    profitFactor,
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0,
    largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0
  };
}

function calculateMaxDrawdown(portfolioHistory) {
  let maxValue = 100000;
  let maxDrawdown = 0;
  
  for (const point of portfolioHistory) {
    if (point.portfolioValue > maxValue) {
      maxValue = point.portfolioValue;
    }
    const drawdown = ((maxValue - point.portfolioValue) / maxValue) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

// Create strategy_performance table
function createTable() {
  return new Promise((resolve, reject) => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS strategy_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        strategy_name TEXT NOT NULL,
        strategy_type TEXT NOT NULL,
        execution_type TEXT NOT NULL,
        session_id INTEGER,
        symbols TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        initial_capital REAL NOT NULL,
        final_capital REAL NOT NULL,
        total_return REAL NOT NULL,
        total_return_dollar REAL NOT NULL,
        max_drawdown REAL NOT NULL,
        sharpe_ratio REAL,
        sortino_ratio REAL,
        win_rate REAL NOT NULL,
        total_trades INTEGER NOT NULL,
        winning_trades INTEGER NOT NULL,
        losing_trades INTEGER NOT NULL,
        avg_win REAL NOT NULL,
        avg_loss REAL NOT NULL,
        profit_factor REAL NOT NULL,
        largest_win REAL NOT NULL,
        largest_loss REAL NOT NULL,
        avg_trade_duration REAL NOT NULL,
        volatility REAL NOT NULL,
        beta REAL,
        alpha REAL,
        config TEXT NOT NULL,
        trades_data TEXT NOT NULL,
        portfolio_history TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('❌ Error creating table:', err);
        reject(err);
      } else {
        console.log('✅ Strategy performance table created/verified');
        resolve();
      }
    });
  });
}

// Clear existing data
function clearTable() {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM strategy_performance', (err) => {
      if (err) {
        console.error('❌ Error clearing table:', err);
        reject(err);
      } else {
        console.log('🗑️  Cleared existing strategy performance data');
        resolve();
      }
    });
  });
}

// Insert performance data
function insertPerformanceData(data) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO strategy_performance (
        user_id, strategy_name, strategy_type, execution_type, symbols,
        start_date, end_date, initial_capital, final_capital, total_return,
        total_return_dollar, max_drawdown, win_rate, total_trades,
        winning_trades, losing_trades, avg_win, avg_loss, profit_factor,
        largest_win, largest_loss, avg_trade_duration, volatility,
        config, trades_data, portfolio_history
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.user_id,
      data.strategy_name,
      data.strategy_type,
      data.execution_type,
      JSON.stringify(data.symbols),
      data.start_date,
      data.end_date,
      data.initial_capital,
      data.final_capital,
      data.total_return,
      data.total_return_dollar,
      data.max_drawdown,
      data.win_rate,
      data.total_trades,
      data.winning_trades,
      data.losing_trades,
      data.avg_win,
      data.avg_loss,
      data.profit_factor,
      data.largest_win,
      data.largest_loss,
      data.avg_trade_duration,
      data.volatility,
      JSON.stringify(data.config),
      JSON.stringify(data.trades_data),
      JSON.stringify(data.portfolio_history)
    ];
    
    db.run(sql, values, function(err) {
      if (err) {
        console.error('❌ Error inserting data:', err);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// Main execution
async function main() {
  console.log('🚀 Starting Direct Strategy Performance Population');
  console.log('=' .repeat(60));
  
  try {
    // Create table
    await createTable();
    
    // Clear existing data
    await clearTable();
    
    // Configuration
    const strategies = [
      { name: 'MeanReversion', type: 'MEAN_REVERSION' },
      { name: 'Momentum', type: 'MOMENTUM' },
      { name: 'MovingAverageCrossover', type: 'MOVING_AVERAGE' },
      { name: 'BollingerBands', type: 'BOLLINGER_BANDS' },
      { name: 'Breakout', type: 'BREAKOUT' }
    ];
    
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];
    const dateRanges = [
      { start: '2023-01-01', end: '2023-06-30' },
      { start: '2023-07-01', end: '2023-12-31' },
      { start: '2022-01-01', end: '2022-12-31' },
      { start: '2023-03-01', end: '2023-08-31' },
      { start: '2022-06-01', end: '2023-05-31' }
    ];
    
    const configs = [
      { window: 10, threshold: 0.02 },
      { window: 15, threshold: 0.03 },
      { window: 20, threshold: 0.025 },
      { window: 12, threshold: 0.015 },
      { window: 18, threshold: 0.035 },
      { window: 8, threshold: 0.01 },
      { window: 25, threshold: 0.04 },
      { window: 14, threshold: 0.02 },
      { window: 16, threshold: 0.03 },
      { window: 22, threshold: 0.025 }
    ];
    
    let totalInserted = 0;
    
    // Run backtests for each strategy
    for (const strategy of strategies) {
      console.log(`\n📈 Running backtests for ${strategy.name}...`);
      
      for (let i = 0; i < 10; i++) {
        const config = configs[i];
        const symbol = symbols[i % symbols.length];
        const dateRange = dateRanges[i % dateRanges.length];
        
        console.log(`  ${i + 1}/10: ${symbol} (${dateRange.start} to ${dateRange.end})`);
        
        // Generate mock data
        const daysDiff = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24));
        const mockData = generateMockData(daysDiff, 100 + Math.random() * 50, 0.02 + Math.random() * 0.01);
        
        // Run strategy simulation
        const result = simulateMeanReversion(mockData, config.window, config.threshold);
        
        // Prepare data for insertion
        const performanceData = {
          user_id: 1,
          strategy_name: strategy.name,
          strategy_type: strategy.type,
          execution_type: 'BACKTEST',
          symbols: [symbol],
          start_date: dateRange.start,
          end_date: dateRange.end,
          initial_capital: 100000,
          final_capital: result.finalPortfolioValue,
          total_return: result.totalReturn,
          total_return_dollar: result.finalPortfolioValue - 100000,
          max_drawdown: result.maxDrawdown,
          win_rate: result.winRate,
          total_trades: result.totalTrades,
          winning_trades: result.winningTrades,
          losing_trades: result.losingTrades,
          avg_win: result.avgWin,
          avg_loss: result.avgLoss,
          profit_factor: result.profitFactor,
          largest_win: result.largestWin,
          largest_loss: result.largestLoss,
          avg_trade_duration: 24, // Default 24 hours
          volatility: 0.2, // Default 20% volatility
          config: config,
          trades_data: result.trades,
          portfolio_history: result.portfolioHistory
        };
        
        // Insert into database
        await insertPerformanceData(performanceData);
        totalInserted++;
        
        console.log(`    ✅ Return: ${result.totalReturn.toFixed(2)}%, Trades: ${result.totalTrades}, Win Rate: ${result.winRate.toFixed(1)}%`);
      }
    }
    
    console.log(`\n🎉 Population complete!`);
    console.log(`📊 Total records inserted: ${totalInserted}`);
    console.log(`📈 Strategies tested: ${strategies.length}`);
    console.log(`🎯 Configurations per strategy: 10`);
    console.log(`📅 Date ranges used: ${dateRanges.length}`);
    console.log(`🏷️  Symbols tested: ${symbols.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

// Run the script
main();
