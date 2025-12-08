import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requirePremium } from "../middleware/premiumAuth";
import {
  createCustomStrategy,
  getUserCustomStrategies,
  getCustomStrategyById,
  updateCustomStrategy,
  deleteCustomStrategy,
  testCustomStrategy,
  validateCustomStrategy
} from "../controllers/customStrategyController";

const router = Router();

// All routes require authentication and Premium+ tier
router.use(authenticateToken);
router.use(requirePremium);

// Create a new custom strategy
router.post("/", createCustomStrategy);

// Get all custom strategies for the authenticated user
router.get("/", getUserCustomStrategies);

// Validate a custom strategy
router.post("/validate", validateCustomStrategy);

// Test a custom strategy with sample data
router.post("/test", testCustomStrategy);

// Get a specific custom strategy by ID
router.get("/:strategyId", getCustomStrategyById);

// Update a custom strategy
router.put("/:strategyId", updateCustomStrategy);

// Delete a custom strategy
router.delete("/:strategyId", deleteCustomStrategy);

export { router as customStrategyRouter };

