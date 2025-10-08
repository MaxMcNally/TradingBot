#!/usr/bin/env node

/**
 * Strategy Performance Reseeding Script
 * 
 * This script:
 * 1. Dumps the current strategy_performance table
 * 2. Clears the table
 * 3. Runs 10 backtests for each strategy
 * 4. Seeds the table with fresh performance data
 */

import { db, isPostgres } from '../api/initDb';
import { StrategyPerformance } from '../api/models/StrategyPerformance';
import { 
  runMeanReversionStrategy,
  runMomentumStrategy,
  runMovingAverageCrossoverStrategy,
  runBollingerBandsStrategy,
  runBreakoutStrategy
} from '../src/strategies';

// Mock data generator for backtesting
function generateMockData(length: number, startPrice = 100, volatility = 0.02) {
  const data = [];
  let price = startPrice;
  const baseTime = new Date('2023-01-01T09:30:00Z');
  
  for (let i = 0; i < length; i++) {
    // Generate realistic price movement with trend and noise
    const trend = Math.sin(i / 50) * 0.001; // Long-term trend
    const noise = (Math.random() - 0.5) * volatility; // Random noise
    const change = trend + noise;
    
    const open = price;
    price = Math.max(1, price * (1 + change));
    const high = Math.max(open, price) * (1 + Math.random() * 0.01);
    const low = Math.min(open, price) * (1 - Math.random() * 0.01);
    
    const timestamp = new Date(baseTime.getTime() + i * 24 * 60 * 60 * 1000); // Daily data
    
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

// Strategy configurations for testing
const strategyConfigs = [
  {
    name: 'MeanReversion',
    type: 'MEAN_REVERSION',
    runner: runMeanReversionStrategy,
    configs: [
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
    ]
  },
  {
    name: 'Momentum',
    type: 'MOMENTUM',
    runner: runMomentumStrategy,
    configs: [
      { rsiWindow: 14, rsiOverbought: 70, rsiOversold: 30, momentumWindow: 10, momentumThreshold: 0.02 },
      { rsiWindow: 12, rsiOverbought: 75, rsiOversold: 25, momentumWindow: 8, momentumThreshold: 0.015 },
      { rsiWindow: 16, rsiOverbought: 65, rsiOversold: 35, momentumWindow: 12, momentumThreshold: 0.025 },
      { rsiWindow: 10, rsiOverbought: 80, rsiOversold: 20, momentumWindow: 6, momentumThreshold: 0.01 },
      { rsiWindow: 18, rsiOverbought: 60, rsiOversold: 40, momentumWindow: 14, momentumThreshold: 0.03 },
      { rsiWindow: 13, rsiOverbought: 72, rsiOversold: 28, momentumWindow: 9, momentumThreshold: 0.018 },
      { rsiWindow: 15, rsiOverbought: 68, rsiOversold: 32, momentumWindow: 11, momentumThreshold: 0.022 },
      { rsiWindow: 11, rsiOverbought: 78, rsiOversold: 22, momentumWindow: 7, momentumThreshold: 0.012 },
      { rsiWindow: 17, rsiOverbought: 62, rsiOversold: 38, momentumWindow: 13, momentumThreshold: 0.028 },
      { rsiWindow: 9, rsiOverbought: 85, rsiOversold: 15, momentumWindow: 5, momentumThreshold: 0.008 }
    ]
  },
  {
    name: 'MovingAverageCrossover',
    type: 'MOVING_AVERAGE',
    runner: runMovingAverageCrossoverStrategy,
    configs: [
      { fastWindow: 5, slowWindow: 15, maType: 'SMA' },
      { fastWindow: 8, slowWindow: 21, maType: 'EMA' },
      { fastWindow: 3, slowWindow: 10, maType: 'SMA' },
      { fastWindow: 10, slowWindow: 25, maType: 'EMA' },
      { fastWindow: 6, slowWindow: 18, maType: 'SMA' },
      { fastWindow: 4, slowWindow: 12, maType: 'EMA' },
      { fastWindow: 7, slowWindow: 20, maType: 'SMA' },
      { fastWindow: 9, slowWindow: 22, maType: 'EMA' },
      { fastWindow: 2, slowWindow: 8, maType: 'SMA' },
      { fastWindow: 12, slowWindow: 30, maType: 'EMA' }
    ]
  },
  {
    name: 'BollingerBands',
    type: 'BOLLINGER_BANDS',
    runner: runBollingerBandsStrategy,
    configs: [
      { window: 20, multiplier: 2.0, maType: 'SMA' },
      { window: 15, multiplier: 1.5, maType: 'EMA' },
      { window: 25, multiplier: 2.5, maType: 'SMA' },
      { window: 18, multiplier: 1.8, maType: 'EMA' },
      { window: 22, multiplier: 2.2, maType: 'SMA' },
      { window: 12, multiplier: 1.2, maType: 'EMA' },
      { window: 30, multiplier: 3.0, maType: 'SMA' },
      { window: 16, multiplier: 1.6, maType: 'EMA' },
      { window: 24, multiplier: 2.4, maType: 'SMA' },
      { window: 14, multiplier: 1.4, maType: 'EMA' }
    ]
  },
  {
    name: 'Breakout',
    type: 'BREAKOUT',
    runner: runBreakoutStrategy,
    configs: [
      { lookbackWindow: 20, breakoutThreshold: 0.01, minVolumeRatio: 1.5, confirmationPeriod: 2 },
      { lookbackWindow: 15, breakoutThreshold: 0.015, minVolumeRatio: 1.2, confirmationPeriod: 1 },
      { lookbackWindow: 25, breakoutThreshold: 0.008, minVolumeRatio: 2.0, confirmationPeriod: 3 },
      { lookbackWindow: 18, breakoutThreshold: 0.012, minVolumeRatio: 1.8, confirmationPeriod: 2 },
      { lookbackWindow: 22, breakoutThreshold: 0.009, minVolumeRatio: 1.6, confirmationPeriod: 2 },
      { lookbackWindow: 12, breakoutThreshold: 0.02, minVolumeRatio: 1.0, confirmationPeriod: 1 },
      { lookbackWindow: 30, breakoutThreshold: 0.006, minVolumeRatio: 2.5, confirmationPeriod: 4 },
      { lookbackWindow: 16, breakoutThreshold: 0.018, minVolumeRatio: 1.3, confirmationPeriod: 1 },
      { lookbackWindow: 24, breakoutThreshold: 0.01, minVolumeRatio: 1.9, confirmationPeriod: 3 },
      { lookbackWindow: 14, breakoutThreshold: 0.016, minVolumeRatio: 1.4, confirmationPeriod: 2 }
    ]
  }
];

// Test symbols and date ranges
const testSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];
const dateRanges = [
  { start: '2023-01-01', end: '2023-06-30' },
  { start: '2023-07-01', end: '2023-12-31' },
  { start: '2022-01-01', end: '2022-12-31' },
  { start: '2023-03-01', end: '2023-08-31' },
  { start: '2022-06-01', end: '2023-05-31' }
];

async function dumpStrategyPerformanceTable() {
  console.log('📊 Dumping strategy_performance table...');
  
  try {
    const query = isPostgres 
      ? 'SELECT * FROM strategy_performance ORDER BY created_at DESC'
      : 'SELECT * FROM strategy_performance ORDER BY created_at DESC';
    
    const result = await db.query(query);
    
    console.log(`📋 Found ${result.rows.length} records in strategy_performance table`);
    
    if (result.rows.length > 0) {
      console.log('\n📄 Sample records:');
      result.rows.slice(0, 3).forEach((row: any, index: number) => {
        console.log(`${index + 1}. ${row.strategy_name} - ${row.execution_type} - Return: ${row.total_return.toFixed(2)}%`);
      });
    }
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error dumping table:', error);
    throw error;
  }
}

async function clearStrategyPerformanceTable() {
  console.log('🗑️  Clearing strategy_performance table...');
  
  try {
    const query = isPostgres 
      ? 'DELETE FROM strategy_performance'
      : 'DELETE FROM strategy_performance';
    
    const result = await db.query(query);
    console.log(`✅ Cleared ${result.rowCount} records from strategy_performance table`);
  } catch (error) {
    console.error('❌ Error clearing table:', error);
    throw error;
  }
}

async function runBacktestAndSave(
  strategyName: string,
  strategyType: string,
  config: any,
  symbol: string,
  dateRange: { start: string; end: string },
  userId: number = 1
) {
  try {
    const strategyConfig = strategyConfigs.find(s => s.name === strategyName);
    if (!strategyConfig) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    // Generate mock data for the date range
    const daysDiff = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24));
    const mockData = generateMockData(daysDiff, 100 + Math.random() * 50, 0.02 + Math.random() * 0.01);

    // Run the strategy
    const result = strategyConfig.runner(symbol, mockData, {
      ...config,
      initialCapital: 100000,
      sharesPerTrade: 100
    });

    // Calculate additional metrics
    const initialCapital = 100000; // From config
    const totalReturnDollar = result.finalPortfolioValue - initialCapital;
    
    // Calculate profit factor from trades
    const winningTrades = result.trades.filter((t: any) => t.pnl && t.pnl > 0);
    const losingTrades = result.trades.filter((t: any) => t.pnl && t.pnl < 0);
    const totalWins = winningTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
    const totalLosses = losingTrades.reduce((sum: number, t: any) => sum + Math.abs(t.pnl || 0), 0);
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 10 : 0;

    // Prepare performance data
    const performanceData = {
      user_id: userId,
      strategy_name: strategyName,
      strategy_type: strategyType,
      execution_type: 'BACKTEST' as const,
      symbols: [symbol],
      start_date: dateRange.start,
      end_date: dateRange.end,
      initial_capital: initialCapital,
      final_capital: result.finalPortfolioValue,
      total_return: result.totalReturn,
      total_return_dollar: totalReturnDollar,
      max_drawdown: result.maxDrawdown,
      sharpe_ratio: undefined, // Not available in basic result
      sortino_ratio: undefined, // Not available in basic result
      win_rate: result.winRate,
      total_trades: result.trades.length,
      winning_trades: winningTrades.length,
      losing_trades: losingTrades.length,
      avg_win: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      avg_loss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      profit_factor: profitFactor,
      largest_win: winningTrades.length > 0 ? Math.max(...winningTrades.map((t: any) => t.pnl || 0)) : 0,
      largest_loss: losingTrades.length > 0 ? Math.min(...losingTrades.map((t: any) => t.pnl || 0)) : 0,
      avg_trade_duration: 24, // Default 24 hours
      volatility: 0.2, // Default 20% volatility
      beta: undefined, // Not calculated
      alpha: undefined, // Not calculated
      config: config,
      trades_data: result.trades,
      portfolio_history: (result as any).portfolioHistory || []
    };

    // Save to database
    await StrategyPerformance.create(performanceData);
    
    return {
      strategy: strategyName,
      symbol,
      return: result.totalReturn,
      trades: result.trades.length,
      winRate: result.winRate
    };
  } catch (error) {
    console.error(`❌ Error running backtest for ${strategyName} on ${symbol}:`, error);
    return null;
  }
}

