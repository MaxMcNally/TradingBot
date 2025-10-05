import { Request, Response } from "express";
import Strategy, { CreateStrategyData, UpdateStrategyData } from "../models/Strategy";

export const createStrategy = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { name, description, strategy_type, config, backtest_results } = req.body;

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
      backtest_results
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
      backtest_results 
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

    const strategyData: CreateStrategyData = {
      user_id: userId,
      name,
      description: description || `Strategy saved from backtest on ${new Date().toLocaleDateString()}`,
      strategy_type,
      config,
      backtest_results
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
