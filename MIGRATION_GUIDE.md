# Database Migration Guide

This guide explains how to use the database migration system for the TradingBot project.

## Overview

The migration system provides:
- **Version tracking**: Track which migrations have been applied
- **Rollback support**: Safely rollback migrations if needed
- **Validation**: Validate database schema and migration safety
- **CI/CD Integration**: Automatic migrations in CircleCI pipeline
- **Multi-database support**: Works with both PostgreSQL and SQLite

## Quick Start

### Check Migration Status
```bash
yarn migrate:status
```

### Run Pending Migrations
```bash
yarn migrate:run
```

### Create New Migration
```bash
yarn migrate:create 1.0.3 add-new-feature
```

### Rollback Migration
```bash
yarn migrate:rollback 1.0.2
```

## Migration System Architecture

### Core Components

1. **MigrationSystem** (`scripts/migration-system.ts`)
   - Manages migration lifecycle
   - Tracks applied migrations
   - Handles rollbacks

2. **MigrationValidator** (`scripts/migration-validator.ts`)
   - Validates database schema
   - Checks migration safety
   - Provides rollback validation

3. **Migration Runner** (`scripts/run-migrations.ts`)
   - CLI interface for migrations
   - Loads and executes migrations
   - Creates new migration files

### Migration Files

Migrations are stored in `scripts/migrations/` and follow this structure:

```typescript
import { Migration } from '../migration-system';

export const migration: Migration = {
  version: '1.0.1',
  name: 'add-user-preferences',
  description: 'Add user preferences table',
  
  async up(db: any) {
    // Migration logic here
  },
  
  async down(db: any) {
    // Rollback logic here
  }
};
```

## Migration Workflow

### 1. Development Workflow

```bash
# 1. Create a new migration
yarn migrate:create 1.0.3 add-trading-sessions

# 2. Edit the generated migration file
# scripts/migrations/YYYY-MM-DDTHH-mm-ss-1.0.3-add-trading-sessions.ts

# 3. Test locally
yarn migrate:run

# 4. Validate schema
yarn migrate:validate:schema

# 5. Check status
yarn migrate:status
```

### 2. CI/CD Integration

The CircleCI pipeline automatically runs migrations:

#### QA Environment
- Runs after successful tests and build
- Executes before deployment
- Uses `QA_DATABASE_URL` environment variable

#### Production Environment
- Runs only on GitHub releases (tags)
- Executes before deployment
- Uses `PROD_DATABASE_URL` environment variable

### 3. Rollback Workflow

```bash
# 1. Validate rollback safety
yarn migrate:validate:rollback 1.0.2

# 2. Perform rollback
yarn migrate:rollback 1.0.2

# 3. Verify status
yarn migrate:status
```

