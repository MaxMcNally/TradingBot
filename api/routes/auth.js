// routes/auth.js
const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Use absolute path to db
const dbPath = path.resolve(__dirname, "../db/trading_bot.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Failed to connect to DB:", err.message);
  else console.log("Connected to SQLite DB at", dbPath);
});

// SIGNUP endpoint
router.post("/signup", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  // Check if user already exists
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(409).json({ error: "Username already exists" });

    // Insert new user
    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, password],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, user: { id: this.lastID, username } });
      }
    );
  });
});

// LOGIN endpoint
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: "Invalid credentials" });
      res.json({ success: true, user: { id: row.id, username: row.username } });
    }
  );
});

// LOGOUT endpoint
router.post("/logout", (req, res) => {
  // For now, just return success
  res.json({ success: true });
});

module.exports = router;
