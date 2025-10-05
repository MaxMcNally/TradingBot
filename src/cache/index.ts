// Cache layer exports
export { CachedDataProvider, CacheConfig, HistoricalDataPoint, CacheEntry } from "./CachedDataProvider";
export { SmartCacheManager, DateRange, CacheGap } from "./SmartCacheManager";
export { CacheManager } from "./CacheManager";
export { CacheDatabase, cacheDb } from "./initCache";

// Re-export for convenience
export { YahooDataProvider } from "../dataProviders/yahooProvider";
export { PolygonProvider } from "../dataProviders/PolygonProvider";
