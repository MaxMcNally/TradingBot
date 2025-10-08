#!/usr/bin/env node

import { MigrationSystem } from './migration-system';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function loadMigrations(): Promise<MigrationSystem> {
  const migrationSystem = new MigrationSystem();
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found, creating...');
    fs.mkdirSync(migrationsDir, { recursive: true });
    return migrationSystem;
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'))
    .sort();
  
  console.log(`📁 Found ${migrationFiles.length} migration files`);
  
  for (const file of migrationFiles) {
    try {
      const migrationPath = path.join(migrationsDir, file);
      console.log(`📄 Loading migration: ${file}`);
      
      // Clear require cache to ensure fresh imports
      delete require.cache[require.resolve(migrationPath)];
      
      const migrationModule = require(migrationPath);
      const migration = migrationModule.migration;
      
      if (!migration || !migration.version || !migration.name) {
        console.warn(`⚠️  Invalid migration file: ${file}`);
        continue;
      }
      
      migrationSystem.registerMigration(migration);
      console.log(`✅ Loaded migration ${migration.version}: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Failed to load migration ${file}:`, error);
      throw error;
    }
  }
  
  return migrationSystem;
}

async function main() {
  const command = process.argv[2];
  const version = process.argv[3];
  const environment = process.env.NODE_ENV || 'development';
  
  console.log(`🚀 Migration Runner - Environment: ${environment}`);
  console.log(`📊 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
  
  try {
    const migrationSystem = await loadMigrations();
    
    switch (command) {
      case 'migrate':
        console.log('🔄 Running migrations...');
        await migrationSystem.migrate();
        break;
        
      case 'rollback':
        if (!version) {
          console.error('❌ Version required for rollback');
          console.log('Usage: yarn migrate:rollback <version>');
          process.exit(1);
        }
        console.log(`🔄 Rolling back to version ${version}...`);
        await migrationSystem.rollbackTo(version);
        break;
        
      case 'status':
        console.log('📊 Checking migration status...');
        const status = await migrationSystem.getStatus();
        console.log('\n📋 Migration Status:');
        console.log(`   Current Version: ${status.currentVersion}`);
        console.log(`   Applied Migrations: ${status.appliedMigrations.length}`);
        console.log(`   Pending Migrations: ${status.pendingMigrations.length}`);
        console.log(`   Total Migrations: ${status.totalMigrations}`);
        
        if (status.appliedMigrations.length > 0) {
          console.log('\n✅ Applied Migrations:');
          status.appliedMigrations.forEach((version: string) => {
            console.log(`   - ${version}`);
          });
        }
        
        if (status.pendingMigrations.length > 0) {
          console.log('\n⏳ Pending Migrations:');
          status.pendingMigrations.forEach((version: string) => {
            console.log(`   - ${version}`);
          });
        }
        break;
        
      case 'create':
        if (!version) {
          console.error('❌ Version required for creating migration');
          console.log('Usage: yarn migrate:create <version> <name>');
          process.exit(1);
        }
        const name = process.argv[4];
        if (!name) {
          console.error('❌ Name required for creating migration');
          console.log('Usage: yarn migrate:create <version> <name>');
          process.exit(1);
        }
        await createMigration(version, name);
        break;
        
      default:
        console.log('📖 Migration Commands:');
        console.log('   yarn migrate:run          - Run all pending migrations');
        console.log('   yarn migrate:rollback     - Rollback to specific version');
        console.log('   yarn migrate:status       - Show migration status');
        console.log('   yarn migrate:create       - Create new migration file');
        console.log('');
        console.log('Examples:');
        console.log('   yarn migrate:run');
        console.log('   yarn migrate:rollback 1.0.1');
        console.log('   yarn migrate:status');
        console.log('   yarn migrate:create 1.0.3 add-new-feature');
        break;
    }
    
    await migrationSystem.close();
    console.log('✅ Migration process completed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function createMigration(version: string, name: string): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${timestamp}-${version}-${name}.ts`;
  const filepath = path.join(migrationsDir, filename);
  
  const template = `import { Migration } from '../migration-system';

export const migration: Migration = {
  version: '${version}',
  name: '${name}',
  description: '${name.replace(/-/g, ' ')}',
  
  async up(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      // PostgreSQL migration code here
      await db.query(\`
        -- Add your PostgreSQL migration SQL here
        SELECT 1;
      \`);
    } else {
      // SQLite migration code here
      return new Promise((resolve, reject) => {
        db.run(\`
          -- Add your SQLite migration SQL here
          SELECT 1;
        \`, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  },
  
  async down(db: any) {
    const isPostgres = process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL);
    
    if (isPostgres) {
      // PostgreSQL rollback code here
      await db.query(\`
        -- Add your PostgreSQL rollback SQL here
        SELECT 1;
      \`);
    } else {
      // SQLite rollback code here
      return new Promise((resolve, reject) => {
        db.run(\`
          -- Add your SQLite rollback SQL here
          SELECT 1;
        \`, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
};
`;
  
  fs.writeFileSync(filepath, template);
  console.log(`✅ Created migration file: ${filename}`);
  console.log(`📁 Location: ${filepath}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
