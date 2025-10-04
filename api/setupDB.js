// api/setupDB.js
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Ensure db folder exists
const dbFolder = path.resolve(__dirname, "../db");
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true });
  console.log("Created db folder at", dbFolder);
}

// Database path
const dbPath = path.join(dbFolder, "trading_bot.db");

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  } else {
    console.log("Connected to SQLite database at", dbPath);
  }
});

// Create tables
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`,
    (err) => {
      if (err) console.error("Error creating users table:", err.message);
      else console.log("Users table ready");
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      key TEXT,
      value TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) console.error("Error creating settings table:", err.message);
      else console.log("Settings table ready");
    }
  );
});

// Close database when done
db.close((err) => {
  if (err) console.error("Error closing database:", err.message);
  else console.log("Database setup complete");
});
