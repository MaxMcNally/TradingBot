import { DataProvider, NewsArticle } from "../dataProviders/baseProvider";
import { cacheDb } from "./initCache";

export interface NewsCacheConfig {
  ttlHours?: number;
  enableCache?: boolean;
}

export class CachedNewsProvider extends DataProvider {
  private wrappedProvider: DataProvider;
  private providerName: string;
  private config: NewsCacheConfig;

  constructor(wrappedProvider: DataProvider, providerName: string, config: NewsCacheConfig = {}) {
    super();
    this.wrappedProvider = wrappedProvider;
    this.providerName = providerName;
    this.config = {
      ttlHours: 6,
      enableCache: true,
      ...config,
    };
  }

  async getNews(symbol: string, options: { startDate?: string; endDate?: string; limit?: number } = {}): Promise<NewsArticle[]> {
    if (!this.config.enableCache) {
      return this.wrappedProvider.getNews(symbol, options);
    }

    const { startDate = '', endDate = '', limit = -1 } = options;

    const cached = await this.getFromCache(symbol, startDate, endDate, limit);
    if (cached) {
      await this.updateCacheAccess(symbol, startDate, endDate, limit);
      return cached;
    }

    const fresh = await this.wrappedProvider.getNews(symbol, options);
    if (fresh && fresh.length) {
      await this.storeInCache(symbol, startDate, endDate, limit, fresh);
    }
    return fresh;
  }

  private getFromCache(symbol: string, startDate: string, endDate: string, limit: number): Promise<NewsArticle[] | null> {
    const db = cacheDb.getDatabase();
    const query = `
      SELECT data_json, created_at
      FROM news_cache
      WHERE symbol = ? AND provider = ? AND IFNULL(start_date, '') = ? AND IFNULL(end_date, '') = ? AND IFNULL(limit, -1) = ?
    `;

    return new Promise((resolve) => {
      db.get(query, [symbol, this.providerName, startDate || '', endDate || '', limit ?? -1], (err: any, row: any) => {
        if (err || !row) return resolve(null);

        const createdAt = new Date(row.created_at);
        const hours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hours > (this.config.ttlHours || 6)) {
          this.removeFromCache(symbol, startDate, endDate, limit).finally(() => resolve(null));
          return;
        }

        try {
          resolve(JSON.parse(row.data_json));
        } catch {
          resolve(null);
        }
      });
    });
  }

  private storeInCache(symbol: string, startDate: string, endDate: string, limit: number, data: NewsArticle[]): Promise<void> {
    const db = cacheDb.getDatabase();
    const json = JSON.stringify(data);
    const size = Buffer.byteLength(json, 'utf8');

    const query = `
      INSERT OR REPLACE INTO news_cache
      (symbol, provider, start_date, end_date, limit, data_json, data_size, created_at, last_accessed, access_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
    `;

    return new Promise((resolve) => {
      db.run(query, [symbol, this.providerName, startDate || null, endDate || null, limit ?? null, json, size], () => resolve());
    });
  }

  private updateCacheAccess(symbol: string, startDate: string, endDate: string, limit: number): Promise<void> {
    const db = cacheDb.getDatabase();
    const query = `
      UPDATE news_cache SET last_accessed = CURRENT_TIMESTAMP, access_count = access_count + 1
      WHERE symbol = ? AND provider = ? AND IFNULL(start_date, '') = ? AND IFNULL(end_date, '') = ? AND IFNULL(limit, -1) = ?
    `;

    return new Promise((resolve) => {
      db.run(query, [symbol, this.providerName, startDate || '', endDate || '', limit ?? -1], () => resolve());
    });
  }

  private removeFromCache(symbol: string, startDate: string, endDate: string, limit: number): Promise<void> {
    const db = cacheDb.getDatabase();
    const query = `
      DELETE FROM news_cache
      WHERE symbol = ? AND provider = ? AND IFNULL(start_date, '') = ? AND IFNULL(end_date, '') = ? AND IFNULL(limit, -1) = ?
    `;

    return new Promise((resolve) => {
      db.run(query, [symbol, this.providerName, startDate || '', endDate || '', limit ?? -1], () => resolve());
    });
  }
}
