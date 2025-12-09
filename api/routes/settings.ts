import express, { Request,Response } from "express";
import { db } from "../initDb";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { Settings } from "../models/Settings";

// routes/settings.js
export const settingsRouter = express.Router();

// GET settings endpoint
settingsRouter.get("/:user_id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user_id } = req.params;
    const userId = parseInt(user_id);
    
    // Verify the user is accessing their own settings
    if (req.user?.id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const settings = await Settings.findByUserId(userId);
    // Transform to match client API format
    const transformedSettings = settings.map(s => ({
      id: s.id?.toString(),
      user_id: s.user_id.toString(),
      setting_key: s.key,
      setting_value: s.value,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));
    res.json(transformedSettings);
  } catch (err: any) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// SAVE settings endpoint (also supports POST / for compatibility)
settingsRouter.post("/", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { user_id, setting_key, setting_value } = req.body;
  const key = setting_key || req.body.key;
  const value = setting_value || req.body.value;
  const userId = parseInt(user_id);
  
  // Verify the user is saving their own settings
  if (req.user?.id !== userId) {
    return res.status(403).json({ error: "Access denied" });
  }
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  
  db.run(
    `INSERT INTO settings (user_id, key, value, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, key) DO UPDATE SET value=EXCLUDED.value, updated_at=CURRENT_TIMESTAMP`,
    [userId, key, value],
    function (err: any) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

