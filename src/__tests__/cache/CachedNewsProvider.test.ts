import { DataProvider, NewsArticle } from '../../dataProviders/baseProvider';
import { CachedNewsProvider } from '../../cache/CachedNewsProvider';
import { cacheDb } from '../../cache/initCache';

class MockNewsProvider extends DataProvider {
  private calls = 0;
  async getNews(symbol: string): Promise<NewsArticle[]> {
    this.calls++;
    return [
      { ticker: symbol, title: `Title ${this.calls}`, publishedAt: new Date().toISOString() }
    ];
  }
}

describe('CachedNewsProvider', () => {
  beforeAll(() => {
    // ensure schema initialized by singleton import
    expect(cacheDb.getDatabase()).toBeTruthy();
  });

  test('returns cache miss then cache hit', async () => {
    const base = new MockNewsProvider();
    const provider = new CachedNewsProvider(base, 'yahoo', { ttlHours: 1 });

    const first = await provider.getNews('AAPL', { startDate: '2024-01-01', endDate: '2024-01-02', limit: 10 });
    expect(first.length).toBe(1);

    const second = await provider.getNews('AAPL', { startDate: '2024-01-01', endDate: '2024-01-02', limit: 10 });
    expect(second.length).toBe(1);

    // Titles should be equal if second call was served from cache (Mock would increment otherwise)
    expect(second[0].title).toBe(first[0].title);
  });
});
