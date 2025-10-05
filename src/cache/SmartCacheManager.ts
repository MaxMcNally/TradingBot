import { CachedDataProvider, HistoricalDataPoint } from "./CachedDataProvider";
import { DataProvider } from "../dataProviders/baseProvider";
import { promisify } from "util";
import { cacheDb } from "./initCache";

export interface DateRange {
  start: string;
  end: string;
}

export interface CacheGap {
  start: string;
  end: string;
  type: 'before' | 'after' | 'middle';
}

export class SmartCacheManager {
  private cachedProvider: CachedDataProvider;
  private wrappedProvider: DataProvider;

  constructor(wrappedProvider: DataProvider, providerName: string) {
    this.wrappedProvider = wrappedProvider;
    this.cachedProvider = new CachedDataProvider(wrappedProvider, providerName);
  }

  /**
   * Intelligently fetch historical data, minimizing API calls by:
   * 1. Checking existing cache entries
   * 2. Identifying gaps in cached data
   * 3. Fetching only the missing data
   * 4. Merging and storing the complete dataset
   */
  async getHistoricalSmart(symbol: string, interval: string, from: string, to: string): Promise<HistoricalDataPoint[]> {
    console.log(`Smart cache fetch for ${symbol} from ${from} to ${to}`);

    // Get all cached entries for this symbol and interval
    const cachedRanges = await this.getCachedRanges(symbol, interval);
    
    if (cachedRanges.length === 0) {
      // No cache, fetch everything
      console.log(`No cached data found for ${symbol}, fetching complete range`);
      return this.cachedProvider.getHistorical(symbol, interval, from, to);
    }

    // Find gaps in the requested range
    const gaps = this.findGapsInRange(cachedRanges, from, to);
    
    if (gaps.length === 0) {
      // All data is cached, return from cache
      console.log(`All data cached for ${symbol}, returning from cache`);
      return this.getDataFromCachedRanges(symbol, interval, cachedRanges, from, to);
    }

    console.log(`Found ${gaps.length} gaps in cache for ${symbol}`);
    
    // Fetch data for each gap
    const allData: HistoricalDataPoint[] = [];
    
    for (const gap of gaps) {
      console.log(`Fetching gap: ${gap.start} to ${gap.end}`);
      const gapData = await this.wrappedProvider.getHistorical(symbol, interval, gap.start, gap.end);
      
      if (gapData && gapData.length > 0) {
        // Store this gap data in cache
        await this.cachedProvider['storeInCache'](symbol, interval, gap.start, gap.end, gapData);
        allData.push(...gapData);
      }
    }

    // Get all cached data for the requested range
    const cachedData = await this.getDataFromCachedRanges(symbol, interval, cachedRanges, from, to);
    
    // Merge and sort all data
    const mergedData = [...cachedData, ...allData].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    // Remove duplicates (in case of overlapping ranges)
    const uniqueData = this.removeDuplicateDates(mergedData);

    console.log(`Smart fetch complete: ${uniqueData.length} total data points for ${symbol}`);
    return uniqueData;
  }

  private async getCachedRanges(symbol: string, interval: string): Promise<DateRange[]> {
    const db = cacheDb.getDatabase();
    const all = promisify(db.all.bind(db));

    const query = `
      SELECT start_date, end_date 
      FROM historical_data_cache 
      WHERE symbol = ? AND provider = ? AND interval = ?
      ORDER BY start_date
    `;

    try {
      const results = await all(query, [symbol, this.cachedProvider['providerName'], interval]) as any[];
      return results.map(row => ({
        start: row.start_date,
        end: row.end_date
      }));
    } catch (error) {
      console.error("Error getting cached ranges:", error);
      return [];
    }
  }

