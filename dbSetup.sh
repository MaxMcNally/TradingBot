#!/bin/bash

# Exit on error
set -e

DB_DIR="api/db"
DB_FILE="$DB_DIR/app.db"

echo "Creating database directory if it doesn't exist..."
mkdir -p $DB_DIR

echo "Creating SQLite database at $DB_FILE..."
# This will create the database file if it doesn't exist
sqlite3 $DB_FILE "PRAGMA foreign_keys = ON;"

echo "Creating tables..."

# Users table
sqlite3 $DB_FILE <<SQL
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SQL

# Settings table
sqlite3 $DB_FILE <<SQL
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
SQL

echo "Database setup complete!"
