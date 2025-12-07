import express, { Request,Response } from "express";
import { db } from "../initDb";
import { authenticateToken } from "../middleware/auth";

// routes/settings.js
export const settingsRouter = express.Router();

// SAVE settings endpoint
settingsRouter.post("/save", authenticateToken, (req: Request, res: Response) => {
  const { user_id, key, value } = req.body;
  db.run(
    `INSERT INTO settings (user_id, key, value)
     VALUES ($1, $2, $3)
     ON CONFLICT(user_id, key) DO UPDATE SET value=EXCLUDED.value`,
    [user_id, key, value],
    function (err: any) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

