import fetch from 'node-fetch';
import WebSocket from 'ws';
import { DataProvider } from './baseProvider.js';

const BASE_URL = 'https://api.polygon.io';

export class PolygonProvider extends DataProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  async getQuote(symbol) {
    const url = `${BASE_URL}/v2/last/trade/${symbol}?apiKey=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return {
      symbol,
      price: data?.results?.p ?? null,
      timestamp: data?.results?.t ?? null,
    };
  }

  async getHistorical(symbol, interval = 'day', from, to) {
    const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/${interval}/${from}/${to}?apiKey=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(`Historical Data for ${symbol}`);
    console.log(data);

    return data.results || [];
  }

  connectStream(symbols, onData) {
    const ws = new WebSocket('wss://socket.polygon.io/stocks');
    ws.on('open', () => {
      ws.send(JSON.stringify({ action: 'auth', params: this.apiKey }));
      ws.send(
        JSON.stringify({
          action: 'subscribe',
          params: symbols.map((s) => `T.${s}`).join(','),
        }),
      );
    });
    ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      onData(data);
    });
    ws.on('error', (err) => console.error('WS error:', err));
    return ws;
  }
}
