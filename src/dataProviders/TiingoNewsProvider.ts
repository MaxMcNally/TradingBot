import fetch from 'node-fetch';
import { DataProvider, NewsArticle } from './baseProvider';

interface TiingoNewsItem {
  id?: number | string;
  tickers?: string[];
  title: string;
  description?: string;
  url?: string;
  articleUrl?: string;
  source?: string;
  publishedDate?: string; // ISO
  publishedAt?: string;   // Some APIs use this
}

export interface TiingoNewsOptions {
  startDate?: string; // ISO
  endDate?: string;   // ISO
  limit?: number;
}

/**
 * Tiingo News Provider
 * Fetches news articles for a given ticker using Tiingo's News API
 * Docs: https://www.tiingo.com/documentation/news
 */
export class TiingoNewsProvider extends DataProvider {
  private apiKey: string;
  private baseUrl = 'https://api.tiingo.com/tiingo/news';

  constructor(apiKey?: string) {
    super();
    const key = apiKey || process.env.TIINGO_API_KEY;
    if (!key) {
      throw new Error('TIINGO_API_KEY is required to use TiingoNewsProvider');
    }
    this.apiKey = key;
  }

  async getNews(symbol: string, options: TiingoNewsOptions = {}): Promise<NewsArticle[]> {
    const params = new URLSearchParams();
    params.set('tickers', symbol.toUpperCase());
    if (options.startDate) params.set('startDate', options.startDate);
    if (options.endDate) params.set('endDate', options.endDate);
    if (options.limit) params.set('limit', String(options.limit));
    params.set('token', this.apiKey);

    const url = `${this.baseUrl}?${params.toString()}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Tiingo news request failed: ${res.status} ${res.statusText} - ${text}`);
      }
      const data = (await res.json()) as TiingoNewsItem[];
      return (data || []).map((item) => this.mapToNewsArticle(item, symbol));
    } catch (error) {
      console.error('Error fetching Tiingo news:', error);
      return [];
    }
  }

  private mapToNewsArticle(item: TiingoNewsItem, fallbackTicker: string): NewsArticle {
    const publishedAt = item.publishedDate || item.publishedAt || new Date().toISOString();
    const url = item.url || item.articleUrl;
    return {
      id: item.id ? String(item.id) : undefined,
      ticker: (item.tickers && item.tickers[0]) || fallbackTicker.toUpperCase(),
      title: item.title,
      description: item.description,
      url,
      source: item.source,
      publishedAt,
    };
  }
}
