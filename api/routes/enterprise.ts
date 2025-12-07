import { Router } from "express";
import { authenticateApiKey } from "../middleware/apiKeyAuth";
import {
  getBots,
  getBot,
  getActiveBot,
  startBot,
  stopBot,
  getPerformance,
  getStats
} from "../controllers/enterpriseController";

export const enterpriseRouter = Router();

// All enterprise routes require API key authentication
enterpriseRouter.use(authenticateApiKey);

// Bot management endpoints
enterpriseRouter.get("/bots", getBots);
enterpriseRouter.get("/bots/active", getActiveBot);
enterpriseRouter.get("/bots/:botId", getBot);
enterpriseRouter.post("/bots", startBot);
enterpriseRouter.post("/bots/:botId/stop", stopBot);

// Performance and stats endpoints
enterpriseRouter.get("/performance", getPerformance);
enterpriseRouter.get("/stats", getStats);

export default enterpriseRouter;

