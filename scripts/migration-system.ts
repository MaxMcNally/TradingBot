import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface Migration {
  version: string;
  name: string;
  up: (db: any) => Promise<void>;
  down: (db: any) => Promise<void>;
  description: string;
}

export class MigrationSystem {
  private db: any;
  private isPostgres: boolean;
  private migrations: Migration[] = [];
  private migrationsDir: string;

  constructor(databaseUrl?: string) {
    const dbUrl = databaseUrl || process.env.DATABASE_URL || '';
    this.isPostgres = /^postgres(ql)?:\/\//i.test(dbUrl);
    this.migrationsDir = path.join(__dirname, 'migrations');
    
    if (this.isPostgres) {
      this.db = new Pool({ connectionString: dbUrl });
    } else {
      const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../api/db/trading_bot.db');
      this.db = new sqlite3.Database(dbPath);
    }
  }

  /**
   * Register a migration
   */
  registerMigration(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * Initialize the migration system by creating the migrations table
   */
  async initialize(): Promise<void> {
    if (this.isPostgres) {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          applied_at TIMESTAMP DEFAULT NOW(),
          checksum VARCHAR(255)
        )
      `);
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            checksum TEXT
          )
        `, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  /**
   * Get the current database version
   */
  async getCurrentVersion(): Promise<string> {
    if (this.isPostgres) {
      const result = await this.db.query(`
        SELECT version FROM schema_migrations 
        ORDER BY applied_at DESC 
        LIMIT 1
      `);
      return result.rows[0]?.version || '0.0.0';
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(`
          SELECT version FROM schema_migrations 
          ORDER BY applied_at DESC 
          LIMIT 1
        `, (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row?.version || '0.0.0');
        });
      });
    }
  }

  /**
   * Get all applied migrations
   */
  async getAppliedMigrations(): Promise<string[]> {
    if (this.isPostgres) {
      const result = await this.db.query(`
        SELECT version FROM schema_migrations 
        ORDER BY applied_at ASC
      `);
      return result.rows.map((row: any) => row.version);
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(`
          SELECT version FROM schema_migrations 
          ORDER BY applied_at ASC
        `, (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows.map(row => row.version));
        });
      });
    }
  }

  /**
   * Check if a migration has been applied
   */
  async isMigrationApplied(version: string): Promise<boolean> {
    const applied = await this.getAppliedMigrations();
    return applied.includes(version);
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: Migration): Promise<void> {
    console.log(`🔄 Applying migration ${migration.version}: ${migration.name}`);
    
    try {
      // Start transaction
      if (this.isPostgres) {
        await this.db.query('BEGIN');
      } else {
        this.db.serialize();
      }

      // Apply the migration
      await migration.up(this.db);

      // Record the migration
      const checksum = this.calculateChecksum(migration);
      if (this.isPostgres) {
        await this.db.query(`
          INSERT INTO schema_migrations (version, name, description, checksum)
          VALUES ($1, $2, $3, $4)
        `, [migration.version, migration.name, migration.description, checksum]);
        await this.db.query('COMMIT');
      } else {
        return new Promise((resolve, reject) => {
          this.db.run(`
            INSERT INTO schema_migrations (version, name, description, checksum)
            VALUES (?, ?, ?, ?)
          `, [migration.version, migration.name, migration.description, checksum], (err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      console.log(`✅ Migration ${migration.version} applied successfully`);
    } catch (error) {
      // Rollback on error
      if (this.isPostgres) {
        await this.db.query('ROLLBACK');
      }
      console.error(`❌ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback a single migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    console.log(`🔄 Rolling back migration ${migration.version}: ${migration.name}`);
    
    try {
      // Start transaction
      if (this.isPostgres) {
        await this.db.query('BEGIN');
      } else {
        this.db.serialize();
      }

      // Rollback the migration
      await migration.down(this.db);

      // Remove the migration record
      if (this.isPostgres) {
        await this.db.query('DELETE FROM schema_migrations WHERE version = $1', [migration.version]);
        await this.db.query('COMMIT');
      } else {
        return new Promise((resolve, reject) => {
          this.db.run('DELETE FROM schema_migrations WHERE version = ?', [migration.version], (err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      console.log(`✅ Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      // Rollback on error
      if (this.isPostgres) {
        await this.db.query('ROLLBACK');
      }
      console.error(`❌ Rollback of migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Migrate to the latest version
   */
  async migrate(): Promise<void> {
    await this.initialize();
    
    const currentVersion = await this.getCurrentVersion();
    console.log(`📊 Current database version: ${currentVersion}`);
    
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = this.migrations.filter(m => 
      !appliedMigrations.includes(m.version)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ Database is up to date');
      return;
    }

    console.log(`🔄 Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await this.applyMigration(migration);
    }

    console.log('✅ All migrations completed successfully');
  }

  /**
   * Rollback to a specific version
   */
  async rollbackTo(version: string): Promise<void> {
    await this.initialize();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationsToRollback = appliedMigrations
      .filter(v => v > version)
      .map(v => this.migrations.find(m => m.version === v))
      .filter(Boolean)
      .reverse(); // Rollback in reverse order

    if (migrationsToRollback.length === 0) {
      console.log('✅ No migrations to rollback');
      return;
    }

    console.log(`🔄 Rolling back ${migrationsToRollback.length} migrations to version ${version}`);
    
    for (const migration of migrationsToRollback) {
      if (migration) {
        await this.rollbackMigration(migration);
      }
    }

    console.log('✅ Rollback completed successfully');
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    currentVersion: string;
    appliedMigrations: string[];
    pendingMigrations: string[];
    totalMigrations: number;
  }> {
    await this.initialize();
    
    const currentVersion = await this.getCurrentVersion();
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = this.migrations
      .filter(m => !appliedMigrations.includes(m.version))
      .map(m => m.version);

    return {
      currentVersion,
      appliedMigrations,
      pendingMigrations,
      totalMigrations: this.migrations.length
    };
  }

  /**
   * Calculate checksum for a migration
   */
  private calculateChecksum(migration: Migration): string {
    const content = `${migration.version}:${migration.name}:${migration.description}`;
    return require('crypto').createHash('md5').update(content).digest('hex');
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.isPostgres) {
      await this.db.end();
    } else {
      return new Promise((resolve) => {
        this.db.close((err: any) => {
          if (err) console.error('Error closing database:', err);
          resolve();
        });
      });
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const version = process.argv[3];
  
  const migrationSystem = new MigrationSystem();
  
  async function runCommand() {
    try {
      switch (command) {
        case 'migrate':
          await migrationSystem.migrate();
          break;
        case 'rollback':
          if (!version) {
            console.error('Version required for rollback');
            process.exit(1);
          }
          await migrationSystem.rollbackTo(version);
          break;
        case 'status':
          const status = await migrationSystem.getStatus();
          console.log('📊 Migration Status:');
          console.log(`Current Version: ${status.currentVersion}`);
          console.log(`Applied Migrations: ${status.appliedMigrations.length}`);
          console.log(`Pending Migrations: ${status.pendingMigrations.length}`);
          console.log(`Total Migrations: ${status.totalMigrations}`);
          break;
        default:
          console.log('Usage: node migration-system.ts [migrate|rollback|status] [version]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Migration command failed:', error);
      process.exit(1);
    } finally {
      await migrationSystem.close();
    }
  }
  
  runCommand();
}