async function reseedStrategyPerformance() {
  console.log('🌱 Reseeding strategy_performance table...');
  
  const results = [];
  let totalBacktests = 0;
  let successfulBacktests = 0;

  for (const strategyConfig of strategyConfigs) {
    console.log(`\n📈 Running backtests for ${strategyConfig.name}...`);
    
    for (let i = 0; i < 10; i++) {
      const config = strategyConfig.configs[i];
      const symbol = testSymbols[i % testSymbols.length];
      const dateRange = dateRanges[i % dateRanges.length];
      
      totalBacktests++;
      console.log(`  ${i + 1}/10: ${symbol} (${dateRange.start} to ${dateRange.end})`);
      
      const result = await runBacktestAndSave(
        strategyConfig.name,
        strategyConfig.type,
        config,
        symbol,
        dateRange
      );
      
      if (result) {
        successfulBacktests++;
        results.push(result);
        console.log(`    ✅ Return: ${result.return.toFixed(2)}%, Trades: ${result.trades}, Win Rate: ${result.winRate.toFixed(1)}%`);
      } else {
        console.log(`    ❌ Failed`);
      }
    }
  }

  console.log(`\n📊 Reseeding complete!`);
  console.log(`✅ Successful backtests: ${successfulBacktests}/${totalBacktests}`);
  console.log(`📈 Total strategies tested: ${strategyConfigs.length}`);
  console.log(`🎯 Total records created: ${results.length}`);

  return results;
}

async function main() {
  try {
    console.log('🚀 Starting Strategy Performance Reseeding Process');
    console.log('=' .repeat(60));

    // Step 1: Dump current table
    const currentData = await dumpStrategyPerformanceTable();
    
    // Step 2: Clear table
    await clearStrategyPerformanceTable();
    
    // Step 3: Reseed with fresh data
    const newResults = await reseedStrategyPerformance();
    
    // Step 4: Summary
    console.log('\n📋 Summary:');
    console.log(`📊 Previous records: ${currentData.length}`);
    console.log(`🆕 New records: ${newResults.length}`);
    console.log(`📈 Strategies tested: ${strategyConfigs.length}`);
    console.log(`🎯 Configurations per strategy: 10`);
    console.log(`📅 Date ranges used: ${dateRanges.length}`);
    console.log(`🏷️  Symbols tested: ${testSymbols.join(', ')}`);

    console.log('\n✅ Strategy Performance Reseeding Complete!');
    
  } catch (error) {
    console.error('❌ Error in reseeding process:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (db.end) {
      await db.end();
    }
  }
}

// Run the script
if (require.main === module) {
  main();
}
