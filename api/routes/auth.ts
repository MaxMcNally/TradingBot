import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
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
      ? "SELECT id, username, password_hash, email, created_at FROM users WHERE username = $1"
      : "SELECT id, username, password_hash, email, created_at FROM users WHERE username = ?",
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

        // Return user data (without password hash)
        const { password_hash, ...user } = row;
        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.created_at
        };
        
        // Generate JWT token
        const token = generateToken(userData);
        
        res.json({ 
          success: true, 
          user: userData,
          token
        });
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

    db.run(
      isPostgres
        ? "INSERT INTO users(username, password_hash, email) VALUES($1, $2, $3)"
        : "INSERT INTO users(username, password_hash, email) VALUES(?, ?, ?)",
      [username, hashedPassword, email || null],
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
          email: email || null
        };
        
        // Generate JWT token
        const token = generateToken(userData);
        
        res.json({ 
          success: true, 
          user: userData,
          token
        });
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
  res.json({ 
    success: true, 
    user: req.user
  });
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
        function (err) {
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
            (err, user: any) => {
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
