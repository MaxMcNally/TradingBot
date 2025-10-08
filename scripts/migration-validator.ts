import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class MigrationValidator {
  private db: any;
  private isPostgres: boolean;

  constructor(databaseUrl?: string) {
    const dbUrl = databaseUrl || process.env.DATABASE_URL || '';
    this.isPostgres = /^postgres(ql)?:\/\//i.test(dbUrl);
    
    if (this.isPostgres) {
      this.db = new Pool({ connectionString: dbUrl });
    } else {
      const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../api/db/trading_bot.db');
      this.db = new sqlite3.Database(dbPath);
    }
  }

  /**
   * Validate database schema integrity
   */
  async validateSchema(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Check if required tables exist
      const requiredTables = [
        'users',
        'settings', 
        'backtest_results',
        'user_strategies',
        'strategy_performance',
        'schema_migrations'
      ];

      for (const table of requiredTables) {
        const exists = await this.tableExists(table);
        if (!exists) {
          result.errors.push(`Required table '${table}' does not exist`);
          result.isValid = false;
        }
      }

      // Validate table structures
      await this.validateTableStructures(result);

      // Check for orphaned records
      await this.validateDataIntegrity(result);

      // Check indexes
      await this.validateIndexes(result);

    } catch (error) {
      result.errors.push(`Schema validation failed: ${error}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate that a migration can be safely applied
   */
  async validateMigration(migrationVersion: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Check if migration has already been applied
      const appliedMigrations = await this.getAppliedMigrations();
      if (appliedMigrations.includes(migrationVersion)) {
        result.warnings.push(`Migration ${migrationVersion} has already been applied`);
      }

      // Check database connectivity
      await this.testConnection();

      // Check available disk space (PostgreSQL only)
      if (this.isPostgres) {
        await this.checkDiskSpace(result);
      }

      // Check for active connections that might interfere
      await this.checkActiveConnections(result);

    } catch (error) {
      result.errors.push(`Migration validation failed: ${error}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate rollback safety
   */
  async validateRollback(migrationVersion: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Check if migration has been applied
      const appliedMigrations = await this.getAppliedMigrations();
      if (!appliedMigrations.includes(migrationVersion)) {
        result.errors.push(`Migration ${migrationVersion} has not been applied`);
        result.isValid = false;
        return result;
      }

      // Check for dependent data
      await this.checkDependentData(migrationVersion, result);

      // Check for active sessions
      await this.checkActiveSessions(result);

    } catch (error) {
      result.errors.push(`Rollback validation failed: ${error}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (this.isPostgres) {
      await this.db.query('SELECT 1');
    } else {
      return new Promise((resolve, reject) => {
        this.db.get('SELECT 1', (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  /**
   * Check if table exists
   */
  private async tableExists(tableName: string): Promise<boolean> {
    if (this.isPostgres) {
      const result = await this.db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);
      return result.rows[0].exists;
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `, [tableName], (err: any, row: any) => {
          if (err) reject(err);
          else resolve(!!row);
        });
      });
    }
  }

  /**
   * Get applied migrations
   */
  private async getAppliedMigrations(): Promise<string[]> {
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
   * Validate table structures
   */
  private async validateTableStructures(result: ValidationResult): Promise<void> {
    // Check users table structure
    if (await this.tableExists('users')) {
      const userColumns = await this.getTableColumns('users');
      const requiredUserColumns = ['id', 'username', 'password_hash', 'email', 'role'];
      
      for (const column of requiredUserColumns) {
        if (!userColumns.includes(column)) {
          result.errors.push(`Users table missing required column: ${column}`);
          result.isValid = false;
        }
      }
    }

    // Check strategy_performance table structure
    if (await this.tableExists('strategy_performance')) {
      const perfColumns = await this.getTableColumns('strategy_performance');
      const requiredPerfColumns = ['id', 'user_id', 'strategy_name', 'execution_type'];
      
      for (const column of requiredPerfColumns) {
        if (!perfColumns.includes(column)) {
          result.errors.push(`Strategy_performance table missing required column: ${column}`);
          result.isValid = false;
        }
      }
    }
  }

  /**
   * Get table columns
   */
  private async getTableColumns(tableName: string): Promise<string[]> {
    if (this.isPostgres) {
      const result = await this.db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);
      return result.rows.map((row: any) => row.column_name);
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(`PRAGMA table_info(${tableName})`, (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows.map(row => row.name));
        });
      });
    }
  }

  /**
   * Validate data integrity
   */
  private async validateDataIntegrity(result: ValidationResult): Promise<void> {
    // Check for orphaned settings
    if (await this.tableExists('settings') && await this.tableExists('users')) {
      const orphanedSettings = await this.countOrphanedSettings();
      if (orphanedSettings > 0) {
        result.warnings.push(`Found ${orphanedSettings} orphaned settings records`);
        result.suggestions.push('Consider cleaning up orphaned settings records');
      }
    }

    // Check for orphaned strategies
    if (await this.tableExists('user_strategies') && await this.tableExists('users')) {
      const orphanedStrategies = await this.countOrphanedStrategies();
      if (orphanedStrategies > 0) {
        result.warnings.push(`Found ${orphanedStrategies} orphaned strategy records`);
        result.suggestions.push('Consider cleaning up orphaned strategy records');
      }
    }
  }

  /**
   * Count orphaned settings
   */
  private async countOrphanedSettings(): Promise<number> {
    if (this.isPostgres) {
      const result = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM settings s 
        LEFT JOIN users u ON s.user_id = u.id 
        WHERE u.id IS NULL
      `);
      return parseInt(result.rows[0].count);
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(`
          SELECT COUNT(*) as count 
          FROM settings s 
          LEFT JOIN users u ON s.user_id = u.id 
          WHERE u.id IS NULL
        `, (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
    }
  }

  /**
   * Count orphaned strategies
   */
  private async countOrphanedStrategies(): Promise<number> {
    if (this.isPostgres) {
      const result = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM user_strategies s 
        LEFT JOIN users u ON s.user_id = u.id 
        WHERE u.id IS NULL
      `);
      return parseInt(result.rows[0].count);
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(`
          SELECT COUNT(*) as count 
          FROM user_strategies s 
          LEFT JOIN users u ON s.user_id = u.id 
          WHERE u.id IS NULL
        `, (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
    }
  }

  /**
   * Validate indexes
   */
  private async validateIndexes(result: ValidationResult): Promise<void> {
    const requiredIndexes = [
      { table: 'users', column: 'username' },
      { table: 'settings', column: 'user_id' },
      { table: 'strategy_performance', column: 'user_id' },
      { table: 'strategy_performance', column: 'strategy_name' }
    ];

    for (const index of requiredIndexes) {
      const exists = await this.indexExists(index.table, index.column);
      if (!exists) {
        result.warnings.push(`Missing index on ${index.table}.${index.column}`);
        result.suggestions.push(`Consider adding index: CREATE INDEX idx_${index.table}_${index.column} ON ${index.table}(${index.column})`);
      }
    }
  }

  /**
   * Check if index exists
   */
  private async indexExists(tableName: string, columnName: string): Promise<boolean> {
    if (this.isPostgres) {
      const result = await this.db.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE tablename = $1 
          AND indexdef LIKE $2
        )
      `, [tableName, `%${columnName}%`]);
      return result.rows[0].exists;
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(`PRAGMA index_list(${tableName})`, (err: any, rows: any[]) => {
          if (err) reject(err);
          else {
            const hasIndex = rows.some(row => 
              row.sql && row.sql.includes(columnName)
            );
            resolve(hasIndex);
          }
        });
      });
    }
  }

  /**
   * Check disk space (PostgreSQL only)
   */
  private async checkDiskSpace(result: ValidationResult): Promise<void> {
    try {
      const diskUsage = await this.db.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      result.suggestions.push(`Database size: ${diskUsage.rows[0].size}`);
    } catch (error) {
      result.warnings.push('Could not check disk space');
    }
  }

  /**
   * Check active connections
   */
  private async checkActiveConnections(result: ValidationResult): Promise<void> {
    if (this.isPostgres) {
      try {
        const connections = await this.db.query(`
          SELECT COUNT(*) as count 
          FROM pg_stat_activity 
          WHERE state = 'active'
        `);
        const activeCount = parseInt(connections.rows[0].count);
        if (activeCount > 10) {
          result.warnings.push(`High number of active connections: ${activeCount}`);
        }
      } catch (error) {
        result.warnings.push('Could not check active connections');
      }
    }
  }

  /**
   * Check dependent data
   */
  private async checkDependentData(migrationVersion: string, result: ValidationResult): Promise<void> {
    // This would be customized based on specific migration
    // For now, just check for active trading sessions
    if (await this.tableExists('trading_sessions')) {
      const activeSessions = await this.countActiveSessions();
      if (activeSessions > 0) {
        result.warnings.push(`Found ${activeSessions} active trading sessions`);
        result.suggestions.push('Consider stopping active trading sessions before rollback');
      }
    }
  }

  /**
   * Count active trading sessions
   */
  private async countActiveSessions(): Promise<number> {
    if (this.isPostgres) {
      const result = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM trading_sessions 
        WHERE status = 'ACTIVE'
      `);
      return parseInt(result.rows[0].count);
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(`
          SELECT COUNT(*) as count 
          FROM trading_sessions 
          WHERE status = 'ACTIVE'
        `, (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
    }
  }

  /**
   * Check active sessions
   */
  private async checkActiveSessions(result: ValidationResult): Promise<void> {
    const activeSessions = await this.countActiveSessions();
    if (activeSessions > 0) {
      result.warnings.push(`Found ${activeSessions} active trading sessions`);
      result.suggestions.push('Consider stopping active sessions before rollback');
    }
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
  const migrationVersion = process.argv[3];
  
  const validator = new MigrationValidator();
  
  async function runCommand() {
    try {
      let result;
      
      switch (command) {
        case 'schema':
          console.log('🔍 Validating database schema...');
          result = await validator.validateSchema();
          break;
        case 'migration':
          if (!migrationVersion) {
            console.error('Migration version required');
            process.exit(1);
          }
          console.log(`🔍 Validating migration ${migrationVersion}...`);
          result = await validator.validateMigration(migrationVersion);
          break;
        case 'rollback':
          if (!migrationVersion) {
            console.error('Migration version required');
            process.exit(1);
          }
          console.log(`🔍 Validating rollback of ${migrationVersion}...`);
          result = await validator.validateRollback(migrationVersion);
          break;
        default:
          console.log('Usage: node migration-validator.ts [schema|migration|rollback] [version]');
          process.exit(1);
      }
      
      console.log('\n📊 Validation Results:');
      console.log(`Valid: ${result.isValid ? '✅' : '❌'}`);
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      if (result.suggestions.length > 0) {
        console.log('\n💡 Suggestions:');
        result.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
      }
      
      process.exit(result.isValid ? 0 : 1);
      
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    } finally {
      await validator.close();
    }
  }
  
  runCommand();
}