  private findGapsInRange(cachedRanges: DateRange[], from: string, to: string): CacheGap[] {
    const gaps: CacheGap[] = [];
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Sort cached ranges by start date
    const sortedRanges = [...cachedRanges].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    let currentDate = fromDate;

    for (const range of sortedRanges) {
      const rangeStart = new Date(range.start);
      const rangeEnd = new Date(range.end);

      // Check for gap before this range
      if (currentDate < rangeStart) {
        gaps.push({
          start: currentDate.toISOString().split('T')[0],
          end: new Date(rangeStart.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'before'
        });
      }

      // Update current date to after this range
      currentDate = new Date(Math.max(currentDate.getTime(), rangeEnd.getTime() + 24 * 60 * 60 * 1000));
    }

    // Check for gap after all ranges
    if (currentDate <= toDate) {
      gaps.push({
        start: currentDate.toISOString().split('T')[0],
        end: to.toISOString().split('T')[0],
        type: 'after'
      });
    }

    return gaps;
  }

  private async getDataFromCachedRanges(symbol: string, interval: string, cachedRanges: DateRange[], from: string, to: string): Promise<HistoricalDataPoint[]> {
    const allData: HistoricalDataPoint[] = [];
    const fromDate = new Date(from);
    const toDate = new Date(to);

    for (const range of cachedRanges) {
      const rangeStart = new Date(range.start);
      const rangeEnd = new Date(range.end);

      // Check if this cached range overlaps with our requested range
      if (rangeEnd >= fromDate && rangeStart <= toDate) {
        const cachedData = await this.cachedProvider['getFromCache'](symbol, interval, range.start, range.end);
        if (cachedData) {
          // Filter data to only include points within our requested range
          const filteredData = cachedData.filter(point => {
            const pointDate = new Date(point.date);
            return pointDate >= fromDate && pointDate <= toDate;
          });
          allData.push(...filteredData);
        }
      }
    }

    return allData;
  }

  private removeDuplicateDates(data: HistoricalDataPoint[]): HistoricalDataPoint[] {
    const seen = new Set<string>();
    return data.filter(point => {
      const dateKey = new Date(point.date).toISOString().split('T')[0];
      if (seen.has(dateKey)) {
        return false;
      }
      seen.add(dateKey);
      return true;
    });
  }

  /**
   * Pre-populate cache for a symbol with data from a large date range
   * This is useful for backtesting scenarios where you know you'll need a lot of data
   */
  async prePopulateCache(symbol: string, interval: string, from: string, to: string, chunkSizeDays: number = 365): Promise<void> {
    console.log(`Pre-populating cache for ${symbol} from ${from} to ${to}`);
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const chunkSizeMs = chunkSizeDays * 24 * 60 * 60 * 1000;

    let currentStart = fromDate;
    let chunkIndex = 0;

    while (currentStart < toDate) {
      const currentEnd = new Date(Math.min(currentStart.getTime() + chunkSizeMs, toDate.getTime()));
      
      console.log(`Pre-populating chunk ${++chunkIndex}: ${currentStart.toISOString().split('T')[0]} to ${currentEnd.toISOString().split('T')[0]}`);
      
      try {
        await this.cachedProvider.getHistorical(
          symbol, 
          interval, 
          currentStart.toISOString().split('T')[0], 
          currentEnd.toISOString().split('T')[0]
        );
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error pre-populating chunk ${chunkIndex}:`, error);
      }

      currentStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    console.log(`Pre-population complete for ${symbol}`);
  }

  /**
   * Get cache statistics and recommendations
   */
  async getCacheAnalysis(symbol?: string): Promise<any> {
    const stats = await this.cachedProvider.getCacheStats();
    
    if (symbol) {
      const cachedRanges = await this.getCachedRanges(symbol, '1d');
      return {
        symbol,
        cachedRanges,
        totalRanges: cachedRanges.length,
        coverage: this.calculateCoverage(cachedRanges)
      };
    }

    return stats;
  }

  private calculateCoverage(ranges: DateRange[]): { start: string; end: string; totalDays: number } | null {
    if (ranges.length === 0) return null;

    const sortedRanges = [...ranges].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const start = sortedRanges[0].start;
    const end = sortedRanges[sortedRanges.length - 1].end;
    const totalDays = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

    return { start, end, totalDays };
  }
}
