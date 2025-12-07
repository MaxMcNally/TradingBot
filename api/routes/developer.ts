import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  getApiKeys,
  createApiKey,
  deleteApiKey
} from "../controllers/apiKeyController";
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  toggleWebhook,
  deleteWebhook
} from "../controllers/webhookController";
import {
  getApiUsageLogs,
  getApiUsageStats,
  getWebhookLogs
} from "../controllers/developerController";

export const developerRouter = Router();

// All developer routes require authentication
developerRouter.use(authenticateToken);

// API Key management
developerRouter.get("/api-keys", getApiKeys);
developerRouter.post("/api-keys", createApiKey);
developerRouter.delete("/api-keys/:keyId", deleteApiKey);

// Webhook management
developerRouter.get("/webhooks", getWebhooks);
developerRouter.post("/webhooks", createWebhook);
developerRouter.put("/webhooks/:webhookId", updateWebhook);
developerRouter.patch("/webhooks/:webhookId/toggle", toggleWebhook);
developerRouter.delete("/webhooks/:webhookId", deleteWebhook);

// Usage logs and statistics
developerRouter.get("/usage-logs", getApiUsageLogs);
developerRouter.get("/usage-stats", getApiUsageStats);
developerRouter.get("/webhook-logs", getWebhookLogs);

export default developerRouter;

