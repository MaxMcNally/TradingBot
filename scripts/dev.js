#!/usr/bin/env node

/**
 * Script to run both backend and frontend dev servers in parallel
 * Loads .env files for the backend
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Get project root directory
const projectRoot = path.resolve(__dirname, '..');
const apiDir = path.join(projectRoot, 'api');
const clientDir = path.join(projectRoot, 'client');

// Load .env files for backend
console.log('Loading environment variables...');
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading .env...');
  dotenv.config({ path: envPath });
}

const envLocalPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('Loading .env.local...');
  dotenv.config({ path: envLocalPath, override: true });
}

// Spawn backend server
console.log('Starting backend dev server...');
const backend = spawn('nodemon', ['server.ts'], {
  cwd: apiDir,
  stdio: 'inherit',
  shell: true,
  env: process.env
});

// Spawn frontend server
console.log('Starting frontend dev server...');
const frontend = spawn('yarn', ['dev'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true,
  env: process.env
});

// Handle process errors
backend.on('error', (err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});

frontend.on('error', (err) => {
  console.error('Failed to start frontend:', err);
  process.exit(1);
});

// Handle process exits
let exited = false;
const handleExit = (code) => {
  if (exited) return;
  exited = true;
  
  // Kill both processes
  try {
    backend.kill();
    frontend.kill();
  } catch (err) {
    // Ignore errors when killing
  }
  
  process.exit(code || 0);
};

backend.on('exit', handleExit);
frontend.on('exit', handleExit);

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\nShutting down dev servers...');
  handleExit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down dev servers...');
  handleExit(0);
});

