/**
 * Test script for the new public strategies endpoints
 * Run this after starting the server to test the public strategies functionality
 */

const API_BASE = 'http://localhost:8001/api';

// Test data
const testUserId = 1; // Assuming admin user exists
const testPublicStrategy = {
  name: "Public Moving Average Strategy",
  description: "A public moving average crossover strategy for testing",
  strategy_type: "moving_average_crossover",
  config: {
    fastWindow: 10,
    slowWindow: 30,
    maType: "SMA",
    initialCapital: 10000,
    sharesPerTrade: 100
  },
  backtest_results: {
    totalReturn: 0.18,
    winRate: 0.68,
    maxDrawdown: 0.10,
    finalPortfolioValue: 11800,
    totalTrades: 25,
    sharpeRatio: 1.2,
    trades: [
      { date: "2023-01-15", action: "BUY", symbol: "AAPL", price: 150, quantity: 100 },
      { date: "2023-02-20", action: "SELL", symbol: "AAPL", price: 165, quantity: 100 }
    ]
  },
  is_public: true
};

const testPrivateStrategy = {
  name: "Private Bollinger Bands Strategy",
  description: "A private Bollinger Bands strategy for testing",
  strategy_type: "bollinger_bands",
  config: {
    window: 20,
    multiplier: 2.0,
    initialCapital: 10000,
    sharesPerTrade: 100
  },
  backtest_results: {
    totalReturn: 0.12,
    winRate: 0.60,
    maxDrawdown: 0.08,
    finalPortfolioValue: 11200,
    totalTrades: 20,
    sharpeRatio: 0.9
  },
  is_public: false
};

