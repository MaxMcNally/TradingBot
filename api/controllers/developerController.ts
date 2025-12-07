import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { ApiUsageLog } from "../models/ApiUsageLog";
import { Webhook } from "../models/Webhook";
import { db } from "../initDb";

// Get API usage logs
export const getApiUsageLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 100;
    const apiKeyId = req.query.apiKeyId ? parseInt(req.query.apiKeyId as string) : undefined;

    let logs;
    if (apiKeyId) {
      logs = await ApiUsageLog.findByApiKeyId(apiKeyId, limit);
    } else {
      logs = await ApiUsageLog.findByUserId(userId, limit);
    }

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error("Error getting API usage logs:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Get API usage statistics
export const getApiUsageStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;

    const stats = await ApiUsageLog.getStatsByUserId(userId, days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error getting API usage stats:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Get webhook event logs
export const getWebhookLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 100;
    const webhookId = req.query.webhookId ? parseInt(req.query.webhookId as string) : undefined;

    // Get user's webhooks
    const userWebhooks = await Webhook.findByUserId(userId);
    const webhookIds = webhookId 
      ? [webhookId] 
      : userWebhooks.map(w => w.id!);

    if (webhookIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get webhook events
    const placeholders = webhookIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT we.*, w.url as webhook_url
      FROM webhook_events we
      JOIN webhooks w ON we.webhook_id = w.id
      WHERE we.webhook_id IN (${placeholders})
      ORDER BY we.created_at DESC
      LIMIT $${webhookIds.length + 1}
    `;

    return new Promise((resolve, reject) => {
      db.all(
        query,
        [...webhookIds, limit],
        (err: any, rows: any[]) => {
          if (err) {
            console.error("Error getting webhook logs:", err);
            return res.status(500).json({ 
              success: false,
              error: "Internal server error" 
            });
          }

          const logs = (rows || []).map(row => ({
            id: row.id,
            webhook_id: row.webhook_id,
            webhook_url: row.webhook_url,
            event_type: row.event_type,
            payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
            status: row.status,
            response_code: row.response_code,
            response_body: row.response_body,
            error_message: row.error_message,
            created_at: row.created_at,
            sent_at: row.sent_at
          }));

          res.json({
            success: true,
            data: logs
          });
        }
      );
    });
  } catch (error) {
    console.error("Error getting webhook logs:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

