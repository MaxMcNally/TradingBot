import { Request, Response } from "express";
import { testDataGenerator } from "../services/testDataGenerator";
import { tradingMockService } from "../services/tradingMockService";

/**
 * Create test user with historical data
 */
export const createTestUser = async (req: Request, res: Response) => {
  try {
    const testData = await testDataGenerator.createTestUser();
    
    res.json({
      success: true,
      message: "Test user created successfully",
      data: {
        user: {
          id: testData.user.id,
          username: testData.user.username,
          email: testData.user.email
        },
        sessions: testData.sessions.length,
        trades: testData.trades.length,
        portfolioSnapshots: testData.portfolioSnapshots.length
      }
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create test user",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get test user data
 */
export const getTestUser = async (req: Request, res: Response) => {
  try {
    const testUser = await testDataGenerator.getTestUser();
    
    if (!testUser) {
      return res.status(404).json({ 
        success: false, 
        message: "Test user not found" 
      });
    }
    
    res.json({
      success: true,
      data: {
        id: testUser.id,
        username: testUser.username,
        email: testUser.email
      }
    });
  } catch (error) {
    console.error("Error getting test user:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get test user",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Clean up test data
 */
export const cleanupTestData = async (req: Request, res: Response) => {
  try {
    await testDataGenerator.cleanupTestData();
    
    res.json({
      success: true,
      message: "Test data cleaned up successfully"
    });
  } catch (error) {
    console.error("Error cleaning up test data:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to clean up test data",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Start a mock trading session
 */
export const startMockSession = async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      symbols, 
      strategy, 
      strategyParameters, 
      mode = 'PAPER',
      initialCash = 10000,
      tradeInterval = 30000, // 30 seconds
      maxTrades = 100,
      volatility = 0.05 // 5%
    } = req.body;
    
    if (!userId || !symbols || !strategy) {
      return res.status(400).json({
        success: false,
        message: "userId, symbols, and strategy are required"
      });
    }
    
    const config = {
      userId: parseInt(userId),
      symbols,
      strategy,
      strategyParameters: strategyParameters || {},
      mode,
      initialCash,
      tradeInterval,
      maxTrades,
      volatility
    };
    
    const result = await tradingMockService.startMockSession(config);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error starting mock session:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to start mock session",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Stop a mock trading session
 */
export const stopMockSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required"
      });
    }
    
    const result = await tradingMockService.stopMockSession(parseInt(sessionId));
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error stopping mock session:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to stop mock session",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get active mock sessions
 */
export const getActiveMockSessions = async (req: Request, res: Response) => {
  try {
    const activeSessions = tradingMockService.getActiveSessions();
    const status = tradingMockService.getStatus();
    
    res.json({
      success: true,
      data: {
        activeSessions,
        status
      }
    });
  } catch (error) {
    console.error("Error getting active mock sessions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get active mock sessions",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Stop all mock sessions
 */
export const stopAllMockSessions = async (req: Request, res: Response) => {
  try {
    await tradingMockService.stopAllSessions();
    
    res.json({
      success: true,
      message: "All mock sessions stopped successfully"
    });
  } catch (error) {
    console.error("Error stopping all mock sessions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to stop all mock sessions",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
