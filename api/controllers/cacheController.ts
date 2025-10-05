import { Request, Response } from "express";
import { CacheManager } from "../../src/cache/CacheManager";
import { SmartCacheManager } from "../../src/cache/SmartCacheManager";
import { YahooDataProvider } from "../../src/dataProviders/yahooProvider";

const cacheManager = new CacheManager();
const yahooProvider = new YahooDataProvider();
const smartCache = new SmartCacheManager(yahooProvider, "yahoo");

export interface CacheStatsResponse {
  success: boolean;
  data?: {
    overview: {
      totalEntries: number;
      totalSizeMB: number;
      hitRate: string;
      oldestEntry: string;
      newestEntry: string;
    };
    providerStats: Array<{
      provider: string;
      entries: number;
      totalSizeMB: number;
      avgAccess: number;
    }>;
    topSymbols: Array<{
      symbol: string;
      entries: number;
      totalSizeMB: number;
      earliestDate: string;
      latestDate: string;
    }>;
  };
  error?: string;
}

export interface CacheCleanupRequest {
  daysOld?: number;
  maxSizeMB?: number;
  minAccessCount?: number;
  dryRun?: boolean;
}

export interface CacheCleanupResponse {
  success: boolean;
  data?: {
    entriesRemoved: number;
    sizeFreedMB: number;
    dryRun: boolean;
  };
  error?: string;
}

export interface CacheAnalysisResponse {
  success: boolean;
  data?: {
    symbol: string;
    totalRanges: number;
    cachedRanges: Array<{
      start: string;
      end: string;
    }>;
    coverage?: {
      start: string;
      end: string;
      totalDays: number;
    };
  };
  error?: string;
}

/**
 * GET /api/cache/stats
 * Get comprehensive cache statistics
 */
export const getCacheStats = async (req: Request, res: Response) => {
  try {
    const stats = await cacheManager.getStats();
    
    if (!stats) {
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve cache statistics"
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while retrieving cache statistics"
    });
  }
};

/**
 * POST /api/cache/cleanup
 * Clean up old cache entries
 */
export const cleanupCache = async (req: Request, res: Response) => {
  try {
    const {
      daysOld = 30,
      maxSizeMB = 1000,
      minAccessCount = 1,
      dryRun = false
    }: CacheCleanupRequest = req.body;

    const result = await cacheManager.cleanup({
      daysOld,
      maxSizeMB,
      minAccessCount,
      dryRun
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error cleaning up cache:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during cache cleanup"
    });
  }
};

/**
 * GET /api/cache/analyze/:symbol
 * Analyze cache for a specific symbol
 */
export const analyzeSymbolCache = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: "Symbol parameter is required"
      });
    }

    const analysis = await smartCache.getCacheAnalysis(symbol);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error("Error analyzing symbol cache:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while analyzing symbol cache"
    });
  }
};

/**
 * POST /api/cache/prepopulate
 * Pre-populate cache for a symbol
 */
export const prepopulateCache = async (req: Request, res: Response) => {
  try {
    const { symbol, from, to, interval = "1d", chunkSize = 365 } = req.body;

    if (!symbol || !from || !to) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: symbol, from, to"
      });
    }

    console.log(`Pre-populating cache for ${symbol} from ${from} to ${to}`);
    
    await smartCache.prePopulateCache(symbol, interval, from, to, chunkSize);
    
    // Get analysis after pre-population
    const analysis = await smartCache.getCacheAnalysis(symbol);

    res.json({
      success: true,
      data: {
        symbol,
        from,
        to,
        interval,
        chunkSize,
        analysis
      }
    });
  } catch (error) {
    console.error("Error pre-populating cache:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during cache pre-population"
    });
  }
};

/**
 * GET /api/cache/config
 * Get cache configuration
 */
export const getCacheConfig = async (req: Request, res: Response) => {
  try {
    const config = await cacheManager.getConfig();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error("Error getting cache config:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while retrieving cache configuration"
    });
  }
};

/**
 * PUT /api/cache/config
 * Update cache configuration
 */
export const updateCacheConfig = async (req: Request, res: Response) => {
  try {
    const { key, value, description } = req.body;

    if (!key || !value) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: key, value"
      });
    }

    await cacheManager.updateConfig(key, value, description);

    res.json({
      success: true,
      data: {
        key,
        value,
        description,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error updating cache config:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while updating cache configuration"
    });
  }
};

/**
 * DELETE /api/cache/clear
 * Clear cache (with optional filters)
 */
export const clearCache = async (req: Request, res: Response) => {
  try {
    const { symbol, provider } = req.query;

    await cacheManager.clearCache(
      symbol as string | undefined,
      provider as string | undefined
    );

    res.json({
      success: true,
      data: {
        cleared: true,
        symbol: symbol || null,
        provider: provider || null,
        clearedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while clearing cache"
    });
  }
};
