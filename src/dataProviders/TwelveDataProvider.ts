import fetch from 'node-fetch';
import { DataProvider } from './baseProvider';

const BASE_URL = 'https://api.twelvedata.com';

export class TwelveDataProvider extends DataProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = process.env.TWELVE_DATA_API_KEY as string;
  }

  async getQuote(symbol: string): Promise<any> {
    try {
      const url = `${BASE_URL}/quote?symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json() as any;
      
      if (data.status === 'error') {
        console.error('TwelveData API Error:', data.message);
        return null;
      }

      return {
        symbol: data.symbol,
        price: parseFloat(data.close),
        timestamp: new Date(data.timestamp).getTime(),
        change: parseFloat(data.change),
        changePercent: parseFloat(data.percent_change),
        volume: parseInt(data.volume),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        open: parseFloat(data.open),
        previousClose: parseFloat(data.previous_close)
      };
    } catch (error) {
      console.error('Error fetching quote from TwelveData:', error);
      return null;
    }
  }

  async getHistorical(symbol: string, interval: string = '1day', from: string, to: string): Promise<any[]> {
    try {
      // Convert interval format to TwelveData format
      const intervalMap: { [key: string]: string } = {
        '1min': '1min',
        '5min': '5min',
        '15min': '15min',
        '30min': '30min',
        '1hour': '1h',
        '1day': '1day',
        '1week': '1week',
        '1month': '1month'
      };

      const twelveDataInterval = intervalMap[interval] || '1day';
      
      const url = `${BASE_URL}/time_series?symbol=${symbol}&interval=${twelveDataInterval}&start_date=${from}&end_date=${to}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.status === 'error') {
        console.error('TwelveData API Error:', data.message);
        return [];
      }

      // Transform the data to match expected format
      const timeSeries = data.values || [];
      return timeSeries.map((item: any) => ({
        timestamp: new Date(item.datetime).getTime(),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume)
      })).reverse(); // Reverse to get chronological order
    } catch (error) {
      console.error('Error fetching historical data from TwelveData:', error);
      return [];
    }
  }

  connectStream(symbols: string[], onData: (data: any) => void): Promise<any> {
    // TwelveData WebSocket streaming (if available)
    // Note: This would require a WebSocket implementation
    // For now, return a resolved promise as a placeholder
    console.log('TwelveData WebSocket streaming not implemented yet');
    return Promise.resolve();
  }
}
