# Trading Bot Cache Layer

A comprehensive caching system designed to minimize API calls to data providers while maintaining data freshness and performance.

## Features

- **Smart Caching**: Intelligently fills gaps in cached data to minimize API calls
- **TTL Support**: Configurable time-to-live for cached data
- **Multiple Providers**: Works with Yahoo Finance, Polygon, and other data providers
- **Cache Management**: CLI tools for monitoring, cleanup, and maintenance
- **Export/Import**: Backup and restore cache data
- **Performance Monitoring**: Detailed statistics and hit/miss tracking

## Architecture

### Core Components

1. **CachedDataProvider**: Wraps existing data providers with caching functionality
2. **SmartCacheManager**: Intelligent cache filling that minimizes API calls
3. **CacheManager**: Administrative tools for cache maintenance
4. **Cache Database**: SQLite-based storage with metadata tracking

### Database Schema

The cache uses SQLite with the following key tables:
- `historical_data_cache`: Stores cached historical data with metadata
- `cache_metadata`: Tracks cache performance statistics
- `cache_config`: Configuration settings

## Usage

### Basic Usage

```typescript
import { YahooDataProvider } from "../dataProviders/yahooProvider";
import { SmartCacheManager } from "./cache/SmartCacheManager";

const yahooProvider = new YahooDataProvider();
const smartCache = new SmartCacheManager(yahooProvider, "yahoo");

// This will use cache when available, fetch only missing data
const data = await smartCache.getHistoricalSmart("AAPL", "1d", "2023-01-01", "2023-12-31");
```

### Backtesting with Cache

```bash
# Run backtest with caching (default)
npm run backtest -- --symbol AAPL --start 2023-01-01 --end 2023-12-31

# Pre-populate cache before backtesting
npm run backtest -- --symbol AAPL --start 2023-01-01 --end 2023-12-31 --prepopulate

# Disable caching for this run
npm run backtest -- --symbol AAPL --start 2023-01-01 --end 2023-12-31 --no-cache

# Show cache statistics after backtest
npm run backtest -- --symbol AAPL --start 2023-01-01 --end 2023-12-31 --cache-stats
```

### Cache Management CLI

```bash
# Show cache statistics
npx ts-node src/cache/cacheCLI.ts stats

# Clean up old entries
npx ts-node src/cache/cacheCLI.ts cleanup --days 30 --maxSize 1000

# Pre-populate cache for a symbol
npx ts-node src/cache/cacheCLI.ts prepopulate --symbol AAPL --from 2020-01-01 --to 2023-12-31

# Analyze cache for a specific symbol
npx ts-node src/cache/cacheCLI.ts analyze --symbol AAPL

# Export cache to JSON
npx ts-node src/cache/cacheCLI.ts export --path ./cache_backup.json

# Import cache from JSON
npx ts-node src/cache/cacheCLI.ts import --path ./cache_backup.json

# Manage cache configuration
npx ts-node src/cache/cacheCLI.ts config --get
npx ts-node src/cache/cacheCLI.ts config --set default_ttl_hours=48
```

## Configuration

### Cache Settings

- `default_ttl_hours`: Default time-to-live for cached data (default: 24 hours)
- `max_cache_size_mb`: Maximum cache size in megabytes (default: 1000 MB)
- `cleanup_threshold_days`: Days after which unused entries are cleaned up (default: 30 days)
- `enable_cache`: Global cache enable/disable flag (default: true)

### Smart Cache Behavior

The SmartCacheManager implements several optimizations:

1. **Gap Detection**: Identifies missing date ranges in cached data
2. **Minimal Fetching**: Only fetches data for gaps, not entire ranges
3. **Data Merging**: Combines cached and fresh data seamlessly
4. **Duplicate Removal**: Handles overlapping date ranges intelligently

## Performance Benefits

### Before Caching
- Every backtest requires full API calls
- Repeated requests for same data
- Rate limiting issues with providers
- Slow backtesting for large date ranges

### After Caching
- First request populates cache
- Subsequent requests use cached data
- Only missing data is fetched
- Significant reduction in API calls
- Faster backtesting iterations

## Monitoring

### Cache Statistics

The system tracks:
- Total cache entries and size
- Hit/miss ratios
- Provider-specific statistics
- Symbol-specific coverage
- Access patterns

### Example Output

```
=== Cache Statistics ===
Total Entries: 1,247
Total Size: 45.2 MB
Hit Rate: 87.3%
Oldest Entry: 2023-01-15 10:30:00
Newest Entry: 2023-12-15 16:45:00

=== Provider Statistics ===
yahoo: 1,247 entries, 45.2 MB, avg 3.2 accesses

=== Top Symbols ===
AAPL: 15 entries, 2.1 MB (2023-01-01 to 2023-12-31)
GOOGL: 12 entries, 1.8 MB (2023-01-01 to 2023-12-31)
```

## Maintenance

### Regular Cleanup

```bash
# Clean up entries older than 30 days
npx ts-node src/cache/cacheCLI.ts cleanup --days 30

# Dry run to see what would be removed
npx ts-node src/cache/cacheCLI.ts cleanup --days 30 --dryRun
```

### Backup and Restore

```bash
# Export all cache data
npx ts-node src/cache/cacheCLI.ts export --path ./cache_backup.json

# Export specific symbol
npx ts-node src/cache/cacheCLI.ts export --path ./aapl_cache.json --symbol AAPL

# Import cache data
npx ts-node src/cache/cacheCLI.ts import --path ./cache_backup.json
```

## Integration

### With Existing Code

The cache layer is designed to be a drop-in replacement:

```typescript
// Before
const dataProvider = new YahooDataProvider();
const data = await dataProvider.getHistorical(symbol, interval, from, to);

// After
const yahooProvider = new YahooDataProvider();
const smartCache = new SmartCacheManager(yahooProvider, "yahoo");
const data = await smartCache.getHistoricalSmart(symbol, interval, from, to);
```

### With Multiple Providers

```typescript
import { PolygonProvider } from "../dataProviders/PolygonProvider";
import { YahooDataProvider } from "../dataProviders/yahooProvider";

const polygonProvider = new PolygonProvider(apiKey);
const yahooProvider = new YahooDataProvider();

const polygonCache = new SmartCacheManager(polygonProvider, "polygon");
const yahooCache = new SmartCacheManager(yahooProvider, "yahoo");

// Use different providers for different data needs
const realtimeData = await polygonCache.getHistoricalSmart(symbol, "1m", from, to);
const historicalData = await yahooCache.getHistoricalSmart(symbol, "1d", from, to);
```

## Troubleshooting

### Common Issues

1. **Cache not working**: Check if `enable_cache` is set to `true` in configuration
2. **Stale data**: Verify TTL settings and run cleanup if needed
3. **Large cache size**: Use cleanup command with size limits
4. **Database errors**: Check database file permissions and disk space

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=cache:* npm run backtest -- --symbol AAPL --start 2023-01-01 --end 2023-12-31
```

## Future Enhancements

- Redis backend for distributed caching
- Compression for large datasets
- Real-time cache invalidation
- Machine learning for cache optimization
- WebSocket integration for live data
