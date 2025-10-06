#!/usr/bin/env node

/**
 * Deployment Script for TradingBot
 * Supports multiple environments: development, staging, production
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Environment configurations
const environments = {
  development: {
    composeFile: 'docker-compose.dev.yml',
    envFile: '.env.dev',
    buildTarget: 'base',
    runTests: true,
    runLinting: true,
    initDatabase: true
  },
  staging: {
    composeFile: 'docker-compose.yml',
    envFile: '.env.staging',
    buildTarget: 'production',
    runTests: true,
    runLinting: true,
    initDatabase: true
  },
  production: {
    composeFile: 'docker-compose.yml',
    envFile: '.env.production',
    buildTarget: 'production',
    runTests: true,
    runLinting: true,
    initDatabase: false // Production should have pre-initialized database
  }
};

// Check prerequisites
function checkPrerequisites() {
  logStep('1', 'Checking prerequisites...');
  
  const checks = [
    {
      name: 'Docker',
      command: 'docker --version',
      required: true
    },
    {
      name: 'Docker Compose',
      command: 'docker-compose --version',
      required: true
    },
    {
      name: 'Node.js',
      command: 'node --version',
      required: true
    },
    {
      name: 'Yarn',
      command: 'yarn --version',
      required: true
    }
  ];
  
  let allGood = true;
  
  checks.forEach(check => {
    try {
      const output = execSync(check.command, { encoding: 'utf8' });
      logSuccess(`${check.name}: ${output.trim()}`);
    } catch (error) {
      if (check.required) {
        logError(`${check.name} is not installed or not in PATH`);
        allGood = false;
      } else {
        logWarning(`${check.name} is not available: ${error.message}`);
      }
    }
  });
  
  if (!allGood) {
    throw new Error('Prerequisites check failed');
  }
}

// Create environment file
function createEnvFile(environment) {
  logStep('2', `Creating environment file for ${environment}...`);
  
  const config = environments[environment];
  const envFile = config.envFile;
  
  if (fs.existsSync(envFile)) {
    log(`Environment file already exists: ${envFile}`, 'blue');
    return;
  }
  
  const envTemplate = `# ${environment.toUpperCase()} Environment Configuration
NODE_ENV=${environment === 'development' ? 'development' : 'production'}
PORT=8001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_PATH=/app/db/trading_bot.db
CACHE_DB_PATH=/app/db/cache.db

# Redis Configuration
REDIS_URL=redis://redis:6379

# Security (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=${generateRandomString(32)}
SESSION_SECRET=${generateRandomString(32)}

# Logging
LOG_LEVEL=${environment === 'development' ? 'debug' : 'info'}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=${environment === 'production' ? '1000' : '100'}

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# Trading API Keys (Add your actual keys here)
POLYGON_API_KEY=your_polygon_api_key_here
TWELVE_DATA_API_KEY=your_twelve_data_api_key_here
YAHOO_FINANCE_ENABLED=true
`;

  fs.writeFileSync(envFile, envTemplate);
  logSuccess(`Environment file created: ${envFile}`);
  
  if (environment === 'production') {
    logWarning('Please update the environment file with your actual API keys and secrets!');
  }
}

// Generate random string for secrets
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Run tests
async function runTests(environment) {
  const config = environments[environment];
  
  if (!config.runTests) {
    log(`Skipping tests for ${environment} environment`, 'yellow');
    return;
  }
  
  logStep('3', `Running tests for ${environment}...`);
  
  try {
    execSync('node scripts/run-tests.js', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    logSuccess('All tests passed');
  } catch (error) {
    logError('Tests failed');
    throw error;
  }
}

// Build Docker images
function buildImages(environment) {
  logStep('4', `Building Docker images for ${environment}...`);
  
  const config = environments[environment];
  
  try {
    // Build with no cache for production
    const buildArgs = environment === 'production' ? '--no-cache' : '';
    
    execSync(`docker-compose -f ${config.composeFile} build ${buildArgs}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('Docker images built successfully');
  } catch (error) {
    logError('Docker build failed');
    throw error;
  }
}

// Initialize database
function initDatabase(environment) {
  const config = environments[environment];
  
  if (!config.initDatabase) {
    log(`Skipping database initialization for ${environment} environment`, 'yellow');
    return;
  }
  
  logStep('5', `Initializing database for ${environment}...`);
  
  try {
    execSync('node scripts/init-database.js', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    logSuccess('Database initialized successfully');
  } catch (error) {
    logError('Database initialization failed');
    throw error;
  }
}

// Deploy services
function deployServices(environment) {
  logStep('6', `Deploying services for ${environment}...`);
  
  const config = environments[environment];
  
  try {
    // Stop existing services
    log('Stopping existing services...', 'blue');
    execSync(`docker-compose -f ${config.composeFile} down`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Start services
    log('Starting services...', 'blue');
    execSync(`docker-compose -f ${config.composeFile} up -d`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('Services deployed successfully');
  } catch (error) {
    logError('Service deployment failed');
    throw error;
  }
}

// Health check
function healthCheck(environment) {
  logStep('7', `Performing health check for ${environment}...`);
  
  const services = [
    { name: 'API', url: 'http://localhost:8001/ping' },
    { name: 'Client', url: 'http://localhost:3000' }
  ];
  
  let allHealthy = true;
  
  services.forEach(service => {
    try {
      execSync(`curl -f ${service.url}`, { 
        stdio: 'pipe',
        timeout: 10000
      });
      logSuccess(`${service.name} service is healthy`);
    } catch (error) {
      logError(`${service.name} service is not responding`);
      allHealthy = false;
    }
  });
  
  if (!allHealthy) {
    logWarning('Some services are not healthy, but deployment completed');
  }
  
  return allHealthy;
}

// Main deployment function
async function deploy(environment) {
  if (!environments[environment]) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  
  try {
    log(`🚀 Starting deployment to ${environment} environment...`, 'bright');
    
    checkPrerequisites();
    createEnvFile(environment);
    await runTests(environment);
    buildImages(environment);
    initDatabase(environment);
    deployServices(environment);
    const healthy = healthCheck(environment);
    
    log('\n🎉 Deployment completed!', 'green');
    log('\n📊 Service URLs:', 'cyan');
    log('   Client: http://localhost:3000', 'blue');
    log('   API: http://localhost:8001', 'blue');
    log('   API Health: http://localhost:8001/ping', 'blue');
    
    log('\n🔧 Management Commands:', 'cyan');
    log('   View logs: docker-compose logs -f', 'blue');
    log('   Stop services: docker-compose down', 'blue');
    log('   Restart services: docker-compose restart', 'blue');
    
    if (!healthy) {
      log('\n⚠️  Some services may need attention', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    log('TradingBot Deployment Script', 'bright');
    log('\nUsage: node scripts/deploy.js <environment> [options]', 'blue');
    log('\nEnvironments:', 'cyan');
    log('  development    Deploy to development environment', 'blue');
    log('  staging        Deploy to staging environment', 'blue');
    log('  production     Deploy to production environment', 'blue');
    log('\nOptions:', 'cyan');
    log('  --help, -h     Show this help message', 'blue');
    log('  --skip-tests   Skip running tests', 'blue');
    log('  --skip-build   Skip building Docker images', 'blue');
    log('  --skip-db      Skip database initialization', 'blue');
    log('  --skip-health  Skip health checks', 'blue');
    process.exit(0);
  }
  
  const environment = args[0];
  
  if (!environment) {
    logError('Please specify an environment (development, staging, production)');
    process.exit(1);
  }
  
  // Override config based on flags
  if (args.includes('--skip-tests')) {
    environments[environment].runTests = false;
  }
  if (args.includes('--skip-build')) {
    // This would require modifying the deploy function
    logWarning('--skip-build flag not yet implemented');
  }
  if (args.includes('--skip-db')) {
    environments[environment].initDatabase = false;
  }
  if (args.includes('--skip-health')) {
    // This would require modifying the deploy function
    logWarning('--skip-health flag not yet implemented');
  }
  
  deploy(environment);
}

module.exports = {
  deploy,
  checkPrerequisites,
  createEnvFile,
  runTests,
  buildImages,
  initDatabase,
  deployServices,
  healthCheck
};
