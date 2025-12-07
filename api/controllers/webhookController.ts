import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Webhook, WebhookEventType } from "../models/Webhook";
import { User } from "../models/User";

// Get all webhooks for the authenticated user
export const getWebhooks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Verify user has ENTERPRISE tier
    const user = await User.findById(userId);
    if (!user || user.plan_tier !== 'ENTERPRISE') {
      return res.status(403).json({ 
        success: false,
        error: "Enterprise tier required to manage webhooks" 
      });
    }

    const webhooks = await Webhook.findByUserId(userId);
    
    // Parse event_types JSON
    const formattedWebhooks = webhooks.map(webhook => ({
      ...webhook,
      event_types: JSON.parse(webhook.event_types)
    }));

    res.json({
      success: true,
      data: formattedWebhooks
    });
  } catch (error) {
    console.error("Error getting webhooks:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Create a new webhook
export const createWebhook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { url, event_types, secret } = req.body;

    if (!url || url.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Webhook URL is required" 
      });
    }

    if (!event_types || !Array.isArray(event_types) || event_types.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "At least one event type is required" 
      });
    }

    // Validate event types
    const validEventTypes: WebhookEventType[] = ['bot.started', 'bot.finished', 'bot.error', 'trade.executed'];
    const invalidTypes = event_types.filter((et: string) => !validEventTypes.includes(et as WebhookEventType));
    if (invalidTypes.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid event types: ${invalidTypes.join(', ')}` 
      });
    }

    // Verify user has ENTERPRISE tier
    const user = await User.findById(userId);
    if (!user || user.plan_tier !== 'ENTERPRISE') {
      return res.status(403).json({ 
        success: false,
        error: "Enterprise tier required to create webhooks" 
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
        success: false,
        error: "Invalid webhook URL" 
      });
    }

    const webhook = await Webhook.create({
      user_id: userId,
      url: url.trim(),
      event_types: event_types as WebhookEventType[],
      secret: secret?.trim() || undefined
    });

    res.json({
      success: true,
      data: {
        ...webhook,
        event_types: JSON.parse(webhook.event_types)
      }
    });
  } catch (error) {
    console.error("Error creating webhook:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Update a webhook
export const updateWebhook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const webhookId = parseInt(req.params.webhookId);
    const { url, event_types, secret } = req.body;

    if (isNaN(webhookId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid webhook ID" 
      });
    }

    // Verify user has ENTERPRISE tier
    const user = await User.findById(userId);
    if (!user || user.plan_tier !== 'ENTERPRISE') {
      return res.status(403).json({ 
        success: false,
        error: "Enterprise tier required to manage webhooks" 
      });
    }

    const updates: any = {};
    if (url !== undefined) {
      try {
        new URL(url);
        updates.url = url.trim();
      } catch {
        return res.status(400).json({ 
          success: false,
          error: "Invalid webhook URL" 
        });
      }
    }
    if (event_types !== undefined) {
      if (!Array.isArray(event_types) || event_types.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: "At least one event type is required" 
        });
      }
      const validEventTypes: WebhookEventType[] = ['bot.started', 'bot.finished', 'bot.error', 'trade.executed'];
      const invalidTypes = event_types.filter((et: string) => !validEventTypes.includes(et as WebhookEventType));
      if (invalidTypes.length > 0) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid event types: ${invalidTypes.join(', ')}` 
        });
      }
      updates.event_types = event_types;
    }
    if (secret !== undefined) {
      updates.secret = secret?.trim() || null;
    }

    const updated = await Webhook.update(webhookId, userId, updates);
    
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        error: "Webhook not found" 
      });
    }

    const webhook = await Webhook.findById(webhookId);
    res.json({
      success: true,
      data: {
        ...webhook,
        event_types: JSON.parse(webhook!.event_types)
      }
    });
  } catch (error) {
    console.error("Error updating webhook:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Toggle webhook active status
export const toggleWebhook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const webhookId = parseInt(req.params.webhookId);
    const { is_active } = req.body;

    if (isNaN(webhookId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid webhook ID" 
      });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ 
        success: false,
        error: "is_active must be a boolean" 
      });
    }

    // Verify user has ENTERPRISE tier
    const user = await User.findById(userId);
    if (!user || user.plan_tier !== 'ENTERPRISE') {
      return res.status(403).json({ 
        success: false,
        error: "Enterprise tier required to manage webhooks" 
      });
    }

    const updated = await Webhook.toggleActive(webhookId, userId, is_active);
    
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        error: "Webhook not found" 
      });
    }

    res.json({
      success: true,
      message: `Webhook ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error("Error toggling webhook:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Delete a webhook
export const deleteWebhook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const webhookId = parseInt(req.params.webhookId);

    if (isNaN(webhookId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid webhook ID" 
      });
    }

    // Verify user has ENTERPRISE tier
    const user = await User.findById(userId);
    if (!user || user.plan_tier !== 'ENTERPRISE') {
      return res.status(403).json({ 
        success: false,
        error: "Enterprise tier required to manage webhooks" 
      });
    }

    const deleted = await Webhook.delete(webhookId, userId);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: "Webhook not found" 
      });
    }

    res.json({
      success: true,
      message: "Webhook deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

