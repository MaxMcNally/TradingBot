import { Router, Request, Response } from "express";
import { db } from "../db";

export const authRouter = Router();

authRouter.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: "Invalid credentials" });
      res.json({ success: true, user: row });
    }
  );
});

authRouter.post("/signup", (req: Request, res: Response) => {
  const { username, password } = req.body;
  db.run(
    "INSERT INTO users(username, password) VALUES(?, ?)",
    [username, password],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, userId: this.lastID });
    }
  );
});

authRouter.post("/logout", (_req: Request, res: Response) => {
  // placeholder, actual logout depends on session/token handling
  res.json({ success: true });
});
