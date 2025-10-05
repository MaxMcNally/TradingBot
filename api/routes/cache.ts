import { Router } from "express";
import {
  getCacheStats,
  cleanupCache,
  analyzeSymbolCache,
  prepopulateCache,
  getCacheConfig,
  updateCacheConfig,
  clearCache
} from "../controllers/cacheController";

export const cacheRouter = Router();

/**
 * GET /api/cache/stats
 * 
 * Get comprehensive cache statistics including:
 * - Total entries and size
 * - Hit/miss ratios
 * - Provider-specific statistics
 * - Top symbols by cache size
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "overview": {
 *       "totalEntries": 1247,
 *       "totalSizeMB": 45.2,
 *       "hitRate": "87.3%",
 *       "oldestEntry": "2023-01-15 10:30:00",
 *       "newestEntry": "2023-12-15 16:45:00"
 *     },
 *     "providerStats": [
 *       {
 *         "provider": "yahoo",
 *         "entries": 1247,
 *         "totalSizeMB": 45.2,
 *         "avgAccess": 3.2
 *       }
 *     ],
 *     "topSymbols": [
 *       {
 *         "symbol": "AAPL",
 *         "entries": 15,
 *         "totalSizeMB": 2.1,
 *         "earliestDate": "2023-01-01",
 *         "latestDate": "2023-12-31"
 *       }
 *     ]
 *   }
 * }
 */
cacheRouter.get("/stats", getCacheStats);

/**
 * POST /api/cache/cleanup
 * 
 * Clean up old and unused cache entries
 * 
 * Request body:
 * {
 *   "daysOld": 30,           // optional, default: 30
 *   "maxSizeMB": 1000,       // optional, default: 1000
 *   "minAccessCount": 1,     // optional, default: 1
 *   "dryRun": false          // optional, default: false
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "entriesRemoved": 45,
 *     "sizeFreedMB": 12.3,
 *     "dryRun": false
 *   }
 * }
 */
cacheRouter.post("/cleanup", cleanupCache);

/**
 * GET /api/cache/analyze/:symbol
 * 
 * Analyze cache coverage for a specific symbol
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "symbol": "AAPL",
 *     "totalRanges": 3,
 *     "cachedRanges": [
 *       {
 *         "start": "2023-01-01",
 *         "end": "2023-04-30"
 *       },
 *       {
 *         "start": "2023-06-01",
 *         "end": "2023-08-31"
 *       }
 *     ],
 *     "coverage": {
 *       "start": "2023-01-01",
 *       "end": "2023-08-31",
 *       "totalDays": 243
 *     }
 *   }
 * }
 */
cacheRouter.get("/analyze/:symbol", analyzeSymbolCache);

/**
 * POST /api/cache/prepopulate
 * 
 * Pre-populate cache for a symbol with data from a date range
 * 
 * Request body:
 * {
 *   "symbol": "AAPL",
 *   "from": "2023-01-01",
 *   "to": "2023-12-31",
 *   "interval": "1d",        // optional, default: "1d"
 *   "chunkSize": 365         // optional, default: 365 (days per chunk)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "symbol": "AAPL",
 *     "from": "2023-01-01",
 *     "to": "2023-12-31",
 *     "interval": "1d",
 *     "chunkSize": 365,
 *     "analysis": {
 *       "symbol": "AAPL",
 *       "totalRanges": 4,
 *       "coverage": {
 *         "start": "2023-01-01",
 *         "end": "2023-12-31",
 *         "totalDays": 365
 *       }
 *     }
 *   }
 * }
 */
cacheRouter.post("/prepopulate", prepopulateCache);

/**
 * GET /api/cache/config
 * 
 * Get current cache configuration
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "default_ttl_hours": {
 *       "value": "24",
 *       "description": "Default time-to-live for cached data in hours"
 *     },
 *     "max_cache_size_mb": {
 *       "value": "1000",
 *       "description": "Maximum cache size in megabytes"
 *     }
 *   }
 * }
 */
cacheRouter.get("/config", getCacheConfig);

/**
 * PUT /api/cache/config
 * 
 * Update cache configuration
 * 
 * Request body:
 * {
 *   "key": "default_ttl_hours",
 *   "value": "48",
 *   "description": "Updated TTL to 48 hours"  // optional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "key": "default_ttl_hours",
 *     "value": "48",
 *     "description": "Updated TTL to 48 hours",
 *     "updatedAt": "2023-12-15T10:30:00.000Z"
 *   }
 * }
 */
cacheRouter.put("/config", updateCacheConfig);

/**
 * DELETE /api/cache/clear
 * 
 * Clear cache entries (with optional filters)
 * 
 * Query parameters:
 * - symbol: Clear only entries for specific symbol
 * - provider: Clear only entries for specific provider
 * 
 * Examples:
 * DELETE /api/cache/clear                    // Clear all cache
 * DELETE /api/cache/clear?symbol=AAPL        // Clear only AAPL cache
 * DELETE /api/cache/clear?provider=yahoo     // Clear only Yahoo cache
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "cleared": true,
 *     "symbol": "AAPL",
 *     "provider": null,
 *     "clearedAt": "2023-12-15T10:30:00.000Z"
 *   }
 * }
 */
cacheRouter.delete("/clear", clearCache);

/**
 * GET /api/cache/health
 * 
 * Health check for cache service
 */
cacheRouter.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Cache service is healthy",
    timestamp: new Date().toISOString()
  });
});
