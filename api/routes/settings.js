// routes/settings.js
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

// SAVE settings endpoint
router.post("/save", (req, res) => {
  const { user_id, key, value } = req.body;
  db.run(
    `INSERT INTO settings (user_id, key, value)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, key) DO UPDATE SET value=excluded.value`,
    [user_id, key, value],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

module.exports = router;
