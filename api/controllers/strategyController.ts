import { Request, Response } from "express";
import Strategy, { CreateStrategyData, UpdateStrategyData } from "../models/Strategy";
import { AuthenticatedRequest } from "../middleware/auth";
import { db } from "../initDb";
import { getBotLimitForTier } from "../constants/tierLimits";

/**
 * Get user's plan tier from database
 */
const getUserTier = (userId: number): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT plan_tier FROM users WHERE id = $1',
      [userId],
      (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row?.plan_tier || null);
        }
      }
    );
  });
};

/**
 * Get count of active strategies for a user
 */
const getActiveStrategyCount = (userId: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM user_strategies WHERE user_id = $1 AND is_active = TRUE',
      [userId],
      (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row?.count || 0);
        }
      }
    );
  });
};

/**
 * Check if user can create/activate more bots based on tier limits
 */
const checkBotLimit = async (userId: number): Promise<{ allowed: boolean; currentCount: number; limit: number; tier: string }> => {
  const tier = await getUserTier(userId);
  const limit = getBotLimitForTier(tier);
  const currentCount = await getActiveStrategyCount(userId);
  
  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
    tier: tier || 'FREE'
  };
};

export const createStrategy = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { name, description, strategy_type, config, backtest_results, is_public = false } = req.body;

    // Validate required fields
    if (!name || !strategy_type || !config) {
      return res.status(400).json({ 
        message: "Missing required fields: name, strategy_type, config" 
      });
    }

    // Check if strategy name already exists for this user
    const existingStrategy = await Strategy.findByName(userId, name);
    if (existingStrategy) {
      return res.status(409).json({ 
        message: "Strategy with this name already exists for this user" 
      });
    }

    const strategyData: CreateStrategyData = {
      user_id: userId,
      name,
      description,
      strategy_type,
      config,
      backtest_results,
      is_public
    };

    const newStrategy = await Strategy.create(strategyData);
    const parsedStrategy = Strategy.parseStrategyData(newStrategy);

    res.status(201).json({
      message: "Strategy created successfully",
      strategy: parsedStrategy
    });
  } catch (error) {
    console.error("Error creating strategy:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserStrategies = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const includeInactive = req.query.includeInactive === 'true';
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const strategies = await Strategy.findByUserId(userId, includeInactive);
    const parsedStrategies = strategies.map(strategy => Strategy.parseStrategyData(strategy));

    res.json({
      strategies: parsedStrategies,
      count: parsedStrategies.length
    });
  } catch (error) {
    console.error("Error getting user strategies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStrategyById = async (req: Request, res: Response) => {
  try {
    const strategyId = parseInt(req.params.strategyId);
    
    if (isNaN(strategyId)) {
      return res.status(400).json({ message: "Invalid strategy ID" });
    }

    const strategy = await Strategy.findById(strategyId);
    
    if (!strategy) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    const parsedStrategy = Strategy.parseStrategyData(strategy);
    res.json({ strategy: parsedStrategy });
  } catch (error) {
    console.error("Error getting strategy:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStrategy = async (req: Request, res: Response) => {
  try {
    const strategyId = parseInt(req.params.strategyId);
    
    if (isNaN(strategyId)) {
      return res.status(400).json({ message: "Invalid strategy ID" });
    }

    const updateData: UpdateStrategyData = req.body;

    // If updating name, check for duplicates
    if (updateData.name) {
      const existingStrategy = await Strategy.findById(strategyId);
      if (existingStrategy) {
        const duplicateStrategy = await Strategy.findByName(existingStrategy.user_id, updateData.name);
        if (duplicateStrategy && duplicateStrategy.id !== strategyId) {
          return res.status(409).json({ 
            message: "Strategy with this name already exists for this user" 
          });
        }
      }
    }

    const updatedStrategy = await Strategy.update(strategyId, updateData);
    
    if (!updatedStrategy) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    const parsedStrategy = Strategy.parseStrategyData(updatedStrategy);
    res.json({
      message: "Strategy updated successfully",
      strategy: parsedStrategy
    });
  } catch (error) {
    console.error("Error updating strategy:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteStrategy = async (req: Request, res: Response) => {
  try {
    const strategyId = parseInt(req.params.strategyId);
    
    if (isNaN(strategyId)) {
      return res.status(400).json({ message: "Invalid strategy ID" });
    }

    const deleted = await Strategy.delete(strategyId);
    
    if (!deleted) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    res.json({ message: "Strategy deleted successfully" });
  } catch (error) {
    console.error("Error deleting strategy:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deactivateStrategy = async (req: Request, res: Response) => {
  try {
    const strategyId = parseInt(req.params.strategyId);
    
    if (isNaN(strategyId)) {
      return res.status(400).json({ message: "Invalid strategy ID" });
    }

    const deactivated = await Strategy.deactivate(strategyId);
    
    if (!deactivated) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    res.json({ message: "Strategy deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating strategy:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const activateStrategy = async (req: Request, res: Response) => {
  try {
    const strategyId = parseInt(req.params.strategyId);
    
    if (isNaN(strategyId)) {
      return res.status(400).json({ message: "Invalid strategy ID" });
    }

    // Get the strategy to find the user_id
    const strategy = await Strategy.findById(strategyId);
    if (!strategy) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    // Check bot limit before activating
    const limitCheck = await checkBotLimit(strategy.user_id);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        message: `You have reached the maximum number of active bots (${limitCheck.limit}) for your ${limitCheck.tier} tier plan. Please upgrade your plan to activate more bots.`,
        error: 'BOT_LIMIT_EXCEEDED',
        currentCount: limitCheck.currentCount,
        limit: limitCheck.limit,
        tier: limitCheck.tier,
        upgradeRequired: true
      });
    }

    const activated = await Strategy.activate(strategyId);
    
    if (!activated) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    res.json({ message: "Strategy activated successfully" });
  } catch (error) {
    console.error("Error activating strategy:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const saveStrategyFromBacktest = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { 
      name, 
      description, 
      strategy_type, 
      config, 
      backtest_results,
      is_public = false
    } = req.body;

    // Validate required fields
    if (!name || !strategy_type || !config || !backtest_results) {
      return res.status(400).json({ 
        message: "Missing required fields: name, strategy_type, config, backtest_results" 
      });
    }

    // Check if strategy name already exists for this user
    const existingStrategy = await Strategy.findByName(userId, name);
    if (existingStrategy) {
      return res.status(409).json({ 
        message: "Strategy with this name already exists for this user" 
      });
    }

    // Check bot limit before creating
    const limitCheck = await checkBotLimit(userId);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        message: `You have reached the maximum number of active bots (${limitCheck.limit}) for your ${limitCheck.tier} tier plan. Please upgrade your plan to create more bots.`,
        error: 'BOT_LIMIT_EXCEEDED',
        currentCount: limitCheck.currentCount,
        limit: limitCheck.limit,
        tier: limitCheck.tier,
        upgradeRequired: true
      });
    }

    const strategyData: CreateStrategyData = {
      user_id: userId,
      name,
      description: description || `Strategy saved from backtest on ${new Date().toLocaleDateString()}`,
      strategy_type,
      config,
      backtest_results,
      is_public
    };

    const newStrategy = await Strategy.create(strategyData);
    const parsedStrategy = Strategy.parseStrategyData(newStrategy);

    res.status(201).json({
      message: "Strategy saved from backtest successfully",
      strategy: parsedStrategy
    });
  } catch (error) {
    console.error("Error saving strategy from backtest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBotLimitInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const limitCheck = await checkBotLimit(userId);
    
    res.json({
      currentCount: limitCheck.currentCount,
      limit: limitCheck.limit,
      tier: limitCheck.tier,
      remaining: Math.max(0, limitCheck.limit - limitCheck.currentCount),
      canCreateMore: limitCheck.allowed
    });
  } catch (error) {
    console.error("Error getting bot limit info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPublicStrategies = async (req: Request, res: Response) => {
  try {
    console.log("getPublicStrategies called");
    const strategies = await Strategy.findPublicStrategies();
    console.log("Found strategies:", strategies.length);
    const parsedStrategies = strategies.map(strategy => Strategy.parseStrategyData(strategy));

    res.json({
      strategies: parsedStrategies,
      count: parsedStrategies.length
    });
  } catch (error) {
    console.error("Error getting public strategies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPublicStrategiesByType = async (req: Request, res: Response) => {
  try {
    const { strategyType } = req.params;
    
    if (!strategyType) {
      return res.status(400).json({ message: "Strategy type is required" });
    }

    const strategies = await Strategy.findPublicStrategiesByType(strategyType);
    const parsedStrategies = strategies.map(strategy => Strategy.parseStrategyData(strategy));

    res.json({
      strategies: parsedStrategies,
      count: parsedStrategies.length
    });
  } catch (error) {
    console.error("Error getting public strategies by type:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const copyPublicStrategy = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { strategyId, customName } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!strategyId) {
      return res.status(400).json({ message: "Strategy ID is required" });
    }

    // Get the public strategy
    const publicStrategy = await Strategy.findById(strategyId);
    
    if (!publicStrategy) {
      return res.status(404).json({ message: "Public strategy not found" });
    }

    if (!publicStrategy.is_public) {
      return res.status(400).json({ message: "Strategy is not public" });
    }

    // Create a copy for the user
    const strategyName = customName || `${publicStrategy.name} (Copy)`;
    
    // Check if user already has a strategy with this name
    const existingStrategy = await Strategy.findByName(userId, strategyName);
    if (existingStrategy) {
      return res.status(409).json({ 
        message: "You already have a strategy with this name. Please choose a different name." 
      });
    }

    // Check bot limit before copying
    const limitCheck = await checkBotLimit(userId);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        message: `You have reached the maximum number of active bots (${limitCheck.limit}) for your ${limitCheck.tier} tier plan. Please upgrade your plan to create more bots.`,
        error: 'BOT_LIMIT_EXCEEDED',
        currentCount: limitCheck.currentCount,
        limit: limitCheck.limit,
        tier: limitCheck.tier,
        upgradeRequired: true
      });
    }

    const strategyData: CreateStrategyData = {
      user_id: userId,
      name: strategyName,
      description: `Copied from public strategy: ${publicStrategy.description || publicStrategy.name}`,
      strategy_type: publicStrategy.strategy_type,
      config: publicStrategy.config,
      backtest_results: publicStrategy.backtest_results,
      is_public: false // Keep the copy private by default
    };

    const newStrategy = await Strategy.create(strategyData);
    const parsedStrategy = Strategy.parseStrategyData(newStrategy);

    res.status(201).json({
      message: "Strategy copied successfully",
      strategy: parsedStrategy
    });
  } catch (error) {
    console.error("Error copying public strategy:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
