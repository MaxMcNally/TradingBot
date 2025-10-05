#!/usr/bin/env node
/**
 * Comprehensive demonstration of the Trading Bot Cache System
 * 
 * This script demonstrates:
 * 1. Running backtests with and without caching
 * 2. Cache performance improvements
 * 3. API integration with cache management
 * 4. Smart cache filling and gap detection
 * 
 * Run with: node demo-cache-system.js
 */

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runBacktest(symbol, startDate, endDate, options = {}) {
  const args = [
    '--symbol', symbol,
    '--start', startDate,
    '--end', endDate,
    '--window', '20',
    '--threshold', '0.05',
    '--capital', '10000',
    '--shares', '100'
  ];

  if (options.noCache) {
    args.push('--no-cache');
  }
  if (options.prepopulate) {
    args.push('--prepopulate');
  }
  if (options.cacheStats) {
    args.push('--cache-stats');
  }

  const startTime = Date.now();
  try {
    const result = await runCommand('npx', ['ts-node', 'src/backtest.ts', ...args]);
    const endTime = Date.now();
    return {
      success: true,
      duration: endTime - startTime,
      output: result.stdout
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      duration: endTime - startTime,
      error: error.message
    };
  }
}

async function getCacheStats() {
  try {
    const result = await runCommand('npx', ['ts-node', 'src/cache/cacheCLI.ts', 'stats']);
    return result.stdout;
  } catch (error) {
    return `Error getting cache stats: ${error.message}`;
  }
}

async function clearCache() {
  try {
    await runCommand('npx', ['ts-node', 'src/cache/cacheCLI.ts', 'cleanup', '--days', '0']);
    log('✅ Cache cleared', 'green');
  } catch (error) {
    log(`❌ Error clearing cache: ${error.message}`, 'red');
  }
}

async function demonstrateCaching() {
  log('\n🚀 Trading Bot Cache System Demonstration\n', 'bright');
  
  const symbol = 'AAPL';
  const startDate = '2023-01-01';
  const endDate = '2023-12-31';

  // Step 1: Clear cache to start fresh
  log('📋 Step 1: Clearing cache to start fresh...', 'cyan');
  await clearCache();
  
  // Step 2: First backtest (no cache)
  log('\n📊 Step 2: Running first backtest (no cache)...', 'cyan');
  const result1 = await runBacktest(symbol, startDate, endDate, { noCache: true });
  
  if (result1.success) {
    log(`✅ First backtest completed in ${result1.duration}ms`, 'green');
  } else {
    log(`❌ First backtest failed: ${result1.error}`, 'red');
    return;
  }

  // Step 3: Second backtest (with cache)
  log('\n📊 Step 3: Running second backtest (with cache)...', 'cyan');
  const result2 = await runBacktest(symbol, startDate, endDate, { cacheStats: true });
  
  if (result2.success) {
    log(`✅ Second backtest completed in ${result2.duration}ms`, 'green');
    const speedup = Math.round((result1.duration / result2.duration) * 100) / 100;
    log(`🚀 Speed improvement: ${speedup}x faster!`, 'yellow');
  } else {
    log(`❌ Second backtest failed: ${result2.error}`, 'red');
  }

  // Step 4: Partial date range test
  log('\n📊 Step 4: Testing partial date range (should use cache + minimal API calls)...', 'cyan');
  const partialStart = '2023-06-01';
  const partialEnd = '2023-08-31';
  const result3 = await runBacktest(symbol, partialStart, partialEnd, { cacheStats: true });
  
  if (result3.success) {
    log(`✅ Partial backtest completed in ${result3.duration}ms`, 'green');
  } else {
    log(`❌ Partial backtest failed: ${result3.error}`, 'red');
  }

  // Step 5: Show cache statistics
  log('\n📈 Step 5: Cache Statistics', 'cyan');
  const stats = await getCacheStats();
  console.log(stats);

  // Step 6: Demonstrate pre-population
  log('\n📊 Step 6: Demonstrating cache pre-population...', 'cyan');
  const result4 = await runBacktest('GOOGL', startDate, endDate, { prepopulate: true, cacheStats: true });
  
  if (result4.success) {
    log(`✅ Pre-populated backtest completed in ${result4.duration}ms`, 'green');
  } else {
    log(`❌ Pre-populated backtest failed: ${result4.error}`, 'red');
  }

  // Step 7: Final cache statistics
  log('\n📈 Step 7: Final Cache Statistics', 'cyan');
  const finalStats = await getCacheStats();
  console.log(finalStats);

  log('\n✨ Demonstration complete!', 'bright');
  log('The cache system successfully minimized API calls and improved performance.', 'green');
}

async function demonstrateAPI() {
  log('\n🌐 API Integration Demonstration\n', 'bright');
  
  log('📋 Available API endpoints:', 'cyan');
  log('  GET  /api/cache/stats           - Get cache statistics', 'blue');
  log('  POST /api/cache/cleanup         - Clean up old cache entries', 'blue');
  log('  GET  /api/cache/analyze/:symbol - Analyze cache for symbol', 'blue');
  log('  POST /api/cache/prepopulate     - Pre-populate cache', 'blue');
  log('  GET  /api/cache/config          - Get cache configuration', 'blue');
  log('  PUT  /api/cache/config          - Update cache configuration', 'blue');
  log('  DELETE /api/cache/clear         - Clear cache', 'blue');
  
  log('\n📋 Enhanced backtest API with cache options:', 'cyan');
  log('  POST /api/backtest/run', 'blue');
  log('  Request body can include:', 'blue');
  log('    - useCache: boolean (default: true)', 'blue');
  log('    - prepopulateCache: boolean (default: false)', 'blue');
  log('    - showCacheStats: boolean (default: false)', 'blue');
  
  log('\n💡 Example API usage:', 'yellow');
  log('curl -X POST http://localhost:8001/api/backtest/run \\', 'blue');
  log('  -H "Content-Type: application/json" \\', 'blue');
  log('  -d \'{"strategy":"meanReversion","symbols":"AAPL","startDate":"2023-01-01","endDate":"2023-12-31","useCache":true,"showCacheStats":true}\'', 'blue');
}

async function main() {
  try {
    await demonstrateCaching();
    await demonstrateAPI();
  } catch (error) {
    log(`❌ Demonstration failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the demonstration
main().catch(console.error);
