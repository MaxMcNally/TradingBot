#!/usr/bin/env node

const axios = require('axios');

// Configuration - smaller set for faster execution
const API_BASE = 'http://localhost:8001/api';
const STRATEGIES = [
  'meanReversion',
  'movingAverageCrossover', 
  'momentum',
  'bollingerBands'
];

const SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'SPY', 'QQQ', 'NVDA'
];

const TIMEFRAMES = [
  { start: '2023-01-01', end: '2023-03-31', name: 'Q1 2023' },
  { start: '2023-04-01', end: '2023-06-30', name: 'Q2 2023' },
  { start: '2023-07-01', end: '2023-09-30', name: 'Q3 2023' },
  { start: '2023-10-01', end: '2023-12-31', name: 'Q4 2023' },
  { start: '2024-01-01', end: '2024-03-31', name: 'Q1 2024' },
  { start: '2024-04-01', end: '2024-06-30', name: 'Q2 2024' }
];

// Strategy-specific parameters - fewer variations
const STRATEGY_PARAMS = {
  meanReversion: [
    { window: 10, threshold: 0.02 },
    { window: 20, threshold: 0.03 }
  ],
  movingAverageCrossover: [
    { fastWindow: 5, slowWindow: 15, maType: 'SMA' },
    { fastWindow: 10, slowWindow: 20, maType: 'EMA' }
  ],
  momentum: [
    { rsiWindow: 14, rsiOverbought: 70, rsiOversold: 30, momentumWindow: 10, momentumThreshold: 0.02 },
    { rsiWindow: 21, rsiOverbought: 75, rsiOversold: 25, momentumWindow: 14, momentumThreshold: 0.03 }
  ],
  bollingerBands: [
    { window: 20, multiplier: 2.0, maType: 'SMA' },
    { window: 15, multiplier: 1.5, maType: 'EMA' }
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

// Check if a performance record already exists
async function checkExistingRecord(token, strategy, symbol, timeframe, params) {
  try {
    const response = await axios.get(`${API_BASE}/admin/performance/overview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        timeframe: 'all',
        strategyType: strategy
      }
    });

    if (response.data.success && response.data.data) {
      const records = response.data.data.recentExecutions || [];
      console.log(`🔍 Checking ${records.length} existing records for ${strategy} on ${symbol} (${timeframe.name})`);
      
      // Check if a record exists with matching criteria
      const exists = records.some(record => {
        // Parse symbols if it's a JSON string
        let symbols = record.symbols;
        if (typeof symbols === 'string') {
          try {
            symbols = JSON.parse(symbols);
          } catch (e) {
            symbols = [symbols];
          }
        }
        
        // Parse config if it's a JSON string
        let config = record.config;
        if (typeof config === 'string') {
          try {
            config = JSON.parse(config);
          } catch (e) {
            config = {};
          }
        }
        
        // Check basic criteria
        const basicMatch = record.strategy_name === strategy &&
          symbols.includes(symbol) &&
          record.start_date === timeframe.start &&
          record.end_date === timeframe.end;
        
        if (basicMatch) {
          console.log(`🎯 Found matching record: ${record.strategy_name} on ${symbols} (${record.start_date} to ${record.end_date})`);
          console.log(`📋 Record config keys: ${Object.keys(config).join(', ')}`);
          console.log(`📋 Params keys: ${Object.keys(params).join(', ')}`);
          
          // Check if the key parameters match (ignore extra fields like provider, etc.)
          const keyParams = Object.keys(params);
          const paramMatch = keyParams.every(key => {
            const matches = config[key] === params[key];
            if (!matches) {
              console.log(`❌ Param mismatch: ${key} - record: ${config[key]}, params: ${params[key]}`);
            }
            return matches;
          });
          
          console.log(`✅ Parameter match: ${paramMatch}`);
          return paramMatch;
        }
        
        return false;
      });
      
      console.log(`🔍 Duplicate check result: ${exists}`);
      return exists;
    }
    return false;
  } catch (error) {
    console.log(`Warning: Could not check existing records for ${strategy} on ${symbol}: ${error.message}`);
    return false; // If we can't check, assume it doesn't exist and run the test
  }
}

// Run a single backtest
async function runBacktest(token, strategy, symbol, timeframe, params) {
  // First check if this test already exists
  const exists = await checkExistingRecord(token, strategy, symbol, timeframe, params);
  if (exists) {
    console.log(`⏭️  Skipping ${strategy} on ${symbol} (${timeframe.name}) - already exists`);
    return { skipped: true };
  }

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
    console.log(`Running ${strategy} on ${symbol} (${timeframe.name})`);
    
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
  let skippedCount = 0;
  let totalCount = 0;

  for (const paramSet of params) {
    for (const symbol of SYMBOLS) {
      for (const timeframe of TIMEFRAMES) {
        const result = await runBacktest(token, strategy, symbol, timeframe, paramSet);
        if (result) {
          if (result.skipped) {
            skippedCount++;
          } else {
            successCount++;
          }
        }
        totalCount++;
        
        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  console.log(`\n📊 ${strategy} completed: ${successCount} successful, ${skippedCount} skipped, ${totalCount} total`);
  return { successCount, skippedCount, totalCount };
}

// Main execution
async function main() {
  console.log('🎯 Starting FAST performance data population...');
  console.log(`📈 Strategies: ${STRATEGIES.length}`);
  console.log(`📊 Symbols: ${SYMBOLS.length}`);
  console.log(`⏰ Timeframes: ${TIMEFRAMES.length}`);
  
  const totalTests = STRATEGIES.length * Object.values(STRATEGY_PARAMS).reduce((sum, params) => sum + params.length, 0) * SYMBOLS.length * TIMEFRAMES.length;
  console.log(`🔢 Total backtests: ${totalTests}`);
  
  try {
    // Login
    console.log('\n🔐 Logging in...');
    const token = await login();
    console.log('✅ Login successful');

    let totalSuccess = 0;
    let totalSkipped = 0;
    let totalTests = 0;

    // Run backtests for each strategy
    for (const strategy of STRATEGIES) {
      const result = await runStrategyBacktests(token, strategy);
      totalSuccess += result.successCount;
      totalSkipped += result.skippedCount;
      totalTests += result.totalCount;
      
      // Add delay between strategies
      console.log('⏳ Waiting 1 second before next strategy...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Performance data population completed!');
    console.log(`📊 Total backtests: ${totalTests}`);
    console.log(`✅ Successful: ${totalSuccess}`);
    console.log(`⏭️  Skipped (already exist): ${totalSkipped}`);
    console.log(`❌ Failed: ${totalTests - totalSuccess - totalSkipped}`);
    console.log(`📈 Success rate: ${((totalSuccess / totalTests) * 100).toFixed(1)}%`);
    console.log(`⏭️  Skip rate: ${((totalSkipped / totalTests) * 100).toFixed(1)}%`);
    
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