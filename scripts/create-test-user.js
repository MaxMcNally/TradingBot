#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:8001/api';

async function createTestUser() {
  try {
    console.log('👤 Creating test user...');
    
    const response = await axios.post(`${API_BASE}/auth/register`, {
      username: 'maxmcnally_test',
      email: 'test@example.com',
      password: 'test123'
    });
    
    if (response.data.success) {
      console.log('✅ Test user created successfully');
      return true;
    } else {
      console.log('ℹ️  User might already exist:', response.data.message);
      return true; // Continue anyway
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️  User already exists, continuing...');
      return true;
    } else {
      console.error('❌ Error creating test user:', error.response?.data || error.message);
      return false;
    }
  }
}

async function main() {
  try {
    await createTestUser();
    console.log('🎯 Test user setup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
