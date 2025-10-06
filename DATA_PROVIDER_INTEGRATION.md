# Data Provider Integration

This document describes the configurable data provider system implemented in the trading bot backtest script.

## Overview

The backtest script now supports multiple data providers, allowing you to choose between different data sources for your backtesting needs. Currently supported providers:

- **Yahoo Finance** (default) - Free, no API key required
- **Polygon.io REST API** - Professional market data, requires API key
- **Polygon.io Flat Files** - Large historical datasets via S3, requires S3 credentials

## Usage

### Basic Usage with Yahoo Finance (Default)

```bash
npx ts-node src/backtest.ts --symbol AAPL --start 2023-01-01 --end 2023-12-31
```

### Using Polygon.io REST API Provider

First, set your Polygon API key as an environment variable:

```bash
export POLYGON_API_KEY=your_polygon_api_key_here
```

Then run the backtest:

```bash
npx ts-node src/backtest.ts --symbol AAPL --start 2023-01-01 --end 2023-12-31 --provider polygon
```

### Using Polygon.io Flat Files Provider

First, set your Polygon S3 credentials as environment variables:

```bash
export POLYGON_AWS_ACCESS_KEY_ID=your_s3_access_key
export POLYGON_AWS_SECRET_ACCESS_KEY=your_s3_secret_key
```

Then run the backtest:

```bash
npx ts-node src/backtest.ts --symbol AAPL --start 2023-01-01 --end 2023-12-31 --provider polygon-flatfiles
```

### Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--provider` | string | `yahoo` | Data provider to use (`yahoo`, `polygon`, or `polygon-flatfiles`) |

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `POLYGON_API_KEY` | Polygon.io API key (required when using polygon provider) |
| `POLYGON_AWS_ACCESS_KEY_ID` | Polygon.io S3 access key (required when using polygon-flatfiles provider) |
| `POLYGON_AWS_SECRET_ACCESS_KEY` | Polygon.io S3 secret key (required when using polygon-flatfiles provider) |

### Example Commands

#### Mean Reversion Strategy with Yahoo
```bash
npx ts-node src/backtest.ts \
  --symbol AAPL \
  --start 2023-01-01 \
  --end 2023-12-31 \
  --strategy meanReversion \
  --provider yahoo \
  --window 20 \
  --threshold 0.05
```

#### Moving Average Crossover with Polygon REST API
```bash
export POLYGON_API_KEY=your_api_key_here

npx ts-node src/backtest.ts \
  --symbol AAPL \
  --start 2023-01-01 \
  --end 2023-12-31 \
  --strategy movingAverageCrossover \
  --provider polygon \
  --fastWindow 10 \
  --slowWindow 30
```

#### Bollinger Bands Strategy with Polygon Flat Files
```bash
export POLYGON_AWS_ACCESS_KEY_ID=your_s3_access_key
export POLYGON_AWS_SECRET_ACCESS_KEY=your_s3_secret_key

npx ts-node src/backtest.ts \
  --symbol AAPL \
  --start 2023-01-01 \
  --end 2023-12-31 \
  --strategy bollingerBands \
  --provider polygon-flatfiles \
  --window 20 \
  --multiplier 2.0
```

## Data Provider Details

### Yahoo Finance Provider
- **Cost**: Free
- **Rate Limits**: Moderate (suitable for backtesting)
- **Data Quality**: Good for historical data
- **Setup**: No API key required

