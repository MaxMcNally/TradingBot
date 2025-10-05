import { cacheDb } from "./initCache";
import { promisify } from "util";

export class CacheManager {
  private db: any;

  constructor() {
    this.db = cacheDb.getDatabase();
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStats(): Promise<any> {
    const get = promisify(this.db.get.bind(this.db));
    const all = promisify(this.db.all.bind(this.db));

    try {
      // Overall statistics
      const totalEntries = await get("SELECT COUNT(*) as count FROM historical_data_cache") as any;
      const totalSize = await get("SELECT SUM(data_size) as size FROM historical_data_cache") as any;
      const oldestEntry = await get("SELECT MIN(created_at) as oldest FROM historical_data_cache") as any;
      const newestEntry = await get("SELECT MAX(created_at) as newest FROM historical_data_cache") as any;

      // Provider statistics
      const providerStats = await all(`
        SELECT 
          provider,
          COUNT(*) as entries,
          SUM(data_size) as total_size,
          AVG(data_size) as avg_size,
          AVG(access_count) as avg_access,
          MIN(created_at) as first_cached,
          MAX(last_accessed) as last_accessed
        FROM historical_data_cache 
        GROUP BY provider
        ORDER BY total_size DESC
      `);

      // Symbol statistics
      const symbolStats = await all(`
        SELECT 
          symbol,
          COUNT(*) as entries,
          SUM(data_size) as total_size,
          AVG(access_count) as avg_access,
          MIN(start_date) as earliest_date,
          MAX(end_date) as latest_date
        FROM historical_data_cache 
        GROUP BY symbol
        ORDER BY total_size DESC
        LIMIT 20
      `);

      // Cache hit/miss tracking (if implemented)
      const hitMissStats = await get(`
        SELECT 
          SUM(total_requests) as total_requests,
          SUM(cache_hits) as total_hits,
          SUM(cache_misses) as total_misses
        FROM cache_metadata
      `) as any;

      return {
        overview: {
          totalEntries: totalEntries.count,
          totalSizeBytes: totalSize.size || 0,
          totalSizeMB: Math.round((totalSize.size || 0) / (1024 * 1024) * 100) / 100,
          oldestEntry: oldestEntry.oldest,
          newestEntry: newestEntry.newest,
          hitRate: hitMissStats ? 
            (hitMissStats.total_hits / (hitMissStats.total_requests || 1) * 100).toFixed(2) + '%' : 
            'N/A'
        },
        providerStats: providerStats.map((stat: any) => ({
          ...stat,
          totalSizeMB: Math.round(stat.total_size / (1024 * 1024) * 100) / 100,
          avgSizeKB: Math.round(stat.avg_size / 1024 * 100) / 100
        })),
        topSymbols: symbolStats.map((stat: any) => ({
          ...stat,
          totalSizeMB: Math.round(stat.total_size / (1024 * 1024) * 100) / 100
        }))
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return null;
    }
  }

  /**
   * Clean up old and unused cache entries
   */
  async cleanup(options: {
    daysOld?: number;
    maxSizeMB?: number;
    minAccessCount?: number;
    dryRun?: boolean;
  } = {}): Promise<any> {
    const {
      daysOld = 30,
      maxSizeMB = 1000,
      minAccessCount = 1,
      dryRun = false
    } = options;

    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    try {
      let totalRemoved = 0;
      let totalSizeFreed = 0;

      // Remove old entries
      const oldEntriesQuery = `
        DELETE FROM historical_data_cache 
        WHERE last_accessed < datetime('now', '-${daysOld} days')
      `;
      
      if (!dryRun) {
        const oldResult = await run(oldEntriesQuery) as any;
        totalRemoved += oldResult.changes;
      } else {
        const oldCount = await get(`
          SELECT COUNT(*) as count, SUM(data_size) as size 
          FROM historical_data_cache 
          WHERE last_accessed < datetime('now', '-${daysOld} days')
        `) as any;
        totalRemoved += oldCount.count;
        totalSizeFreed += oldCount.size || 0;
      }

      // Remove low-access entries if cache is too large
      const currentSize = await get("SELECT SUM(data_size) as size FROM historical_data_cache") as any;
      const currentSizeMB = (currentSize.size || 0) / (1024 * 1024);

      if (currentSizeMB > maxSizeMB) {
        const lowAccessQuery = `
          DELETE FROM historical_data_cache 
          WHERE access_count <= ${minAccessCount}
          ORDER BY last_accessed ASC
        `;

        if (!dryRun) {
          const lowAccessResult = await run(lowAccessQuery) as any;
          totalRemoved += lowAccessResult.changes;
        } else {
          const lowAccessCount = await get(`
            SELECT COUNT(*) as count, SUM(data_size) as size 
            FROM historical_data_cache 
            WHERE access_count <= ${minAccessCount}
          `) as any;
          totalRemoved += lowAccessCount.count;
          totalSizeFreed += lowAccessCount.size || 0;
        }
      }

      const result = {
        entriesRemoved: totalRemoved,
        sizeFreedMB: Math.round(totalSizeFreed / (1024 * 1024) * 100) / 100,
        dryRun
      };

      if (!dryRun) {
        console.log(`Cache cleanup complete: removed ${totalRemoved} entries, freed ${result.sizeFreedMB} MB`);
      } else {
        console.log(`Cache cleanup preview: would remove ${totalRemoved} entries, free ${result.sizeFreedMB} MB`);
      }

      return result;
    } catch (error) {
      console.error("Error during cache cleanup:", error);
      throw error;
    }
  }

  /**
   * Export cache data to JSON files (useful for backup or analysis)
   */
  async exportCache(exportPath: string, symbol?: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    const all = promisify(this.db.all.bind(this.db));

    try {
      let query = `
        SELECT symbol, provider, interval, start_date, end_date, data_json, created_at, access_count
        FROM historical_data_cache
      `;
      const params: string[] = [];

      if (symbol) {
        query += " WHERE symbol = ?";
        params.push(symbol);
      }

      query += " ORDER BY symbol, start_date";

      const entries = await all(query, params);
      
      // Group by symbol for easier organization
      const groupedData: any = {};
      
      for (const entry of entries) {
        if (!groupedData[entry.symbol]) {
          groupedData[entry.symbol] = [];
        }
        
        groupedData[entry.symbol].push({
          provider: entry.provider,
          interval: entry.interval,
          startDate: entry.start_date,
          endDate: entry.end_date,
          data: JSON.parse(entry.data_json),
          cachedAt: entry.created_at,
          accessCount: entry.access_count
        });
      }

      // Write to file
      const outputPath = path.resolve(exportPath);
      fs.writeFileSync(outputPath, JSON.stringify(groupedData, null, 2));
      
      console.log(`Cache exported to ${outputPath}`);
      console.log(`Exported ${entries.length} cache entries for ${Object.keys(groupedData).length} symbols`);
    } catch (error) {
      console.error("Error exporting cache:", error);
      throw error;
    }
  }

  /**
   * Import cache data from JSON files
   */
  async importCache(importPath: string, overwrite: boolean = false): Promise<void> {
    const fs = require('fs');
    const run = promisify(this.db.run.bind(this.db));

    try {
      const data = JSON.parse(fs.readFileSync(importPath, 'utf8'));
      let importedCount = 0;

      for (const [symbol, entries] of Object.entries(data as any)) {
        for (const entry of entries as any[]) {
          const dataJson = JSON.stringify(entry.data);
          const dataSize = Buffer.byteLength(dataJson, 'utf8');

          const query = overwrite ? `
            INSERT OR REPLACE INTO historical_data_cache 
            (symbol, provider, interval, start_date, end_date, data_json, data_size, created_at, last_accessed, access_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
          ` : `
            INSERT OR IGNORE INTO historical_data_cache 
            (symbol, provider, interval, start_date, end_date, data_json, data_size, created_at, last_accessed, access_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
          `;

          await run(query, [
            symbol,
            entry.provider,
            entry.interval,
            entry.startDate,
            entry.endDate,
            dataJson,
            dataSize,
            entry.cachedAt,
            entry.accessCount
          ]);

          importedCount++;
        }
      }

      console.log(`Imported ${importedCount} cache entries from ${importPath}`);
    } catch (error) {
      console.error("Error importing cache:", error);
      throw error;
    }
  }

  /**
   * Get cache configuration
   */
  async getConfig(): Promise<any> {
    const all = promisify(this.db.all.bind(this.db));

    try {
      const configs = await all("SELECT key, value, description FROM cache_config");
      const config: any = {};
      
      for (const row of configs as any[]) {
        config[row.key] = {
          value: row.value,
          description: row.description
        };
      }

      return config;
    } catch (error) {
      console.error("Error getting cache config:", error);
      return {};
    }
  }

  /**
   * Update cache configuration
   */
  async updateConfig(key: string, value: string, description?: string): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    try {
      await run(`
        INSERT OR REPLACE INTO cache_config (key, value, description, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [key, value, description]);

      console.log(`Updated cache config: ${key} = ${value}`);
    } catch (error) {
      console.error("Error updating cache config:", error);
      throw error;
    }
  }
}
