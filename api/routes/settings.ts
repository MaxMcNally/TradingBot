import express, { Request, Response } from "express";
import { db, isPostgres } from "../initDb";
import { encrypt, decrypt } from "../utils/encryption";
import { authenticateToken } from "../middleware/auth";

// routes/settings.js
export const settingsRouter = express.Router();

// SAVE settings endpoint
settingsRouter.post("/save", (req: Request, res: Response) => {
  const { user_id, key, value } = req.body;
  db.run(
    isPostgres
      ? `INSERT INTO settings (user_id, key, value)
         VALUES ($1, $2, $3)
         ON CONFLICT(user_id, key) DO UPDATE SET value=EXCLUDED.value`
      : `INSERT INTO settings (user_id, key, value)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, key) DO UPDATE SET value=excluded.value`,
    [user_id, key, value],
    function (err: any) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// GET settings endpoint
settingsRouter.get("/:user_id", (req: Request, res: Response) => {
  const { user_id } = req.params;
  db.all(
    isPostgres
      ? "SELECT * FROM settings WHERE user_id = $1"
      : "SELECT * FROM settings WHERE user_id = ?",
    [user_id],
    (err: any, rows: any[]) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// Alpaca API credentials endpoints
settingsRouter.post("/alpaca/credentials", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { apiKey, apiSecret } = req.body;
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: "API key and secret are required" });
    }

    // Encrypt credentials before storing
    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = encrypt(apiSecret);

    // Store encrypted credentials
    const saveCredential = (key: string, value: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        db.run(
          isPostgres
            ? `INSERT INTO settings (user_id, key, value)
               VALUES ($1, $2, $3)
               ON CONFLICT(user_id, key) DO UPDATE SET value=EXCLUDED.value`
            : `INSERT INTO settings (user_id, key, value)
               VALUES (?, ?, ?)
               ON CONFLICT(user_id, key) DO UPDATE SET value=excluded.value`,
          [userId, key, value],
          function (err: any) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    };

    await Promise.all([
      saveCredential("alpaca_api_key", encryptedKey),
      saveCredential("alpaca_api_secret", encryptedSecret)
    ]);

    res.json({ success: true, message: "Alpaca credentials saved successfully" });
  } catch (error: any) {
    console.error("Error saving Alpaca credentials:", error);
    res.status(500).json({ error: error.message || "Failed to save credentials" });
  }
});

settingsRouter.get("/alpaca/credentials", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get encrypted credentials
    const getCredential = (key: string): Promise<string | null> => {
      return new Promise((resolve, reject) => {
        db.get(
          isPostgres
            ? "SELECT value FROM settings WHERE user_id = $1 AND key = $2"
            : "SELECT value FROM settings WHERE user_id = ? AND key = ?",
          [userId, key],
          (err: any, row: any) => {
            if (err) reject(err);
            else resolve(row?.value || null);
          }
        );
      });
    };

    const encryptedKey = await getCredential("alpaca_api_key");
    const encryptedSecret = await getCredential("alpaca_api_secret");

    if (!encryptedKey || !encryptedSecret) {
      return res.json({ hasCredentials: false });
    }

    // Decrypt and return (only for verification - frontend should not store decrypted values)
    try {
      const apiKey = decrypt(encryptedKey);
      const apiSecret = decrypt(encryptedSecret);
      
      // Return masked credentials for display
      res.json({
        hasCredentials: true,
        apiKeyMasked: apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4),
        // Don't return the secret even masked for security
      });
    } catch (decryptError) {
      console.error("Error decrypting credentials:", decryptError);
      res.status(500).json({ error: "Failed to decrypt credentials" });
    }
  } catch (error: any) {
    console.error("Error getting Alpaca credentials:", error);
    res.status(500).json({ error: error.message || "Failed to get credentials" });
  }
});

settingsRouter.delete("/alpaca/credentials", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const deleteCredential = (key: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        db.run(
          isPostgres
            ? "DELETE FROM settings WHERE user_id = $1 AND key = $2"
            : "DELETE FROM settings WHERE user_id = ? AND key = ?",
          [userId, key],
          function (err: any) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    };

    await Promise.all([
      deleteCredential("alpaca_api_key"),
      deleteCredential("alpaca_api_secret")
    ]);

    res.json({ success: true, message: "Alpaca credentials deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting Alpaca credentials:", error);
    res.status(500).json({ error: error.message || "Failed to delete credentials" });
  }
});

