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
  async getQuote(_symbol: string): Promise<any> {
    return null;
  }

  async getHistorical(_symbol: string, _interval = 'day', _from: string, _to: string): Promise<any[]> {
    return [];
  }

  // Optional: Providers that support news can override this
  async getNews(_symbol: string, _options?: { startDate?: string; endDate?: string; limit?: number }): Promise<NewsArticle[]> {
    return [];
  }

  connectStream(_symbols: string[], _onData: (data: any) => void): Promise<any> {
    return Promise.resolve();
  }
}
