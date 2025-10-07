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
  getPublicStrategiesByType,
  copyPublicStrategy
} from "../controllers/strategyController";

const router = Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Strategies router is working" });
});

// Create a new strategy
router.post("/users/:userId/strategies", createStrategy);

// Get all strategies for a user
router.get("/users/:userId/strategies", getUserStrategies);

// Get all public strategies (must come before /:strategyId)
router.get("/public", getPublicStrategies);

// Get public strategies by type (must come before /:strategyId)
router.get("/public/:strategyType", getPublicStrategiesByType);

// Get a specific strategy by ID
router.get("/:strategyId", getStrategyById);

// Update a strategy
router.put("/:strategyId", updateStrategy);

// Delete a strategy
router.delete("/:strategyId", deleteStrategy);

// Deactivate a strategy
router.patch("/:strategyId/deactivate", deactivateStrategy);

// Activate a strategy
router.patch("/:strategyId/activate", activateStrategy);

// Save a strategy from backtest results
router.post("/users/:userId/strategies/from-backtest", saveStrategyFromBacktest);

// Copy a public strategy to user's collection
router.post("/users/:userId/strategies/copy-public", copyPublicStrategy);

export { router as strategyRouter };
