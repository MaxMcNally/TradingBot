import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { ApiKey } from "../models/ApiKey";
import { User } from "../models/User";

// Get all API keys for the authenticated user
export const getApiKeys = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Verify user has ENTERPRISE tier
    const user = await User.findById(userId);
    if (!user || user.plan_tier !== 'ENTERPRISE') {
      return res.status(403).json({ 
        success: false,
        error: "Enterprise tier required to manage API keys" 
      });
    }

    const apiKeys = await ApiKey.findByUserId(userId);
    
    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    console.error("Error getting API keys:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Create a new API key
export const createApiKey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { key_name } = req.body;

    if (!key_name || key_name.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Key name is required" 
      });
    }

    // Verify user has ENTERPRISE tier
    const user = await User.findById(userId);
    if (!user || user.plan_tier !== 'ENTERPRISE') {
      return res.status(403).json({ 
        success: false,
        error: "Enterprise tier required to create API keys" 
      });
    }

    const apiKey = await ApiKey.create({
      user_id: userId,
      key_name: key_name.trim()
    });

    res.json({
      success: true,
      data: apiKey
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Delete an API key
export const deleteApiKey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const keyId = parseInt(req.params.keyId);

    if (isNaN(keyId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid API key ID" 
      });
    }

    // Verify user has ENTERPRISE tier
    const user = await User.findById(userId);
    if (!user || user.plan_tier !== 'ENTERPRISE') {
      return res.status(403).json({ 
        success: false,
        error: "Enterprise tier required to manage API keys" 
      });
    }

    const deleted = await ApiKey.delete(keyId, userId);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: "API key not found" 
      });
    }

    res.json({
      success: true,
      message: "API key deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting API key:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

