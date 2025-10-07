-- Cache schema for historical market data
-- This table stores cached historical data with metadata for efficient retrieval

CREATE TABLE IF NOT EXISTS historical_data_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'yahoo', 'polygon', etc.
    interval TEXT NOT NULL DEFAULT '1d', -- '1d', '1h', '5m', etc.
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    data_json TEXT NOT NULL, -- JSON string of the actual data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    data_size INTEGER, -- Size of data in bytes for monitoring
    UNIQUE(symbol, provider, interval, start_date, end_date)
);

-- Index for fast lookups by symbol and date range
CREATE INDEX IF NOT EXISTS idx_cache_symbol_dates ON historical_data_cache(symbol, start_date, end_date);

-- Index for cache cleanup by last access time
CREATE INDEX IF NOT EXISTS idx_cache_last_accessed ON historical_data_cache(last_accessed);

-- Index for provider-specific queries
CREATE INDEX IF NOT EXISTS idx_cache_provider ON historical_data_cache(provider);

-- News cache for provider.getNews results
CREATE TABLE IF NOT EXISTS news_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'yahoo', 'tiingo', etc.
    start_date TEXT, -- optional filter lower bound
    end_date TEXT,   -- optional filter upper bound
    result_limit INTEGER,   -- requested limit
    data_json TEXT NOT NULL, -- JSON string of NewsArticle[]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    data_size INTEGER,
    UNIQUE(symbol, provider, start_date, end_date, result_limit)
);

CREATE INDEX IF NOT EXISTS idx_news_cache_symbol_dates ON news_cache(symbol, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_news_cache_provider ON news_cache(provider);
CREATE INDEX IF NOT EXISTS idx_news_cache_last_accessed ON news_cache(last_accessed);

-- Cache metadata table for tracking cache statistics
CREATE TABLE IF NOT EXISTS cache_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    total_requests INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    total_data_size INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider)
);

-- Cache configuration table
CREATE TABLE IF NOT EXISTS cache_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default cache configuration
INSERT OR IGNORE INTO cache_config (key, value, description) VALUES
('default_ttl_hours', '24', 'Default time-to-live for cached data in hours'),
('max_cache_size_mb', '1000', 'Maximum cache size in megabytes'),
('cleanup_threshold_days', '30', 'Days after which unused cache entries are cleaned up'),
('enable_cache', 'true', 'Enable/disable caching globally');
