import sqlite3 from "sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../db/trading_bot.db");

export const db = new sqlite3.Database(dbPath, (err) => {
  console.log(dbPath);
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to SQLite database");
  }
});