## Environment Variables

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SQLITE_DB_PATH`: Path to SQLite database (fallback)

### CI/CD Variables

- `QA_DATABASE_URL`: QA environment database URL
- `PROD_DATABASE_URL`: Production environment database URL

## Migration Best Practices

### 1. Naming Conventions

- Use semantic versioning: `1.0.1`, `1.0.2`, etc.
- Use descriptive names: `add-user-preferences`, `fix-performance-indexes`
- Keep names short but clear

### 2. Migration Structure

```typescript
async up(db: any) {
  const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
  
  if (isPostgres) {
    // PostgreSQL-specific code
    await db.query(`CREATE TABLE ...`);
  } else {
    // SQLite-specific code
    return new Promise((resolve, reject) => {
      db.run(`CREATE TABLE ...`, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
```

### 3. Rollback Safety

- Always implement the `down` method
- Test rollbacks in development
- Consider data loss implications
- Use transactions when possible

### 4. Data Migrations

```typescript
async up(db: any) {
  // 1. Create new structure
  await this.createNewTable(db);
  
  // 2. Migrate existing data
  await this.migrateData(db);
  
  // 3. Drop old structure (if needed)
  await this.dropOldTable(db);
}
```

## Validation and Safety

### Schema Validation

```bash
# Check overall database health
yarn migrate:validate:schema
```

Validates:
- Required tables exist
- Table structures are correct
- Indexes are present
- Data integrity (orphaned records)
- Foreign key constraints

### Migration Validation

```bash
# Validate before applying migration
yarn migrate:validate:migration 1.0.3
```

Checks:
- Migration hasn't been applied
- Database connectivity
- Available disk space
- Active connections

### Rollback Validation

```bash
# Validate before rollback
yarn migrate:validate:rollback 1.0.2
```

Checks:
- Migration has been applied
- No dependent data exists
- No active trading sessions
- Rollback safety

## Troubleshooting

### Common Issues

1. **Migration Already Applied**
   ```
   Error: Migration 1.0.1 has already been applied
   ```
   - Check migration status: `yarn migrate:status`
   - Use rollback if needed: `yarn migrate:rollback 1.0.1`

2. **Database Connection Failed**
   ```
   Error: Could not connect to database
   ```
   - Check `DATABASE_URL` environment variable
   - Verify database is running
   - Check network connectivity

3. **Migration Failed**
   ```
   Error: Migration 1.0.2 failed
   ```
   - Check migration logs
   - Validate schema: `yarn migrate:validate:schema`
   - Consider rollback: `yarn migrate:rollback 1.0.1`

### Recovery Procedures

1. **Failed Migration Recovery**
   ```bash
   # 1. Check what was applied
   yarn migrate:status
   
   # 2. Rollback to last known good state
   yarn migrate:rollback 1.0.1
   
   # 3. Fix migration and retry
   yarn migrate:run
   ```

2. **Schema Corruption Recovery**
   ```bash
   # 1. Validate schema
   yarn migrate:validate:schema
   
   # 2. Check for orphaned data
   # (See validation output for suggestions)
   
   # 3. Manual cleanup if needed
   ```

## Monitoring and Logging

### Migration Logs

Migrations are logged with:
- Timestamp
- Migration version and name
- Success/failure status
- Error details (if failed)

### CircleCI Integration

Migration steps in CircleCI:
1. **migrate-qa-database**: Runs QA migrations
2. **migrate-production-database**: Runs production migrations

Both jobs include:
- Environment variable setup
- Migration execution
- Status verification

## Advanced Usage

### Custom Migration Scripts

For complex migrations, create custom scripts:

```typescript
// scripts/custom-migration.ts
import { MigrationSystem } from './migration-system';

async function customMigration() {
  const system = new MigrationSystem();
  
  // Custom logic here
  await system.migrate();
  await system.close();
}

customMigration().catch(console.error);
```

### Batch Operations

For multiple related changes:

```typescript
async up(db: any) {
  // Group related changes in a single migration
  await this.createTable1(db);
  await this.createTable2(db);
  await this.createIndexes(db);
  await this.migrateData(db);
}
```

## Security Considerations

1. **Environment Variables**
   - Never commit database URLs
   - Use CircleCI contexts for secrets
   - Rotate credentials regularly

2. **Migration Access**
   - Limit who can create migrations
   - Review all migration code
   - Test in QA before production

3. **Data Protection**
   - Backup before major migrations
   - Use transactions for data changes
   - Validate rollback procedures

## Support

For issues with the migration system:

1. Check this guide first
2. Run validation commands
3. Check CircleCI logs
4. Review migration files
5. Contact the development team

## Examples

### Adding a New Table

```typescript
export const migration: Migration = {
  version: '1.0.3',
  name: 'add-notifications',
  description: 'Add user notifications table',
  
  async up(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      await db.query(`
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } else {
      return new Promise((resolve, reject) => {
        db.run(`
          CREATE TABLE notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  },
  
  async down(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      await db.query('DROP TABLE IF EXISTS notifications');
    } else {
      return new Promise((resolve, reject) => {
        db.run('DROP TABLE IF EXISTS notifications', (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
};
```

### Adding a Column

```typescript
export const migration: Migration = {
  version: '1.0.4',
  name: 'add-user-timezone',
  description: 'Add timezone column to users table',
  
  async up(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN timezone TEXT DEFAULT 'UTC'
      `);
    } else {
      return new Promise((resolve, reject) => {
        db.run(`
          ALTER TABLE users 
          ADD COLUMN timezone TEXT DEFAULT 'UTC'
        `, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  },
  
  async down(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      await db.query('ALTER TABLE users DROP COLUMN IF EXISTS timezone');
    } else {
      // SQLite doesn't support DROP COLUMN easily
      // This would require a more complex migration
      console.log('SQLite rollback not implemented for column removal');
    }
  }
};
```
