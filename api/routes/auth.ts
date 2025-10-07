import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { db, isPostgres } from "../initDb";
import { generateToken, authenticateToken, AuthenticatedRequest } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  db.get(
    isPostgres
      ? "SELECT id, username, password_hash, email, email_verified, two_factor_enabled, created_at FROM users WHERE username = $1"
      : "SELECT id, username, password_hash, email, email_verified, two_factor_enabled, created_at FROM users WHERE username = ?",
    [username],
    (err: any, row: any) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      
      if (!row) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      bcrypt.compare(password, row.password_hash, (err: any, isMatch?: boolean) => {
        if (err) {
          console.error("Password comparison error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }

        if (!isMatch) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        if (row.two_factor_enabled) {
          // Require 2FA step
          return res.json({
            success: true,
            requires2fa: true,
            user: { id: row.id, username: row.username, email: row.email, email_verified: row.email_verified },
          });
        }

        const userData = {
          id: row.id,
          username: row.username,
          email: row.email,
          email_verified: row.email_verified,
          two_factor_enabled: row.two_factor_enabled,
          createdAt: row.created_at,
        };
        const token = generateToken(userData);
        res.json({ success: true, user: userData, token });
      });
    }
  );
});

authRouter.post("/signup", (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  // Hash password
  bcrypt.hash(password, 10, (err: any, hashedPassword?: string) => {
    if (err) {
      console.error("Password hashing error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const sentAt = new Date().toISOString();
    db.run(
      isPostgres
        ? "INSERT INTO users(username, password_hash, email, email_verified, email_verification_token, email_verification_sent_at, two_factor_enabled) VALUES($1, $2, $3, FALSE, $4, $5, FALSE)"
        : "INSERT INTO users(username, password_hash, email, email_verified, email_verification_token, email_verification_sent_at, two_factor_enabled) VALUES(?, ?, ?, 0, ?, ?, 0)",
      [username, hashedPassword, email || null, emailVerificationToken, sentAt],
      function (this: any, err: any) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(409).json({ error: "Username already exists" });
          }
          console.error("Database error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }

        const userData = {
          id: this.lastID,
          username,
          email: email || null,
          email_verified: 0,
        };
        const token = generateToken(userData);
        res.json({ success: true, user: userData, token, emailVerificationRequired: true });
      }
    );
  });
});

authRouter.post("/logout", (_req: Request, res: Response) => {
  // For now, just return success. In a real app, you'd invalidate the session/token
  res.json({ success: true, message: "Logged out successfully" });
});

// Get current user info (for session validation)
authRouter.get("/me", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "User not authenticated" });
  db.get(
    "SELECT id, username, email, email_verified, two_factor_enabled, created_at FROM users WHERE id = ?",
    [userId],
    (err: any, row: any) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      if (!row) return res.status(404).json({ error: "User not found" });
      const userData = {
        id: row.id,
        username: row.username,
        email: row.email,
        email_verified: row.email_verified,
        two_factor_enabled: row.two_factor_enabled,
        createdAt: row.created_at,
      };
      res.json({ success: true, user: userData });
    }
  );
});

// Refresh token endpoint
authRouter.post("/refresh", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  // Generate a new token with the same user data
  const newToken = generateToken({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email
  });

  res.json({ 
    success: true, 
    token: newToken,
    user: req.user
  });
});

// Update account settings
authRouter.put("/account", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { name, email, username } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  // Validate input
  if (!name || !email || !username) {
    return res.status(400).json({ error: "Name, email, and username are required" });
  }

  // Check if username is already taken by another user
  db.get(
    isPostgres
      ? "SELECT id FROM users WHERE username = $1 AND id != $2"
      : "SELECT id FROM users WHERE username = ? AND id != ?",
    [username, userId],
    (err: any, row: any) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (row) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Update user information
      db.run(
        isPostgres
          ? "UPDATE users SET username = $1, email = $2, updated_at = NOW() WHERE id = $3"
          : "UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [username, email, userId],
        function (err: any) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Internal server error" });
          }

          // Get updated user data
          db.get(
            isPostgres
              ? "SELECT id, username, email, created_at FROM users WHERE id = $1"
              : "SELECT id, username, email, created_at FROM users WHERE id = ?",
            [userId],
            (err: any, user: any) => {
              if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Internal server error" });
              }

              const userData = {
                id: user.id,
                username: user.username,
                email: user.email,
                name: name, // Store name in settings or add to users table
                createdAt: user.created_at
              };

              res.json({ 
                success: true, 
                user: userData
              });
            }
          );
        }
      );
    }
  );
});

// Email verification
authRouter.post("/verify-email/request", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "User not authenticated" });
  const token = crypto.randomBytes(32).toString("hex");
  const sentAt = new Date().toISOString();
  db.run(
    "UPDATE users SET email_verification_token = ?, email_verification_sent_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [token, sentAt, userId],
    function (err: any) {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json({ success: true, verificationToken: token }); // In production, email this instead
    }
  );
});

