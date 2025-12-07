#!/usr/bin/env node

/**
 * Script to load .env files and run the backend dev server
 * Loads .env.local (if it exists) and .env (if it exists)
 * .env.local takes precedence over .env
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Get project root directory
const projectRoot = path.resolve(__dirname, '..');
const apiDir = path.join(projectRoot, 'api');

// Load .env files in order (later files override earlier ones)
// Load .env first, then .env.local (so .env.local overrides .env)
console.log('Loading environment variables...');

// Load .env first
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading .env...');
  dotenv.config({ path: envPath });
}

// Load .env.local second (overrides .env)
const envLocalPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('Loading .env.local...');
  dotenv.config({ path: envLocalPath, override: true });
}

// Change to api directory
process.chdir(apiDir);

// Spawn nodemon with the loaded environment variables
console.log('Starting dev server...');
const nodemon = spawn('nodemon', ['server.ts'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

nodemon.on('error', (err) => {
  console.error('Failed to start nodemon:', err);
  process.exit(1);
});

nodemon.on('exit', (code) => {
  process.exit(code || 0);
});

