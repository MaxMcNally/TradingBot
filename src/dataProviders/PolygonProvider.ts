import fetch from 'node-fetch';
import WebSocket from 'ws';
import { DataProvider } from './baseProvider';

const BASE_URL = 'https://api.polygon.io';

export interface Quote {
  symbol: string;
  price: number | null;
  timestamp: number | null;
}

export interface HistoricalBar {
  t: number; // timestamp
  c: number; // close price
  o: number; // open price
  h: number; // high price
  l: number; // low price
  v: number; // volume
}

export interface PolygonTrade {
  ev: string; // event type
  sym: string; // symbol
  p: number; // price
  s: number; // size
  t: number; // timestamp
}

export interface TechnicalIndicator {
  value: number;
  timestamp: number;
}

export class PolygonProvider extends DataProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async getQuote(symbol: string): Promise<Quote> {
    try {
      // Use market snapshot for current price (works with paid account)
      const url = `${BASE_URL}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${symbol}&apiKey=${this.apiKey}`;
      console.log(`🔍 Fetching market snapshot for ${symbol} from: ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      const res = await fetch(url);
      const data = await res.json() as any;

      console.log(`📊 Market Snapshot Response for ${symbol}:`, {
        status: data.status,
        tickersCount: data.tickers?.length || 0,
        hasTickerData: !!data.tickers?.[0],
        tickerData: data.tickers?.[0] ? {
          ticker: data.tickers[0].ticker,
          day: data.tickers[0].day,
          updated: data.tickers[0].updated,
          hasClosePrice: !!data.tickers[0].day?.c
        } : null
      });

      if (data.status === 'OK' && data.tickers?.[0]) {
        const ticker = data.tickers[0];
        const result = {
          symbol,
          price: ticker.day?.c ?? null,
          timestamp: ticker.updated ? Math.floor(ticker.updated / 1000000) : null, // Convert nanoseconds to milliseconds
        };
        console.log(`✅ Market Snapshot Success for ${symbol}:`, result);
        return result;
      }

      console.log(`⚠️  Market snapshot failed for ${symbol}, trying fallback...`);
      
      // Fallback to last trade endpoint
      const fallbackUrl = `${BASE_URL}/v2/last/trade/${symbol}?apiKey=${this.apiKey}`;
      console.log(`🔍 Fetching last trade for ${symbol} from: ${fallbackUrl.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      const fallbackRes = await fetch(fallbackUrl);
      const fallbackData = await fallbackRes.json() as any;
      
      console.log(`📊 Last Trade Response for ${symbol}:`, {
        status: fallbackData.status,
        hasResults: !!fallbackData.results,
        resultsData: fallbackData.results
      });
      
      const fallbackResult = {
        symbol,
        price: fallbackData?.results?.p ?? null,
        timestamp: fallbackData?.results?.t ?? null,
      };
      console.log(`✅ Last Trade Success for ${symbol}:`, fallbackResult);
      return fallbackResult;
    } catch (error) {
      console.error(`❌ Error fetching quote for ${symbol}:`, error);
      return {
        symbol,
        price: null,
        timestamp: null,
      };
    }
  }

  async getHistorical(symbol: string, interval: string = 'day', from: string, to: string): Promise<any[]> {
    try {
      // Convert interval to Polygon timeframe
      const timeframe = this.convertIntervalToTimeframe(interval);
      
      const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/${timeframe}/${from}/${to}?apiKey=${this.apiKey}`;
      const res = await fetch(url);
      const data = await res.json() as any;
      
      if (!data.results) {
        console.warn(`No historical data found for ${symbol}`);
        return [];
      }

      // Transform Polygon data format to match expected format
      return data.results.map((bar: HistoricalBar) => ({
        date: new Date(bar.t).toISOString().split('T')[0], // Convert timestamp to YYYY-MM-DD
        timestamp: bar.t, // Keep original timestamp for minute-level data
        close: bar.c,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        volume: bar.v
      }));
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  // New method: Get minute-level data for intraday trading
  async getMinuteData(symbol: string, date: string): Promise<any[]> {
    try {
      const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/minute/${date}/${date}?apiKey=${this.apiKey}`;
      const res = await fetch(url);
      const data = await res.json() as any;
      
      if (!data.results) {
        return [];
      }

      return data.results.map((bar: HistoricalBar) => ({
        timestamp: bar.t,
        date: new Date(bar.t).toISOString(),
        close: bar.c,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        volume: bar.v
      }));
    } catch (error) {
      console.error(`Error fetching minute data for ${symbol}:`, error);
      return [];
    }
  }

  // New method: Get technical indicators
  async getTechnicalIndicator(symbol: string, indicator: string, params: any = {}): Promise<TechnicalIndicator[]> {
    try {
      const defaultParams = {
        timestamp_gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
        timespan: 'minute',
        adjusted: 'true',
        order: 'desc',
        limit: 100,
        ...params
      };

      const queryParams = new URLSearchParams(defaultParams).toString();
      const url = `${BASE_URL}/v1/indicators/${indicator}/${symbol}?${queryParams}&apiKey=${this.apiKey}`;
      
      const res = await fetch(url);
      const data = await res.json() as any;
      
      if (data.status === 'OK' && data.results?.values) {
        return data.results.values.map((item: any) => ({
          value: item.value,
          timestamp: item.timestamp
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching technical indicator ${indicator} for ${symbol}:`, error);
      return [];
    }
  }

  connectStream(symbols: string[], onData: (data: PolygonTrade[]) => void): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('wss://socket.polygon.io/stocks');
      
      ws.on('open', () => {
        ws.send(JSON.stringify({ action: 'auth', params: this.apiKey }));
        ws.send(
          JSON.stringify({
            action: 'subscribe',
            params: symbols.map((s) => `T.${s}`).join(','),
          }),
        );
        resolve(ws);
      });
      
      ws.on('message', (msg: any) => {
        const data = JSON.parse(msg.toString()) as PolygonTrade[];
        onData(data);
      });
      
      ws.on('error', (err: any) => {
        console.error('WS error:', err);
        reject(err);
      });
    });
  }

  private convertIntervalToTimeframe(interval: string): string {
    switch (interval.toLowerCase()) {
      case 'minute':
      case '1min':
        return 'minute';
      case '5min':
        return '5minute';
      case '15min':
        return '15minute';
      case '30min':
        return '30minute';
      case 'hour':
      case '1hour':
        return 'hour';
      case 'day':
      case '1day':
      default:
        return 'day';
      case 'week':
        return 'week';
      case 'month':
        return 'month';
    }
  }
}