authRouter.post("/verify-email/confirm", (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token is required" });
  db.get("SELECT id FROM users WHERE email_verification_token = ?", [token], (err: any, row: any) => {
    if (err) return res.status(500).json({ error: "Internal server error" });
    if (!row) return res.status(400).json({ error: "Invalid token" });
    db.run(
      "UPDATE users SET email_verified = 1, email_verification_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [row.id],
      function (err: any) {
        if (err) return res.status(500).json({ error: "Internal server error" });
        res.json({ success: true });
      }
    );
  });
});

// 2FA setup
authRouter.post("/2fa/setup", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "User not authenticated" });
  const secret = speakeasy.generateSecret({ name: `TradingBot (${req.user?.username})` });
  try {
    const otpauth = secret.otpauth_url as string;
    const qrDataUrl = await QRCode.toDataURL(otpauth);
    // Save temp secret to user for verification
    db.run("UPDATE users SET two_factor_secret = ? WHERE id = ?", [secret.base32, userId], function (err: any) {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json({ success: true, secret: secret.base32, qrCodeDataUrl: qrDataUrl });
    });
  } catch (e) {
    return res.status(500).json({ error: "Failed to generate QR code" });
  }
});

authRouter.post("/2fa/enable", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { token } = req.body;
  if (!userId) return res.status(401).json({ error: "User not authenticated" });
  if (!token) return res.status(400).json({ error: "Token is required" });
  db.get("SELECT two_factor_secret FROM users WHERE id = ?", [userId], (err: any, row: any) => {
    if (err) return res.status(500).json({ error: "Internal server error" });
    if (!row?.two_factor_secret) return res.status(400).json({ error: "2FA not initialized" });
    const verified = speakeasy.totp.verify({ secret: row.two_factor_secret, encoding: 'base32', token });
    if (!verified) return res.status(400).json({ error: "Invalid 2FA token" });
    db.run("UPDATE users SET two_factor_enabled = 1 WHERE id = ?", [userId], function (err: any) {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json({ success: true });
    });
  });
});

authRouter.post("/2fa/disable", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { token } = req.body;
  if (!userId) return res.status(401).json({ error: "User not authenticated" });
  db.run("UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?", [userId], function (err: any) {
    if (err) return res.status(500).json({ error: "Internal server error" });
    res.json({ success: true });
  });
});

authRouter.post("/2fa/verify", (req: Request, res: Response) => {
  const { username, token } = req.body;
  if (!username || !token) return res.status(400).json({ error: "Username and token are required" });
  db.get("SELECT id, username, email, email_verified, created_at, two_factor_secret FROM users WHERE username = ?", [username], (err: any, row: any) => {
    if (err) return res.status(500).json({ error: "Internal server error" });
    if (!row?.two_factor_secret) return res.status(400).json({ error: "2FA not enabled" });
    const verified = speakeasy.totp.verify({ secret: row.two_factor_secret, encoding: 'base32', token });
    if (!verified) return res.status(401).json({ error: "Invalid 2FA token" });
    const userData = { id: row.id, username: row.username, email: row.email, email_verified: row.email_verified, two_factor_enabled: 1, createdAt: row.created_at };
    const jwtToken = generateToken(userData);
    res.json({ success: true, user: userData, token: jwtToken });
  });
});

// Password reset
authRouter.post("/password/reset/request", (req: Request, res: Response) => {
  const { emailOrUsername } = req.body;
  if (!emailOrUsername) return res.status(400).json({ error: "Email or username is required" });
  db.get("SELECT id FROM users WHERE email = ? OR username = ?", [emailOrUsername, emailOrUsername], (err: any, row: any) => {
    if (err) return res.status(500).json({ error: "Internal server error" });
    if (!row) return res.json({ success: true }); // Do not leak existence
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString(); // 30 min
    db.run("UPDATE users SET password_reset_token = ?, password_reset_expires_at = ? WHERE id = ?", [token, expiresAt, row.id], function (err: any) {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json({ success: true, resetToken: token }); // In production, email this instead
    });
  });
});

authRouter.post("/password/reset/confirm", (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: "Token and newPassword are required" });
  db.get("SELECT id FROM users WHERE password_reset_token = ? AND (password_reset_expires_at IS NULL OR password_reset_expires_at > CURRENT_TIMESTAMP)", [token], (err: any, row: any) => {
    if (err) return res.status(500).json({ error: "Internal server error" });
    if (!row) return res.status(400).json({ error: "Invalid or expired token" });
    bcrypt.hash(newPassword, 10, (err: any, hashedPassword?: string) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      if (!hashedPassword) return res.status(500).json({ error: "Password hashing failed" });
      db.run("UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [hashedPassword, row.id], function (err: any) {
        if (err) return res.status(500).json({ error: "Internal server error" });
        res.json({ success: true });
      });
    });
  });
});