async function testPublicStrategiesEndpoints() {
  console.log('🧪 Testing Public Strategies Endpoints...\n');

  try {
    // Test 1: Create a public strategy
    console.log('1. Creating a public strategy...');
    const createPublicResponse = await fetch(`${API_BASE}/strategies/users/${testUserId}/strategies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPublicStrategy)
    });

    let publicStrategyId = null;
    if (createPublicResponse.ok) {
      const createResult = await createPublicResponse.json();
      console.log('✅ Public strategy created successfully:', createResult.strategy.name);
      publicStrategyId = createResult.strategy.id;
    } else {
      const errorResult = await createPublicResponse.json();
      console.log('❌ Failed to create public strategy:', errorResult.message);
    }

    // Test 2: Create a private strategy
    console.log('\n2. Creating a private strategy...');
    const createPrivateResponse = await fetch(`${API_BASE}/strategies/users/${testUserId}/strategies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPrivateStrategy)
    });

    let privateStrategyId = null;
    if (createPrivateResponse.ok) {
      const createResult = await createPrivateResponse.json();
      console.log('✅ Private strategy created successfully:', createResult.strategy.name);
      privateStrategyId = createResult.strategy.id;
    } else {
      const errorResult = await createPrivateResponse.json();
      console.log('❌ Failed to create private strategy:', errorResult.message);
    }

    // Test 3: Get all public strategies
    console.log('\n3. Getting all public strategies...');
    const getPublicResponse = await fetch(`${API_BASE}/strategies/strategies/public`);
    if (getPublicResponse.ok) {
      const publicResult = await getPublicResponse.json();
      console.log(`✅ Found ${publicResult.count} public strategies`);
      if (publicResult.strategies.length > 0) {
        console.log('   - Public strategies:', publicResult.strategies.map(s => s.name).join(', '));
      }
    } else {
      const errorResult = await getPublicResponse.json();
      console.log('❌ Failed to get public strategies:', errorResult.message);
    }

    // Test 4: Get public strategies by type
    console.log('\n4. Getting public strategies by type (moving_average_crossover)...');
    const getByTypeResponse = await fetch(`${API_BASE}/strategies/strategies/public/moving_average_crossover`);
    if (getByTypeResponse.ok) {
      const byTypeResult = await getByTypeResponse.json();
      console.log(`✅ Found ${byTypeResult.count} public moving average crossover strategies`);
    } else {
      const errorResult = await getByTypeResponse.json();
      console.log('❌ Failed to get public strategies by type:', errorResult.message);
    }

    // Test 5: Get public strategies by type (bollinger_bands)
    console.log('\n5. Getting public strategies by type (bollinger_bands)...');
    const getByTypeResponse2 = await fetch(`${API_BASE}/strategies/strategies/public/bollinger_bands`);
    if (getByTypeResponse2.ok) {
      const byTypeResult2 = await getByTypeResponse2.json();
      console.log(`✅ Found ${byTypeResult2.count} public Bollinger Bands strategies`);
    } else {
      const errorResult = await getByTypeResponse2.json();
      console.log('❌ Failed to get public Bollinger Bands strategies:', errorResult.message);
    }

    // Test 6: Copy a public strategy (if we have one)
    if (publicStrategyId) {
      console.log('\n6. Copying a public strategy...');
      const copyResponse = await fetch(`${API_BASE}/strategies/users/${testUserId}/strategies/copy-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategyId: publicStrategyId,
          customName: "My Copy of Public Strategy"
        })
      });

      if (copyResponse.ok) {
        const copyResult = await copyResponse.json();
        console.log('✅ Public strategy copied successfully:', copyResult.strategy.name);
      } else {
        const errorResult = await copyResponse.json();
        console.log('❌ Failed to copy public strategy:', errorResult.message);
      }
    }

    // Test 7: Try to copy a non-public strategy (should fail)
    if (privateStrategyId) {
      console.log('\n7. Attempting to copy a private strategy (should fail)...');
      const copyPrivateResponse = await fetch(`${API_BASE}/strategies/users/${testUserId}/strategies/copy-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategyId: privateStrategyId,
          customName: "Attempted Copy of Private Strategy"
        })
      });

      if (copyPrivateResponse.ok) {
        console.log('❌ Unexpectedly succeeded in copying private strategy');
      } else {
        const errorResult = await copyPrivateResponse.json();
        console.log('✅ Correctly failed to copy private strategy:', errorResult.message);
      }
    }

    // Test 8: Try to copy a non-existent strategy (should fail)
    console.log('\n8. Attempting to copy a non-existent strategy (should fail)...');
    const copyNonExistentResponse = await fetch(`${API_BASE}/strategies/users/${testUserId}/strategies/copy-public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        strategyId: 99999,
        customName: "Non-existent Strategy Copy"
      })
    });

    if (copyNonExistentResponse.ok) {
      console.log('❌ Unexpectedly succeeded in copying non-existent strategy');
    } else {
      const errorResult = await copyNonExistentResponse.json();
      console.log('✅ Correctly failed to copy non-existent strategy:', errorResult.message);
    }

    // Test 9: Update strategy to make it public
    if (privateStrategyId) {
      console.log('\n9. Updating private strategy to make it public...');
      const updateToPublicResponse = await fetch(`${API_BASE}/strategies/strategies/${privateStrategyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_public: true,
          description: "Updated to public strategy for testing"
        })
      });

      if (updateToPublicResponse.ok) {
        // const updateResult = await updateToPublicResponse.json(); // Unused variable
        console.log('✅ Strategy updated to public successfully');
        
        // Verify it appears in public strategies
        const verifyPublicResponse = await fetch(`${API_BASE}/strategies/strategies/public`);
        if (verifyPublicResponse.ok) {
          const verifyResult = await verifyPublicResponse.json();
          const updatedStrategy = verifyResult.strategies.find(s => s.id === privateStrategyId);
          if (updatedStrategy) {
            console.log('✅ Updated strategy now appears in public strategies list');
          } else {
            console.log('❌ Updated strategy does not appear in public strategies list');
          }
        }
      } else {
        const errorResult = await updateToPublicResponse.json();
        console.log('❌ Failed to update strategy to public:', errorResult.message);
      }
    }

    // Cleanup: Delete test strategies
    console.log('\n10. Cleaning up test strategies...');
    const strategiesToDelete = [publicStrategyId, privateStrategyId].filter(id => id !== null);
    
    for (const strategyId of strategiesToDelete) {
      const deleteResponse = await fetch(`${API_BASE}/strategies/strategies/${strategyId}`, {
        method: 'DELETE'
      });

      if (deleteResponse.ok) {
        console.log(`✅ Deleted test strategy ${strategyId}`);
      } else {
        console.log(`❌ Failed to delete test strategy ${strategyId}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🏁 Public strategies endpoint testing complete!');
}

// Run the tests
testPublicStrategiesEndpoints();
