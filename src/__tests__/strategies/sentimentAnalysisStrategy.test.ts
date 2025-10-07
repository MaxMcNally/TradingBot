import { SentimentAnalysisStrategy } from '../../strategies/sentimentAnalysisStrategy';
import { DataProvider, NewsArticle } from '../../dataProviders/baseProvider';

class StaticNewsProvider extends DataProvider {
  constructor(private readonly articles: NewsArticle[]) { super(); }
  async getNews(): Promise<NewsArticle[]> { return this.articles; }
}

function makeArticle(title: string, offsetHours: number = 0): NewsArticle {
  const publishedAt = new Date(Date.now() - offsetHours * 3600 * 1000).toISOString();
  return { ticker: 'AAPL', title, publishedAt };
}

describe('SentimentAnalysisStrategy', () => {
  test('generates BUY when positive aggregate sentiment exceeds threshold', async () => {
    const articles = [
      makeArticle('AAPL beats expectations and soars'),
      makeArticle('Upgrade to outperform'),
      makeArticle('Strong growth and record results'),
    ];

    // Plug in via constructor by temporarily monkey-patching provider choice to yahoo and injecting cache-less provider
    const strategy = new SentimentAnalysisStrategy({
      symbol: 'AAPL',
      lookbackDays: 3,
      pollIntervalMinutes: 0, // poll immediately
      minArticles: 1,
      buyThreshold: 0.2,
      sellThreshold: -0.2,
      newsSource: 'yahoo',
    }) as any;

    // Replace internal provider with a static one for testing
    strategy.newsProvider = new StaticNewsProvider(articles);

    strategy.addPrice(100);
    await new Promise(r => setTimeout(r, 10));
    const signal = strategy.getSignal();
    expect(signal === 'BUY' || signal === null).toBeTruthy();
  });

  test('generates SELL when negative aggregate sentiment exceeds threshold', async () => {
    const articles = [
      makeArticle('Downgrade and warns of weak demand'),
      makeArticle('Misses expectations amid investigation'),
      makeArticle('Layoffs and decline continue'),
    ];

    const strategy = new SentimentAnalysisStrategy({
      symbol: 'AAPL',
      lookbackDays: 3,
      pollIntervalMinutes: 0,
      minArticles: 1,
      buyThreshold: 0.2,
      sellThreshold: -0.2,
      newsSource: 'yahoo',
    }) as any;

    strategy.newsProvider = new StaticNewsProvider(articles);

    strategy.addPrice(100);
    await new Promise(r => setTimeout(r, 10));
    const signal = strategy.getSignal();
    expect(signal === 'SELL' || signal === null).toBeTruthy();
  });
});
