export interface NewsArticle {
  id?: string;
  ticker: string;
  title: string;
  description?: string;
  url?: string;
  source?: string;
  publishedAt: string; // ISO string
}

export class DataProvider {
  async getQuote(symbol: string): Promise<any> {
    return null;
  }

  async getHistorical(symbol: string, interval = 'day', from: string, to: string): Promise<any[]> {
    return [];
  }

  // Optional: Providers that support news can override this
  async getNews(_symbol: string, _options?: { startDate?: string; endDate?: string; limit?: number }): Promise<NewsArticle[]> {
    return [];
  }

  connectStream(symbols: string[], onData: (data: any) => void): Promise<any> {
    return Promise.resolve();
  }
}
