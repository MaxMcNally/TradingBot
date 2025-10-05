import express, { Request,Response } from "express";
import { db } from "../initDb";

// routes/settings.js
export const settingsRouter = express.Router();

// SAVE settings endpoint
settingsRouter.post("/save", (req: Request, res: Response) => {
  const { user_id, key, value } = req.body;
  db.run(
    `INSERT INTO settings (user_id, key, value)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, key) DO UPDATE SET value=excluded.value`,
    [user_id, key, value],
    function (err:any) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