### Polygon.io REST API Provider
- **Cost**: Paid service (free tier available)
- **Rate Limits**: Higher limits with paid plans
- **Data Quality**: Professional-grade market data
- **Setup**: Requires `POLYGON_API_KEY` environment variable from [Polygon.io](https://polygon.io)

### Polygon.io Flat Files Provider
- **Cost**: Paid service (requires Flat Files subscription)
- **Rate Limits**: No API rate limits (S3-based downloads)
- **Data Quality**: Professional-grade historical market data
- **Setup**: Requires S3 credentials (`POLYGON_AWS_ACCESS_KEY_ID`, `POLYGON_AWS_SECRET_ACCESS_KEY`) from [Polygon.io](https://polygon.io)
- **Best For**: Large historical datasets, bulk data downloads

## Data Format Compatibility

All providers return data in a standardized format:

```typescript
{
  date: string,    // YYYY-MM-DD format
  close: number,   // Closing price
  open: number,    // Opening price
  high: number,    // High price
  low: number,     // Low price
  volume: number   // Trading volume
}
```

## Caching

The caching system works with all providers:

- **Yahoo**: Cache key `yahoo`
- **Polygon REST API**: Cache key `polygon`
- **Polygon Flat Files**: Cache key `polygon-flatfiles`

Cache statistics will show which provider was used:

```
=== Cache Statistics ===
Provider: POLYGON
Symbol: AAPL
Cached ranges: 3
Coverage: 2023-01-01 to 2023-12-31 (365 days)
```

## Error Handling

### Missing API Key
When using Polygon REST API provider without the environment variable:
```
Error: POLYGON_API_KEY environment variable is required when using polygon provider
Please set your Polygon API key: export POLYGON_API_KEY=your_api_key_here
```

### Missing S3 Credentials
When using Polygon Flat Files provider without S3 credentials:
```
Error: S3 credentials are required for polygon-flatfiles provider
Please set your S3 credentials:
  export POLYGON_AWS_ACCESS_KEY_ID=your_s3_access_key
  export POLYGON_AWS_SECRET_ACCESS_KEY=your_s3_secret_key
```

### Invalid Provider
When specifying an unsupported provider:
```
Invalid values:
  Argument: provider, Given: "invalid", Choices: "yahoo", "polygon", "polygon-flatfiles"
```

## Testing

You can test each provider individually:

### Test Yahoo Provider
```bash
npx ts-node src/backtest.ts --symbol AAPL --start 2023-01-01 --end 2023-12-31 --provider yahoo --no-cache
```

### Test Polygon REST API Provider
```bash
# Without API key (should show error)
npx ts-node src/backtest.ts --symbol AAPL --start 2023-01-01 --end 2023-12-31 --provider polygon --no-cache

# With API key (replace with your actual key)
POLYGON_API_KEY=your_key npx ts-node src/backtest.ts --symbol AAPL --start 2023-01-01 --end 2023-12-31 --provider polygon --no-cache
```

### Test Polygon Flat Files Provider
```bash
# Without S3 credentials (should show error)
npx ts-node src/backtest.ts --symbol AAPL --start 2023-01-01 --end 2023-12-31 --provider polygon-flatfiles --no-cache

# With S3 credentials (replace with your actual credentials)
POLYGON_AWS_ACCESS_KEY_ID=your_key POLYGON_AWS_SECRET_ACCESS_KEY=your_secret npx ts-node src/backtest.ts --symbol AAPL --start 2023-01-01 --end 2023-12-31 --provider polygon-flatfiles --no-cache
```

## Adding New Providers

To add a new data provider:

1. Create a new provider class extending `DataProvider`:
```typescript
export class NewProvider extends DataProvider {
  async getHistorical(symbol: string, interval: string, from: string, to: string): Promise<any[]> {
    // Implementation
  }
}
```

2. Update the backtest script to include the new provider in the choices and initialization logic.

3. Ensure the provider returns data in the expected format.

## Troubleshooting

### Common Issues

1. **Polygon API Key Issues**
   - Ensure `POLYGON_API_KEY` environment variable is set correctly
   - Verify your API key is valid and has sufficient credits
   - Check that the symbol format is correct (e.g., `AAPL` not `AAPL.US`)

2. **Data Format Issues**
   - Both providers should return data in the same format
   - Check console output for data transformation logs

3. **Rate Limiting**
   - Yahoo: Add delays between requests if hitting limits
   - Polygon: Upgrade your plan for higher rate limits

### Debug Mode

Add `--no-cache` to disable caching and see raw API responses:

```bash
# For Polygon REST API
export POLYGON_API_KEY=your_api_key_here
npx ts-node src/backtest.ts --symbol AAPL --start 2023-01-01 --end 2023-12-31 --provider polygon --no-cache

# For Polygon Flat Files
export POLYGON_AWS_ACCESS_KEY_ID=your_s3_access_key
export POLYGON_AWS_SECRET_ACCESS_KEY=your_s3_secret_key
npx ts-node src/backtest.ts --symbol AAPL --start 2023-01-01 --end 2023-12-31 --provider polygon-flatfiles --no-cache
```
