#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:8001/api';
const STRATEGIES = [
  'meanReversion',
  'movingAverageCrossover', 
  'momentum',
  'bollingerBands',
  'breakout',
  'sentimentAnalysis'
];

const SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
  'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'ARKK', 'GLD', 'SLV',
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC',
  'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR'
];

const TIMEFRAMES = [
  { start: '2023-01-01', end: '2023-03-31', name: 'Q1 2023' },
  { start: '2023-04-01', end: '2023-06-30', name: 'Q2 2023' },
  { start: '2023-07-01', end: '2023-09-30', name: 'Q3 2023' },
  { start: '2023-10-01', end: '2023-12-31', name: 'Q4 2023' },
  { start: '2024-01-01', end: '2024-03-31', name: 'Q1 2024' },
  { start: '2024-04-01', end: '2024-06-30', name: 'Q2 2024' },
  { start: '2024-07-01', end: '2024-09-30', name: 'Q3 2024' },
  { start: '2024-10-01', end: '2024-12-31', name: 'Q4 2024' }
];

// Strategy-specific parameters
const STRATEGY_PARAMS = {
  meanReversion: [
    { window: 10, threshold: 0.02 },
    { window: 15, threshold: 0.03 },
    { window: 20, threshold: 0.05 },
    { window: 25, threshold: 0.04 }
  ],
  movingAverageCrossover: [
    { fastWindow: 5, slowWindow: 15, maType: 'SMA' },
    { fastWindow: 10, slowWindow: 20, maType: 'SMA' },
    { fastWindow: 5, slowWindow: 20, maType: 'EMA' },
    { fastWindow: 8, slowWindow: 21, maType: 'EMA' }
  ],
  momentum: [
    { rsiWindow: 14, rsiOverbought: 70, rsiOversold: 30, momentumWindow: 10, momentumThreshold: 0.02 },
    { rsiWindow: 21, rsiOverbought: 75, rsiOversold: 25, momentumWindow: 14, momentumThreshold: 0.03 },
    { rsiWindow: 10, rsiOverbought: 80, rsiOversold: 20, momentumWindow: 7, momentumThreshold: 0.015 }
  ],
  bollingerBands: [
    { window: 20, multiplier: 2.0, maType: 'SMA' },
    { window: 15, multiplier: 1.5, maType: 'SMA' },
    { window: 25, multiplier: 2.5, maType: 'EMA' },
    { window: 30, multiplier: 2.0, maType: 'EMA' }
  ],
  breakout: [
    { lookbackWindow: 20, breakoutThreshold: 0.01, minVolumeRatio: 1.5, confirmationPeriod: 2 },
    { lookbackWindow: 15, breakoutThreshold: 0.015, minVolumeRatio: 1.2, confirmationPeriod: 1 },
    { lookbackWindow: 25, breakoutThreshold: 0.008, minVolumeRatio: 2.0, confirmationPeriod: 3 }
  ],
  sentimentAnalysis: [
    { lookbackDays: 3, pollIntervalMinutes: 0, minArticles: 2, buyThreshold: 0.4, sellThreshold: -0.4, titleWeight: 2.0, recencyHalfLifeHours: 12, newsSource: 'yahoo' },
    { lookbackDays: 5, pollIntervalMinutes: 0, minArticles: 3, buyThreshold: 0.3, sellThreshold: -0.3, titleWeight: 1.5, recencyHalfLifeHours: 24, newsSource: 'yahoo' },
    { lookbackDays: 2, pollIntervalMinutes: 0, minArticles: 1, buyThreshold: 0.5, sellThreshold: -0.5, titleWeight: 3.0, recencyHalfLifeHours: 6, newsSource: 'yahoo' }
  ]
};

// Login to get auth token
async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'maxmcnally_test',
      password: 'test123'
    });
    
    if (response.data.success) {
      return response.data.token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
}

// Run a single backtest
async function runBacktest(token, strategy, symbol, timeframe, params) {
  const backtestData = {
    strategy,
    symbols: [symbol],
    startDate: timeframe.start,
    endDate: timeframe.end,
    provider: 'yahoo',
    initialCapital: 10000,
    sharesPerTrade: 100,
    useCache: true,
    ...params
  };

  try {
    console.log(`Running ${strategy} on ${symbol} (${timeframe.name}) with params:`, params);
    
    const response = await axios.post(`${API_BASE}/backtest/run`, backtestData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const result = response.data.data;
      console.log(`✅ ${strategy} on ${symbol}: Return: ${(result.totalReturn * 100).toFixed(2)}%, Win Rate: ${(result.winRate * 100).toFixed(1)}%, Trades: ${result.totalTrades}`);
      return result;
    } else {
      console.log(`❌ ${strategy} on ${symbol}: ${response.data.error}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${strategy} on ${symbol}: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

// Run backtests for a strategy
async function runStrategyBacktests(token, strategy) {
  console.log(`\n🚀 Starting backtests for ${strategy}...`);
  const params = STRATEGY_PARAMS[strategy];
  let successCount = 0;
  let totalCount = 0;

  for (const paramSet of params) {
    for (const symbol of SYMBOLS.slice(0, 8)) { // Use first 8 symbols to keep it manageable
      for (const timeframe of TIMEFRAMES.slice(0, 4)) { // Use first 4 timeframes
        const result = await runBacktest(token, strategy, symbol, timeframe, paramSet);
        if (result) {
          successCount++;
        }
        totalCount++;
        
        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  console.log(`\n📊 ${strategy} completed: ${successCount}/${totalCount} successful backtests`);
  return { successCount, totalCount };
}

// Main execution
async function main() {
  console.log('🎯 Starting performance data population...');
  console.log(`📈 Strategies: ${STRATEGIES.length}`);
  console.log(`📊 Symbols: ${SYMBOLS.length}`);
  console.log(`⏰ Timeframes: ${TIMEFRAMES.length}`);
  
  try {
    // Login
    console.log('\n🔐 Logging in...');
    const token = await login();
    console.log('✅ Login successful');

    let totalSuccess = 0;
    let totalTests = 0;

    // Run backtests for each strategy
    for (const strategy of STRATEGIES) {
      const result = await runStrategyBacktests(token, strategy);
      totalSuccess += result.successCount;
      totalTests += result.totalCount;
      
      // Add delay between strategies
      console.log('⏳ Waiting 2 seconds before next strategy...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n🎉 Performance data population completed!');
    console.log(`📊 Total backtests: ${totalTests}`);
    console.log(`✅ Successful: ${totalSuccess}`);
    console.log(`❌ Failed: ${totalTests - totalSuccess}`);
    console.log(`📈 Success rate: ${((totalSuccess / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n🔍 Check the Admin Dashboard to see the populated data!');
    
  } catch (error) {
    console.error('❌ Error during execution:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

// Run the script
main().catch(console.error);
