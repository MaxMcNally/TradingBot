#!/usr/bin/env node

/**
 * Comprehensive Test Runner Script
 * This script runs all tests across the project with proper reporting
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
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

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}


// Test configuration
const testConfig = {
  backend: {
    command: 'yarn test:ci',
    cwd: process.cwd(),
    coverageDir: 'coverage',
    timeout: 60000
  },
  api: {
    command: 'npm test',
    cwd: path.join(process.cwd(), 'api'),
    coverageDir: 'coverage',
    timeout: 30000
  },
  frontend: {
    command: 'yarn test:run',
    cwd: path.join(process.cwd(), 'client'),
    coverageDir: 'coverage',
    timeout: 60000
  }
};

// Run a single test suite
function runTestSuite(name, config) {
  return new Promise((resolve, reject) => {
    logStep(`Running ${name} tests`, `Starting ${name} test suite...`);
    
    const startTime = Date.now();
    let output = '';
    let errorOutput = '';
    
    try {
      const child = spawn('yarn', config.command.split(' '), {
        cwd: config.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });
      
      child.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });
      
      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          logSuccess(`${name} tests passed (${duration}ms)`);
          resolve({
            name,
            success: true,
            duration,
            output,
            errorOutput
          });
        } else {
          logError(`${name} tests failed (${duration}ms)`);
          reject({
            name,
            success: false,
            duration,
            output,
            errorOutput,
            exitCode: code
          });
        }
      });
      
      child.on('error', (error) => {
        logError(`Failed to start ${name} tests: ${error.message}`);
        reject({
          name,
          success: false,
          error: error.message
        });
      });
      
      // Set timeout
      setTimeout(() => {
        child.kill('SIGTERM');
        reject({
          name,
          success: false,
          error: 'Test timeout exceeded'
        });
      }, config.timeout);
      
    } catch (error) {
      logError(`Failed to run ${name} tests: ${error.message}`);
      reject({
        name,
        success: false,
        error: error.message
      });
    }
  });
}

// Run linting
function runLinting() {
  return new Promise((resolve, reject) => {
    logStep('Running linting', 'Checking code quality...');
    
    const startTime = Date.now();
    let allPassed = true;
    const results = [];
    
    // Backend linting
    try {
      log('Running backend linting...', 'blue');
      execSync('yarn lint', { 
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      logSuccess('Backend linting passed');
      results.push({ name: 'Backend', success: true });
    } catch (error) {
      logError('Backend linting failed');
      results.push({ name: 'Backend', success: false, error: error.message });
      allPassed = false;
    }
    
    // API linting
    try {
      log('Running API linting...', 'blue');
      execSync('yarn lint:api', { 
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      logSuccess('API linting passed');
      results.push({ name: 'API', success: true });
    } catch (error) {
      logError('API linting failed');
      results.push({ name: 'API', success: false, error: error.message });
      allPassed = false;
    }
    
    // Frontend linting
    try {
      log('Running frontend linting...', 'blue');
      execSync('yarn lint:client', { 
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      logSuccess('Frontend linting passed');
      results.push({ name: 'Frontend', success: true });
    } catch (error) {
      logError('Frontend linting failed');
      results.push({ name: 'Frontend', success: false, error: error.message });
      allPassed = false;
    }
    
    const duration = Date.now() - startTime;
    
    if (allPassed) {
      logSuccess(`All linting passed (${duration}ms)`);
      resolve({ success: true, duration, results });
    } else {
      logError(`Linting failed (${duration}ms)`);
      reject({ success: false, duration, results });
    }
  });
}

// Generate test report
function generateReport(testResults, lintResults) {
  logStep('Generating test report', 'Creating comprehensive test report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.length,
      passedTests: testResults.filter(r => r.success).length,
      failedTests: testResults.filter(r => !r.success).length,
      totalDuration: testResults.reduce((sum, r) => sum + (r.duration || 0), 0),
      lintingPassed: lintResults ? lintResults.success : false
    },
    results: testResults,
    linting: lintResults
  };
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logSuccess(`Test report saved to: ${reportPath}`);
  
  // Display summary
  log('\n📊 Test Summary:', 'bright');
  log(`   Total Test Suites: ${report.summary.totalTests}`, 'blue');
  log(`   Passed: ${report.summary.passedTests}`, 'green');
  log(`   Failed: ${report.summary.failedTests}`, report.summary.failedTests > 0 ? 'red' : 'green');
  log(`   Total Duration: ${report.summary.totalDuration}ms`, 'blue');
  log(`   Linting: ${report.summary.lintingPassed ? 'PASSED' : 'FAILED'}`, report.summary.lintingPassed ? 'green' : 'red');
  
  return report;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const runLinting = !args.includes('--skip-lint');
  const runBackend = !args.includes('--skip-backend');
  const runApi = !args.includes('--skip-api');
  const runFrontend = !args.includes('--skip-frontend');
  const parallel = args.includes('--parallel');
  
  try {
    log('🧪 Starting comprehensive test run...', 'bright');
    
    const testResults = [];
    let lintResults = null;
    
    // Run linting first
    if (runLinting) {
      try {
        lintResults = await runLinting();
      } catch (error) {
        lintResults = error;
        if (!args.includes('--continue-on-lint-fail')) {
          throw new Error('Linting failed and --continue-on-lint-fail not specified');
        }
      }
    }
    
    // Run tests
    const testPromises = [];
    
    if (runBackend) {
      if (parallel) {
        testPromises.push(runTestSuite('Backend', testConfig.backend));
      } else {
        const result = await runTestSuite('Backend', testConfig.backend);
        testResults.push(result);
      }
    }
    
    if (runApi) {
      if (parallel) {
        testPromises.push(runTestSuite('API', testConfig.api));
      } else {
        const result = await runTestSuite('API', testConfig.api);
        testResults.push(result);
      }
    }
    
    if (runFrontend) {
      if (parallel) {
        testPromises.push(runTestSuite('Frontend', testConfig.frontend));
      } else {
        const result = await runTestSuite('Frontend', testConfig.frontend);
        testResults.push(result);
      }
    }
    
    // Wait for parallel tests
    if (parallel && testPromises.length > 0) {
      const parallelResults = await Promise.allSettled(testPromises);
      parallelResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          testResults.push(result.value);
        } else {
          testResults.push(result.reason);
        }
      });
    }
    
    // Generate report
    // const report = generateReport(testResults, lintResults); // Unused variable
    
    // Check if all tests passed
    const allTestsPassed = testResults.every(r => r.success);
    const lintingPassed = !runLinting || (lintResults && lintResults.success);
    
    if (allTestsPassed && lintingPassed) {
      log('\n🎉 All tests passed successfully!', 'green');
      process.exit(0);
    } else {
      log('\n❌ Some tests failed', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Test run failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    log('Comprehensive Test Runner', 'bright');
    log('\nUsage: node scripts/run-tests.js [options]', 'blue');
    log('\nOptions:', 'cyan');
    log('  --help, -h              Show this help message', 'blue');
    log('  --skip-lint             Skip linting', 'blue');
    log('  --skip-backend          Skip backend tests', 'blue');
    log('  --skip-api              Skip API tests', 'blue');
    log('  --skip-frontend         Skip frontend tests', 'blue');
    log('  --parallel              Run tests in parallel', 'blue');
    log('  --continue-on-lint-fail Continue even if linting fails', 'blue');
    process.exit(0);
  }
  
  main();
}

module.exports = {
  runTestSuite,
  runLinting,
  generateReport
};
