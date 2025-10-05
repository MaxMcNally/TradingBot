/**
 * Test script for the new strategy endpoints
 * Run this after starting the server to test the strategy functionality
 */

const API_BASE = 'http://localhost:8001/api';

// Test data
const testUserId = 1; // Assuming admin user exists
const testStrategy = {
  name: "Test Moving Average Strategy",
  description: "A simple moving average crossover strategy for testing",
  strategy_type: "moving_average_crossover",
  config: {
    fastWindow: 10,
    slowWindow: 30,
    maType: "SMA",
    initialCapital: 10000,
    sharesPerTrade: 100
  },
  backtest_results: {
    totalReturn: 0.15,
    winRate: 0.65,
    maxDrawdown: 0.08,
    finalPortfolioValue: 11500,
    trades: [
      { date: "2023-01-15", action: "BUY", symbol: "AAPL", price: 150, quantity: 100 },
      { date: "2023-02-20", action: "SELL", symbol: "AAPL", price: 165, quantity: 100 }
    ]
  }
};

async function testStrategyEndpoints() {
  console.log('🧪 Testing Strategy Endpoints...\n');

  try {
    // Test 1: Create a new strategy
    console.log('1. Creating a new strategy...');
    const createResponse = await fetch(`${API_BASE}/strategies/users/${testUserId}/strategies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testStrategy)
    });

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Strategy created successfully:', createResult.strategy.name);
      const strategyId = createResult.strategy.id;
      
      // Test 2: Get all strategies for user
      console.log('\n2. Getting all strategies for user...');
      const getStrategiesResponse = await fetch(`${API_BASE}/strategies/users/${testUserId}/strategies`);
      if (getStrategiesResponse.ok) {
        const strategiesResult = await getStrategiesResponse.json();
        console.log(`✅ Found ${strategiesResult.count} strategies for user`);
      }

      // Test 3: Get specific strategy by ID
      console.log('\n3. Getting specific strategy by ID...');
      const getStrategyResponse = await fetch(`${API_BASE}/strategies/strategies/${strategyId}`);
      if (getStrategyResponse.ok) {
        const strategyResult = await getStrategyResponse.json();
        console.log('✅ Retrieved strategy:', strategyResult.strategy.name);
      }

      // Test 4: Update strategy
      console.log('\n4. Updating strategy...');
      const updateResponse = await fetch(`${API_BASE}/strategies/strategies/${strategyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: "Updated description for testing",
          config: {
            ...testStrategy.config,
            fastWindow: 15,
            slowWindow: 35
          }
        })
      });

      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Strategy updated successfully');
      }

      // Test 5: Deactivate strategy
      console.log('\n5. Deactivating strategy...');
      const deactivateResponse = await fetch(`${API_BASE}/strategies/strategies/${strategyId}/deactivate`, {
        method: 'PATCH'
      });

      if (deactivateResponse.ok) {
        console.log('✅ Strategy deactivated successfully');
      }

      // Test 6: Activate strategy
      console.log('\n6. Activating strategy...');
      const activateResponse = await fetch(`${API_BASE}/strategies/strategies/${strategyId}/activate`, {
        method: 'PATCH'
      });

      if (activateResponse.ok) {
        console.log('✅ Strategy activated successfully');
      }

      // Test 7: Save strategy from backtest
      console.log('\n7. Testing save strategy from backtest...');
      const backtestStrategy = {
        name: "Backtest Strategy",
        description: "Strategy saved from backtest results",
        strategy_type: "bollinger_bands",
        config: {
          multiplier: 2.0,
          window: 20,
          initialCapital: 10000
        },
        backtest_results: {
          totalReturn: 0.22,
          winRate: 0.70,
          maxDrawdown: 0.12,
          finalPortfolioValue: 12200
        }
      };

      const saveFromBacktestResponse = await fetch(`${API_BASE}/strategies/users/${testUserId}/strategies/from-backtest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backtestStrategy)
      });

      if (saveFromBacktestResponse.ok) {
        const saveResult = await saveFromBacktestResponse.json();
        console.log('✅ Strategy saved from backtest:', saveResult.strategy.name);
      }

      // Test 8: Delete strategy
      console.log('\n8. Deleting strategy...');
      const deleteResponse = await fetch(`${API_BASE}/strategies/strategies/${strategyId}`, {
        method: 'DELETE'
      });

      if (deleteResponse.ok) {
        console.log('✅ Strategy deleted successfully');
      }

    } else {
      const errorResult = await createResponse.json();
      console.log('❌ Failed to create strategy:', errorResult.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🏁 Strategy endpoint testing complete!');
}

// Run the tests
testStrategyEndpoints();
