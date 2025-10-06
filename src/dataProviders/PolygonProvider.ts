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

export class PolygonProvider extends DataProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const url = `${BASE_URL}/v2/last/trade/${symbol}?apiKey=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json() as any;
    return {
      symbol,
      price: data?.results?.p ?? null,
      timestamp: data?.results?.t ?? null,
    };
  }

  async getHistorical(symbol: string, interval: string = 'day', from: string, to: string): Promise<any[]> {
    const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/${interval}/${from}/${to}?apiKey=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json() as any;
    
    if (!data.results) {
      console.warn(`No historical data found for ${symbol}`);
      return [];
    }

    // Transform Polygon data format to match expected format
    return data.results.map((bar: HistoricalBar) => ({
      date: new Date(bar.t).toISOString().split('T')[0], // Convert timestamp to YYYY-MM-DD
      close: bar.c,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      volume: bar.v
    }));
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
}
