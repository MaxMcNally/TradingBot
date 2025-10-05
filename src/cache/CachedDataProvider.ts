import { DataProvider } from "../dataProviders/baseProvider";
import { cacheDb } from "./initCache";
import { promisify } from "util";

export interface CacheConfig {
  ttlHours?: number;
  enableCache?: boolean;
  maxCacheSize?: number;
}

export interface HistoricalDataPoint {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CacheEntry {
  symbol: string;
  provider: string;
  interval: string;
  startDate: string;
  endDate: string;
  data: HistoricalDataPoint[];
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
}

export class CachedDataProvider extends DataProvider {
  private wrappedProvider: DataProvider;
  private providerName: string;
  private config: CacheConfig;

  constructor(wrappedProvider: DataProvider, providerName: string, config: CacheConfig = {}) {
    super();
    this.wrappedProvider = wrappedProvider;
    this.providerName = providerName;
    this.config = {
      ttlHours: 24,
      enableCache: true,
      maxCacheSize: 1000, // MB
      ...config
    };
  }

  async getQuote(symbol: string) {
    // Quotes are typically real-time, so we don't cache them
    return this.wrappedProvider.getQuote(symbol);
  }

  async getHistorical(symbol: string, interval: string = 'day', from: string, to: string): Promise<HistoricalDataPoint[]> {
    if (!this.config.enableCache) {
      return this.wrappedProvider.getHistorical(symbol, interval, from, to);
    }

    // Try to get from cache first
    const cachedData = await this.getFromCache(symbol, interval, from, to);
    if (cachedData) {
      console.log(`Cache HIT for ${symbol} (${from} to ${to})`);
      await this.updateCacheAccess(symbol, interval, from, to);
      return cachedData;
    }

    console.log(`Cache MISS for ${symbol} (${from} to ${to}) - fetching from provider`);
    
    // Fetch from provider
    const freshData = await this.wrappedProvider.getHistorical(symbol, interval, from, to);
    
    if (freshData && freshData.length > 0) {
      // Store in cache
      await this.storeInCache(symbol, interval, from, to, freshData);
    }

    return freshData;
  }

  connectStream(symbols: string[], onData: (data: any) => void) {
    return this.wrappedProvider.connectStream(symbols, onData);
  }

  private async getFromCache(symbol: string, interval: string, from: string, to: string): Promise<HistoricalDataPoint[] | null> {
    const db = cacheDb.getDatabase();
    const get = promisify(db.get.bind(db));

    const query = `
      SELECT data_json, created_at 
      FROM historical_data_cache 
      WHERE symbol = ? AND provider = ? AND interval = ? AND start_date = ? AND end_date = ?
    `;

    try {
      const result = await get(query, [symbol, this.providerName, interval, from, to]) as any;
      
      if (!result) {
        return null;
      }

      // Check if data is still fresh (within TTL)
      const createdAt = new Date(result.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > this.config.ttlHours!) {
        console.log(`Cache entry expired for ${symbol} (${hoursDiff.toFixed(1)} hours old)`);
        await this.removeFromCache(symbol, interval, from, to);
        return null;
      }

      return JSON.parse(result.data_json);
    } catch (error) {
      console.error("Error reading from cache:", error);
      return null;
    }
  }

  private async storeInCache(symbol: string, interval: string, from: string, to: string, data: HistoricalDataPoint[]): Promise<void> {
    const db = cacheDb.getDatabase();
    const run = promisify(db.run.bind(db));

    const dataJson = JSON.stringify(data);
    const dataSize = Buffer.byteLength(dataJson, 'utf8');

    const query = `
      INSERT OR REPLACE INTO historical_data_cache 
      (symbol, provider, interval, start_date, end_date, data_json, data_size, created_at, last_accessed, access_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
    `;

    try {
      await run(query, [symbol, this.providerName, interval, from, to, dataJson, dataSize]);
      console.log(`Cached ${data.length} data points for ${symbol} (${dataSize} bytes)`);
    } catch (error) {
      console.error("Error storing in cache:", error);
    }
  }

  private async updateCacheAccess(symbol: string, interval: string, from: string, to: string): Promise<void> {
    const db = cacheDb.getDatabase();
    const run = promisify(db.run.bind(db));

    const query = `
      UPDATE historical_data_cache 
      SET last_accessed = CURRENT_TIMESTAMP, access_count = access_count + 1
      WHERE symbol = ? AND provider = ? AND interval = ? AND start_date = ? AND end_date = ?
    `;

    try {
      await run(query, [symbol, this.providerName, interval, from, to]);
    } catch (error) {
      console.error("Error updating cache access:", error);
    }
  }

  private async removeFromCache(symbol: string, interval: string, from: string, to: string): Promise<void> {
    const db = cacheDb.getDatabase();
    const run = promisify(db.run.bind(db));

    const query = `
      DELETE FROM historical_data_cache 
      WHERE symbol = ? AND provider = ? AND interval = ? AND start_date = ? AND end_date = ?
    `;

    try {
      await run(query, [symbol, this.providerName, interval, from, to]);
    } catch (error) {
      console.error("Error removing from cache:", error);
    }
  }

  // Cache management methods
  async getCacheStats(): Promise<any> {
    const db = cacheDb.getDatabase();
    const get = promisify(db.get.bind(db));
    const all = promisify(db.all.bind(db));

    try {
      const totalEntries = await get("SELECT COUNT(*) as count FROM historical_data_cache") as any;
      const totalSize = await get("SELECT SUM(data_size) as size FROM historical_data_cache") as any;
      const providerStats = await all(`
        SELECT provider, COUNT(*) as entries, SUM(data_size) as size, AVG(access_count) as avg_access
        FROM historical_data_cache 
        GROUP BY provider
      `);

      return {
        totalEntries: totalEntries.count,
        totalSizeBytes: totalSize.size || 0,
        totalSizeMB: Math.round((totalSize.size || 0) / (1024 * 1024) * 100) / 100,
        providerStats
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return null;
    }
  }

  async clearCache(symbol?: string, provider?: string): Promise<void> {
    const db = cacheDb.getDatabase();
    const run = promisify(db.run.bind(db));

    let query = "DELETE FROM historical_data_cache";
    const params: string[] = [];
    const conditions: string[] = [];

    if (symbol) {
      conditions.push("symbol = ?");
      params.push(symbol);
    }

    if (provider) {
      conditions.push("provider = ?");
      params.push(provider);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    try {
      const result = await run(query, params) as any;
      console.log(`Cleared ${result.changes} cache entries`);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  async cleanupOldEntries(daysOld: number = 30): Promise<void> {
    const db = cacheDb.getDatabase();
    const run = promisify(db.run.bind(db));

    const query = `
      DELETE FROM historical_data_cache 
      WHERE last_accessed < datetime('now', '-${daysOld} days')
    `;

    try {
      const result = await run(query) as any;
      console.log(`Cleaned up ${result.changes} old cache entries`);
    } catch (error) {
      console.error("Error cleaning up old entries:", error);
    }
  }
}
