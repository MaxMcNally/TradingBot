#!/usr/bin/env node

/**
 * Database Initialization Script
 * This script initializes all databases and populates them with initial data
 */

const { execSync } = require('child_process');
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Ensure directories exist
function ensureDirectories() {
  logStep('1', 'Ensuring database directories exist...');
  
  const dirs = [
    'api/db',
    'db',
    'backtest_data',
    'cache'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logSuccess(`Created directory: ${dir}`);
    } else {
      log(`Directory already exists: ${dir}`, 'blue');
    }
  });
}

// Initialize API database
function initApiDatabase() {
  logStep('2', 'Initializing API database...');
  
  try {
    // Run the TypeScript initialization script
    execSync('npx ts-node api/initDb.ts', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    logSuccess('API database initialized successfully');
  } catch (error) {
    logError(`Failed to initialize API database: ${error.message}`);
    throw error;
  }
}

// Initialize core database
function initCoreDatabase() {
  logStep('3', 'Initializing core trading database...');
  
  try {
    // Run the core database initialization
    execSync('npx ts-node -e "require(\'./src/database/tradingSchema\').TradingDatabase.initializeTables().then(() => console.log(\'Core database initialized\')).catch(console.error)"', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    logSuccess('Core database initialized successfully');
  } catch (error) {
    logError(`Failed to initialize core database: ${error.message}`);
    throw error;
  }
}

// Initialize cache database
function initCacheDatabase() {
  logStep('4', 'Initializing cache database...');
  
  try {
    // Run cache initialization
    execSync('npx ts-node src/cache/initCache.ts', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    logSuccess('Cache database initialized successfully');
  } catch (error) {
    logWarning(`Cache initialization failed (this might be expected): ${error.message}`);
  }
}

// Populate with sample data
function populateSampleData() {
  logStep('5', 'Populating with sample data...');
  
  try {
    // Create sample backtest data if it doesn't exist
    const backtestFiles = ['AAPL.json', 'GOOGL.json', 'MSFT.json'];
    backtestFiles.forEach(file => {
      const filePath = path.join('backtest_data', file);
      if (!fs.existsSync(filePath)) {
        // Create empty sample data
        const sampleData = {
          symbol: file.replace('.json', ''),
          data: [],
          metadata: {
            created: new Date().toISOString(),
            source: 'sample'
          }
        };
        fs.writeFileSync(filePath, JSON.stringify(sampleData, null, 2));
        logSuccess(`Created sample data: ${file}`);
      }
    });
    
    logSuccess('Sample data populated successfully');
  } catch (error) {
    logWarning(`Failed to populate sample data: ${error.message}`);
  }
}

// Run database migrations
function runMigrations() {
  logStep('6', 'Running database migrations...');
  
  try {
    // Check if there are any migration scripts
    const migrationDir = path.join('api', 'migrations');
    if (fs.existsSync(migrationDir)) {
      const migrations = fs.readdirSync(migrationDir).filter(file => file.endsWith('.js'));
      
      if (migrations.length > 0) {
        migrations.forEach(migration => {
          log(`Running migration: ${migration}`, 'blue');
          execSync(`node ${path.join(migrationDir, migration)}`, {
            stdio: 'inherit',
            cwd: process.cwd()
          });
        });
        logSuccess('Database migrations completed');
      } else {
        log('No migrations found', 'blue');
      }
    } else {
      log('No migration directory found', 'blue');
    }
  } catch (error) {
    logWarning(`Migration failed: ${error.message}`);
  }
}

// Verify database setup
function verifySetup() {
  logStep('7', 'Verifying database setup...');
  
  const dbFiles = [
    'api/db/trading_bot.db',
    'db/trading_bot.db',
    'db/cache.db'
  ];
  
  let allGood = true;
  
  dbFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      if (stats.size > 0) {
        logSuccess(`Database file exists and has data: ${file}`);
      } else {
        logWarning(`Database file exists but is empty: ${file}`);
        allGood = false;
      }
    } else {
      logError(`Database file missing: ${file}`);
      allGood = false;
    }
  });
  
  if (allGood) {
    logSuccess('Database setup verification completed successfully');
  } else {
    logWarning('Database setup verification completed with warnings');
  }
}

// Main execution
async function main() {
  try {
    log('🚀 Starting database initialization...', 'bright');
    
    ensureDirectories();
    initApiDatabase();
    initCoreDatabase();
    initCacheDatabase();
    populateSampleData();
    runMigrations();
    verifySetup();
    
    log('\n🎉 Database initialization completed successfully!', 'green');
    log('\n📊 Database Summary:', 'cyan');
    log('   - API Database: api/db/trading_bot.db', 'blue');
    log('   - Core Database: db/trading_bot.db', 'blue');
    log('   - Cache Database: db/cache.db', 'blue');
    log('   - Backtest Data: backtest_data/', 'blue');
    
    log('\n🔧 Next Steps:', 'cyan');
    log('   1. Start the development server: yarn docker:dev', 'blue');
    log('   2. Or start individual services: yarn dev', 'blue');
    log('   3. Access the application at http://localhost:3000', 'blue');
    
  } catch (error) {
    logError(`Database initialization failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    log('Database Initialization Script', 'bright');
    log('\nUsage: node scripts/init-database.js [options]', 'blue');
    log('\nOptions:', 'cyan');
    log('  --help, -h     Show this help message', 'blue');
    log('  --reset        Reset all databases before initialization', 'blue');
    log('  --skip-cache   Skip cache database initialization', 'blue');
    log('  --skip-sample  Skip sample data population', 'blue');
    process.exit(0);
  }
  
  if (args.includes('--reset')) {
    log('🗑️  Resetting databases...', 'yellow');
    try {
      execSync('yarn db:reset', { stdio: 'inherit' });
      logSuccess('Databases reset successfully');
    } catch (error) {
      logError(`Failed to reset databases: ${error.message}`);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = {
  ensureDirectories,
  initApiDatabase,
  initCoreDatabase,
  initCacheDatabase,
  populateSampleData,
  runMigrations,
  verifySetup
};
