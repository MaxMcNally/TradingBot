#!/usr/bin/env node

/**
 * Test script for the live trading bot
 * 
 * This script tests the live trading bot with paper trading mode
 * using the PolygonProvider for real-time data streaming.
 */

const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const testConfig = {
  TRADING_MODE: 'PAPER',
  INITIAL_CASH: '10000',
  SYMBOLS: 'AAPL,TSLA',
  STRATEGY_TYPE: 'MovingAverage',
  DATA_PROVIDER: 'polygon',
  POLYGON_API_KEY: process.env.POLYGON_API_KEY || 'your_polygon_api_key_here',
  MA_SHORT_WINDOW: '5',
  MA_LONG_WINDOW: '10',
  TRADING_USERNAME: 'admin',
  TRADING_PASSWORD: 'admin123'
};

console.log('🤖 Starting Live Trading Bot Test...');
console.log('📊 Configuration:');
console.log(`   Mode: ${testConfig.TRADING_MODE}`);
console.log(`   Initial Cash: $${testConfig.INITIAL_CASH}`);
console.log(`   Symbols: ${testConfig.SYMBOLS}`);
console.log(`   Strategy: ${testConfig.STRATEGY_TYPE}`);
console.log(`   Data Provider: ${testConfig.DATA_PROVIDER}`);
console.log('');

// Set environment variables
const env = {
  ...process.env,
  ...testConfig
};

// Start the trading bot
const botProcess = spawn('npx', ['ts-node', 'src/bot.ts'], {
  env,
  stdio: 'inherit',
  cwd: path.join(__dirname)
});

// Handle process events
botProcess.on('close', (code) => {
  console.log(`\n🛑 Trading bot process exited with code ${code}`);
  if (code === 0) {
    console.log('✅ Test completed successfully');
  } else {
    console.log('❌ Test failed');
  }
});

botProcess.on('error', (error) => {
  console.error('❌ Failed to start trading bot:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test...');
  botProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down test...');
  botProcess.kill('SIGTERM');
});

console.log('🚀 Trading bot started. Press Ctrl+C to stop the test.');
console.log('📊 Monitor the output above for trading activity...');
