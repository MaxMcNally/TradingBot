import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.resolve(__dirname, "../../db/cache.db");

export class CacheDatabase {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Could not connect to cache database", err);
      } else {
        console.log("Connected to cache database");
        this.initializeSchema();
      }
    });
  }

  private initializeSchema() {
    try {
      const schemaPath = path.resolve(__dirname, "cacheSchema.sql");
      const schema = fs.readFileSync(schemaPath, "utf8");
      
      this.db.exec(schema, (err) => {
        if (err) {
          console.error("Error initializing cache schema:", err);
          // Continue without cache if schema initialization fails
        } else {
          console.log("Cache schema initialized successfully");
        }
      });
    } catch (error) {
      console.error("Error reading cache schema file:", error);
      // Continue without cache if schema file is not found
    }
  }

  getDatabase(): sqlite3.Database {
    return this.db;
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error("Error closing cache database:", err);
      } else {
        console.log("Cache database connection closed");
      }
    });
  }
}

// Export singleton instance
export const cacheDb = new CacheDatabase();
