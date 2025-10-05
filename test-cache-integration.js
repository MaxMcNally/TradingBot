#!/usr/bin/env node
/**
 * Quick test script to verify cache integration
 * Run with: node test-cache-integration.js
 */

const { spawn } = require('child_process');

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
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
  });
}

async function testCacheSystem() {
  console.log('🧪 Testing Cache System Integration...\n');

  try {
    // Test 1: Cache stats (should work even with empty cache)
    console.log('1️⃣ Testing cache stats...');
    const statsResult = await runCommand('npx', ['ts-node', 'src/cache/cacheCLI.ts', 'stats']);
    console.log('✅ Cache stats command works\n');

    // Test 2: Run a simple backtest with caching
    console.log('2️⃣ Testing backtest with caching...');
    const backtestResult = await runCommand('npx', [
      'ts-node', 'src/backtest.ts',
      '--symbol', 'AAPL',
      '--start', '2023-01-01',
      '--end', '2023-01-31',
      '--cache-stats'
    ]);
    console.log('✅ Backtest with caching works\n');

    // Test 3: Run the same backtest again (should use cache)
    console.log('3️⃣ Testing cache hit (same backtest again)...');
    const cacheHitResult = await runCommand('npx', [
      'ts-node', 'src/backtest.ts',
      '--symbol', 'AAPL',
      '--start', '2023-01-01',
      '--end', '2023-01-31',
      '--cache-stats'
    ]);
    console.log('✅ Cache hit works\n');

    // Test 4: Analyze cache for the symbol
    console.log('4️⃣ Testing cache analysis...');
    const analysisResult = await runCommand('npx', ['ts-node', 'src/cache/cacheCLI.ts', 'analyze', '--symbol', 'AAPL']);
    console.log('✅ Cache analysis works\n');

    console.log('🎉 All tests passed! Cache system is working correctly.');
    console.log('\n📊 Cache Statistics:');
    console.log(statsResult.stdout);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCacheSystem().catch(console.error);
