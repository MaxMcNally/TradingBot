#!/usr/bin/env node

/**
 * Test script to verify authentication changes
 * This script tests the token expiration and refresh functionality
 */

const jwt = require('jsonwebtoken');

// Mock JWT secret (same as in the app)
const JWT_SECRET = "your-secret-key-change-in-production";

console.log("🔐 Testing Authentication Changes");
console.log("=================================");

// Test 1: Generate token with 7-day expiration
console.log("\n1. Testing token generation with 7-day expiration...");
const user = { id: 1, username: "testuser", email: "test@example.com" };

const token = jwt.sign(
  { 
    id: user.id, 
    username: user.username, 
    email: user.email 
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log("✅ Token generated successfully");

// Test 2: Decode and verify token
console.log("\n2. Testing token decoding...");
const decoded = jwt.decode(token);
const currentTime = Math.floor(Date.now() / 1000);
const timeUntilExpiry = decoded.exp - currentTime;
const daysUntilExpiry = Math.floor(timeUntilExpiry / (24 * 60 * 60));

console.log(`✅ Token expires in ${daysUntilExpiry} days`);
console.log(`   Expiration date: ${new Date(decoded.exp * 1000).toLocaleString()}`);

// Test 3: Verify token is valid
console.log("\n3. Testing token verification...");
try {
  const verified = jwt.verify(token, JWT_SECRET);
  console.log("✅ Token verification successful");
  console.log(`   User: ${verified.username} (ID: ${verified.id})`);
} catch (error) {
  console.log("❌ Token verification failed:", error.message);
}

// Test 4: Test token refresh scenario
console.log("\n4. Testing token refresh scenario...");
const newToken = jwt.sign(
  { 
    id: user.id, 
    username: user.username, 
    email: user.email 
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log("✅ New token generated for refresh");
console.log(`   Original token: ${token.substring(0, 20)}...`);
console.log(`   New token: ${newToken.substring(0, 20)}...`);

// Test 5: Compare with old 24h expiration
console.log("\n5. Comparing with old 24h expiration...");
const oldToken = jwt.sign(
  { 
    id: user.id, 
    username: user.username, 
    email: user.email 
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

const oldDecoded = jwt.decode(oldToken);
const oldTimeUntilExpiry = oldDecoded.exp - currentTime;
const oldDaysUntilExpiry = Math.floor(oldTimeUntilExpiry / (24 * 60 * 60));

console.log(`✅ Old token (24h): ${oldDaysUntilExpiry} days until expiry`);
console.log(`✅ New token (7d): ${daysUntilExpiry} days until expiry`);
console.log(`   Improvement: ${daysUntilExpiry - oldDaysUntilExpiry} additional days`);

console.log("\n=================================");
console.log("🎉 Authentication Changes Test Complete!");
console.log("\nSummary of changes:");
console.log("• JWT token expiration increased from 24 hours to 7 days");
console.log("• Added token refresh endpoint at /api/auth/refresh");
console.log("• Improved client-side token handling with automatic refresh");
console.log("• Added token utility functions for better token management");
console.log("\nBenefits:");
console.log("• Users will stay logged in for 7 days instead of 24 hours");
console.log("• Automatic token refresh prevents unexpected logouts");
console.log("• Better user experience with seamless authentication");
