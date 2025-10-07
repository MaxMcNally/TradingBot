import { AbstractStrategy, Signal } from './baseStrategy';
import { DataProvider, NewsArticle } from '../dataProviders/baseProvider';
import { TiingoNewsProvider, TiingoNewsOptions } from '../dataProviders/TiingoNewsProvider';
import { YahooDataProvider } from '../dataProviders/yahooProvider';
import { CachedNewsProvider } from '../cache/CachedNewsProvider';

export interface SentimentAnalysisConfig {
  symbol: string;
  lookbackDays: number;            // How many days of news to consider
  pollIntervalMinutes: number;     // How often to poll Tiingo for new news
  minArticles: number;             // Minimum articles required to generate a signal
  buyThreshold: number;            // Aggregate sentiment threshold to trigger BUY (e.g., 0.4)
  sellThreshold: number;           // Aggregate sentiment threshold to trigger SELL (e.g., -0.4)
  titleWeight?: number;            // Weight of title vs description (default: 2.0)
  recencyHalfLifeHours?: number;   // Half-life for recency decay (default: 12)
  tiingoApiKey?: string;           // Optional API key override; otherwise uses env TIINGO_API_KEY
  newsSource?: 'tiingo' | 'yahoo'; // Which news API to use
}

/**
 * SentimentAnalysisStrategy
 * Heuristic sentiment scoring of Tiingo news to produce BUY/SELL signals.
 */
export class SentimentAnalysisStrategy extends AbstractStrategy {
  private readonly config: SentimentAnalysisConfig;
  private readonly newsProvider: DataProvider;
  private lastSignal: Signal = null;
  private lastPollAt: number = 0;
  private aggregatedArticles: NewsArticle[] = [];

  constructor(config: Omit<SentimentAnalysisConfig, 'symbol'> & { symbol: string }) {
    super();
    this.config = {
      titleWeight: 2.0,
      recencyHalfLifeHours: 12,
      ...config,
    };
    // Choose news provider by config; default to Yahoo per PR review
    const source = (this.config.newsSource || 'yahoo').toLowerCase();
    const baseProvider = source === 'yahoo'
      ? new YahooDataProvider()
      : new TiingoNewsProvider(this.config.tiingoApiKey);
    // Wrap with cache
    this.newsProvider = new CachedNewsProvider(baseProvider, source);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addPrice(_price: number): void {
    // Price is not used directly; we poll for news on a timer and update signal.
    const now = Date.now();
    const pollMs = this.config.pollIntervalMinutes * 60 * 1000;
    if (now - this.lastPollAt < pollMs) {
      this.lastSignal = null;
      return;
    }
    this.lastPollAt = now;

    // Fire-and-forget; bot calls getSignal subsequently
    void this.pollAndScoreNews();
    this.lastSignal = null;
  }

  getSignal(): Signal {
    return this.lastSignal;
  }

  getStrategyName(): string {
    return 'SentimentAnalysis';
  }

  reset(): void {
    this.aggregatedArticles = [];
    this.lastSignal = null;
    this.lastPollAt = 0;
  }

  addNews(articles: NewsArticle[]): void {
    // Merge new articles and re-score immediately
    this.aggregatedArticles = this.dedupeById([...articles, ...this.aggregatedArticles]);
    this.scoreAndUpdateSignal();
  }

  private async pollAndScoreNews(): Promise<void> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - this.config.lookbackDays * 24 * 60 * 60 * 1000);

      const options: TiingoNewsOptions = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: 100,
      };
      const news = await this.newsProvider.getNews(this.config.symbol, options);
      this.addNews(news);
    } catch (error) {
      // Swallow and keep running
       
      console.error('SentimentAnalysisStrategy poll error:', error);
    }
  }

  private scoreAndUpdateSignal(): void {
    const now = Date.now();
    const halfLifeMs = (this.config.recencyHalfLifeHours || 12) * 60 * 60 * 1000;
    const lambda = Math.log(2) / halfLifeMs; // decay rate

    let weightedSum = 0;
    let weightTotal = 0;
    let considered = 0;

    for (const article of this.aggregatedArticles) {
      if (!article.publishedAt) continue;
      const ts = new Date(article.publishedAt).getTime();
      const ageMs = Math.max(0, now - ts);
      const weight = Math.exp(-lambda * ageMs);

      const score = this.scoreArticle(article);
      weightedSum += score * weight;
      weightTotal += weight;
      considered++;
    }

    const aggregate = weightTotal > 0 ? weightedSum / weightTotal : 0;

    if (considered < this.config.minArticles) {
      this.lastSignal = null;
      return;
    }

    if (aggregate >= this.config.buyThreshold) {
      this.lastSignal = 'BUY';
    } else if (aggregate <= this.config.sellThreshold) {
      this.lastSignal = 'SELL';
    } else {
      this.lastSignal = null;
    }
  }

  private scoreArticle(article: NewsArticle): number {
    const title = (article.title || '').toLowerCase();
    const desc = (article.description || '').toLowerCase();

    const positives = [
      'beat', 'beats', 'exceed', 'exceeds', 'surge', 'record', 'upgrade', 'outperform',
      'buyback', 'dividend increase', 'profit', 'profitable', 'growth', 'raises guidance',
      'raise guidance', 'optimism', 'bullish', 'strong', 'above expectations', 'tops', 'soars'
    ];
    const negatives = [
      'miss', 'misses', 'fall', 'falls', 'drop', 'drops', 'downgrade', 'underperform',
      'loss', 'losses', 'decline', 'weak', 'cuts guidance', 'cut guidance', 'bearish',
      'investigation', 'probe', 'lawsuit', 'sec', 'fraud', 'layoff', 'layoffs', 'warns', 'warning'
    ];

    const titleWeight = this.config.titleWeight || 2.0;
    const titleScore = this.keywordScore(title, positives, negatives) * titleWeight;
    const descScore = this.keywordScore(desc, positives, negatives);
    const raw = titleScore + descScore;

    // Normalize roughly to [-1, 1]
    const maxPossible = 6; // heuristic cap
    const normalized = Math.max(-1, Math.min(1, raw / maxPossible));
    return normalized;
  }

  private keywordScore(text: string, positives: string[], negatives: string[]): number {
    let score = 0;
    for (const p of positives) {
      if (text.includes(p)) score += 1;
    }
    for (const n of negatives) {
      if (text.includes(n)) score -= 1;
    }
    return score;
  }

  private dedupeById(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    const out: NewsArticle[] = [];
    for (const a of articles) {
      const key = a.id ? `${a.id}` : `${a.ticker}-${a.title}-${a.publishedAt}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(a);
    }
    return out;
  }
}
