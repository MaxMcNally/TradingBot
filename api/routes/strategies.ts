import { Router } from "express";
import {
  createStrategy,
  getUserStrategies,
  getStrategyById,
  updateStrategy,
  deleteStrategy,
  deactivateStrategy,
  activateStrategy,
  saveStrategyFromBacktest,
  getPublicStrategies,
  getPublicStrategiesByType
} from "../controllers/strategyController";

const router = Router();

// Create a new strategy
router.post("/users/:userId/strategies", createStrategy);

// Get all strategies for a user
router.get("/users/:userId/strategies", getUserStrategies);

// Get a specific strategy by ID
router.get("/strategies/:strategyId", getStrategyById);

// Update a strategy
router.put("/strategies/:strategyId", updateStrategy);

// Delete a strategy
router.delete("/strategies/:strategyId", deleteStrategy);

// Deactivate a strategy
router.patch("/strategies/:strategyId/deactivate", deactivateStrategy);

// Activate a strategy
router.patch("/strategies/:strategyId/activate", activateStrategy);

// Save a strategy from backtest results
router.post("/users/:userId/strategies/from-backtest", saveStrategyFromBacktest);

// Get all public strategies
router.get("/strategies/public", getPublicStrategies);

// Get public strategies by type
router.get("/strategies/public/:strategyType", getPublicStrategiesByType);

export { router as strategyRouter };
