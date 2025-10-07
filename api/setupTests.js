/* global beforeAll, afterAll */
// Jest setup file to handle database initialization
const { db } = require('./initDb');

// Initialize database before tests
beforeAll(async () => {
  // Database is already initialized when module is imported
  // This just ensures it's ready before tests run
});

// Clean up after tests
afterAll(async () => {
  // Close database connections if needed
  if (db && typeof db.close === 'function') {
    db.close();
  }
});
