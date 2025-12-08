import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { CustomStrategy, ConditionNode } from "../models/CustomStrategy";
import { CustomStrategyService } from "../services/customStrategyService";

// Create a custom strategy
export const createCustomStrategy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { name, description, buy_conditions, sell_conditions, is_public } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Strategy name is required" });
    }

    if (!buy_conditions) {
      return res.status(400).json({ error: "Buy conditions are required" });
    }

    if (!sell_conditions) {
      return res.status(400).json({ error: "Sell conditions are required" });
    }

    // Validate buy conditions
    const buyNodes = Array.isArray(buy_conditions) ? buy_conditions : [buy_conditions];
    for (const node of buyNodes) {
      const validation = CustomStrategyService.validateConditionNode(node);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: `Invalid buy condition: ${validation.error}`,
          condition: node
        });
      }
    }

    // Validate sell conditions
    const sellNodes = Array.isArray(sell_conditions) ? sell_conditions : [sell_conditions];
    for (const node of sellNodes) {
      const validation = CustomStrategyService.validateConditionNode(node);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: `Invalid sell condition: ${validation.error}`,
          condition: node
        });
      }
    }

    // Check if name already exists
    const existing = await CustomStrategy.findByName(userId, name);
    if (existing) {
      return res.status(400).json({ error: "Strategy with this name already exists" });
    }

    const strategy = await CustomStrategy.create({
      user_id: userId,
      name,
      description,
      buy_conditions: buyNodes.length === 1 ? buyNodes[0] : buyNodes,
      sell_conditions: sellNodes.length === 1 ? sellNodes[0] : sellNodes,
      is_public: is_public === true
    });

    res.status(201).json({
      success: true,
      data: CustomStrategy.parseStrategyData(strategy)
    });
  } catch (error) {
    console.error("Error creating custom strategy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all custom strategies for a user
export const getUserCustomStrategies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const includeInactive = req.query.includeInactive === 'true';
    const strategies = await CustomStrategy.findByUserId(userId, includeInactive);

    res.json({
      success: true,
      data: strategies.map(s => CustomStrategy.parseStrategyData(s))
    });
  } catch (error) {
    console.error("Error getting custom strategies:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a specific custom strategy by ID
export const getCustomStrategyById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const strategyId = parseInt(req.params.strategyId);
    if (isNaN(strategyId)) {
      return res.status(400).json({ error: "Invalid strategy ID" });
    }

    const strategy = await CustomStrategy.findById(strategyId);
    
    if (!strategy) {
      return res.status(404).json({ error: "Strategy not found" });
    }

    if (strategy.user_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      success: true,
      data: CustomStrategy.parseStrategyData(strategy)
    });
  } catch (error) {
    console.error("Error getting custom strategy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a custom strategy
export const updateCustomStrategy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const strategyId = parseInt(req.params.strategyId);
    if (isNaN(strategyId)) {
      return res.status(400).json({ error: "Invalid strategy ID" });
    }

    const strategy = await CustomStrategy.findById(strategyId);
    if (!strategy || strategy.user_id !== userId) {
      return res.status(404).json({ error: "Strategy not found" });
    }

    const { name, description, buy_conditions, sell_conditions, is_active } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (buy_conditions !== undefined) {
      const buyNodes = Array.isArray(buy_conditions) ? buy_conditions : [buy_conditions];
      for (const node of buyNodes) {
        const validation = CustomStrategyService.validateConditionNode(node);
        if (!validation.valid) {
          return res.status(400).json({ 
            error: `Invalid buy condition: ${validation.error}`,
            condition: node
          });
        }
      }
      updateData.buy_conditions = buyNodes.length === 1 ? buyNodes[0] : buyNodes;
    }

    if (sell_conditions !== undefined) {
      const sellNodes = Array.isArray(sell_conditions) ? sell_conditions : [sell_conditions];
      for (const node of sellNodes) {
        const validation = CustomStrategyService.validateConditionNode(node);
        if (!validation.valid) {
          return res.status(400).json({ 
            error: `Invalid sell condition: ${validation.error}`,
            condition: node
          });
        }
      }
      updateData.sell_conditions = sellNodes.length === 1 ? sellNodes[0] : sellNodes;
    }

    const updated = await CustomStrategy.update(strategyId, updateData);
    
    if (!updated) {
      return res.status(404).json({ error: "Strategy not found" });
    }

    res.json({
      success: true,
      data: CustomStrategy.parseStrategyData(updated)
    });
  } catch (error) {
    console.error("Error updating custom strategy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a custom strategy
export const deleteCustomStrategy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const strategyId = parseInt(req.params.strategyId);
    if (isNaN(strategyId)) {
      return res.status(400).json({ error: "Invalid strategy ID" });
    }

    const strategy = await CustomStrategy.findById(strategyId);
    if (!strategy || strategy.user_id !== userId) {
      return res.status(404).json({ error: "Strategy not found" });
    }

    const deleted = await CustomStrategy.delete(strategyId);
    
    if (!deleted) {
      return res.status(404).json({ error: "Strategy not found" });
    }

    res.json({
      success: true,
      message: "Strategy deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting custom strategy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Test a custom strategy with sample data
export const testCustomStrategy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { buy_conditions, sell_conditions, price_data } = req.body;

    if (!buy_conditions || !sell_conditions) {
      return res.status(400).json({ error: "Buy and sell conditions are required" });
    }

    if (!price_data || !Array.isArray(price_data) || price_data.length === 0) {
      return res.status(400).json({ error: "Price data array is required" });
    }

    // Validate conditions
    const buyNodes = Array.isArray(buy_conditions) ? buy_conditions : [buy_conditions];
    const sellNodes = Array.isArray(sell_conditions) ? sell_conditions : [sell_conditions];

    for (const node of [...buyNodes, ...sellNodes]) {
      const validation = CustomStrategyService.validateConditionNode(node);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: `Invalid condition: ${validation.error}`,
          condition: node
        });
      }
    }

    // Execute strategy
    const signal = CustomStrategyService.executeStrategy(
      buyNodes.length === 1 ? buyNodes[0] : buyNodes,
      sellNodes.length === 1 ? sellNodes[0] : sellNodes,
      price_data
    );

    res.json({
      success: true,
      data: {
        signal,
        message: signal ? `Strategy generated ${signal} signal` : "No signal generated"
      }
    });
  } catch (error) {
    console.error("Error testing custom strategy:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

