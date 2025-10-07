import { runMeanReversionStrategy } from '../strategies/meanReversionStrategy';
import { runMomentumStrategy } from '../strategies/momentumStrategy';
import { runBollingerBandsStrategy } from '../strategies/bollingerBandsStrategy';
import { runBreakoutStrategy } from '../strategies/breakoutStrategy';

function generateSeries(length: number, start = 100): { date: string; close: number; open: number; volume?: number }[] {
  let price = start;
  const data: { date: string; close: number; open: number; volume?: number }[] = [];
  for (let i = 0; i < length; i++) {
    const change = (Math.sin(i / 25) + Math.random() - 0.5) * 2; // pseudo-signal + noise
    const open = price;
    price = Math.max(1, price + change);
    data.push({ date: new Date(2023, 0, 1 + i).toDateString(), close: price, open, volume: 1 + (i % 5) });
  }
  return data;
}

describe('Backtest micro-benchmarks', () => {
  const sizes = [1_000, 10_000, 50_000];

  for (const n of sizes) {
    it(`mean reversion ${n} bars under budget`, () => {
      const series = generateSeries(n);
      const start = Date.now();
      const result = runMeanReversionStrategy('TEST', series, {
        window: 20,
        threshold: 0.05,
        initialCapital: 100000,
        sharesPerTrade: 100
      });
      const elapsed = Date.now() - start;
      expect(result.trades).toBeDefined();
      // Budgets: scale roughly linearly; generous to avoid flakes in CI
      const budgetMs = n <= 1_000 ? 50 : n <= 10_000 ? 250 : 1200;
      expect(elapsed).toBeLessThan(budgetMs);
    });

    it(`momentum ${n} bars under budget`, () => {
      const series = generateSeries(n);
      const start = Date.now();
      const result = runMomentumStrategy('TEST', series, {
        rsiWindow: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        momentumWindow: 10,
        momentumThreshold: 0.02,
        initialCapital: 100000,
        sharesPerTrade: 100
      });
      const elapsed = Date.now() - start;
      expect(result.trades).toBeDefined();
      const budgetMs = n <= 1_000 ? 80 : n <= 10_000 ? 400 : 1800;
      expect(elapsed).toBeLessThan(budgetMs);
    });

    it(`bollinger ${n} bars under budget`, () => {
      const series = generateSeries(n);
      const start = Date.now();
      const result = runBollingerBandsStrategy('TEST', series, {
        window: 20,
        multiplier: 2.0,
        maType: 'SMA',
        initialCapital: 100000,
        sharesPerTrade: 100
      });
      const elapsed = Date.now() - start;
      expect(result.trades).toBeDefined();
      const budgetMs = n <= 1_000 ? 90 : n <= 10_000 ? 450 : 2000;
      expect(elapsed).toBeLessThan(budgetMs);
    });

    it(`breakout ${n} bars under budget`, () => {
      const series = generateSeries(n);
      const start = Date.now();
      const result = runBreakoutStrategy('TEST', series, {
        lookbackWindow: 20,
        breakoutThreshold: 0.01,
        minVolumeRatio: 1.5,
        confirmationPeriod: 2,
        initialCapital: 100000,
        sharesPerTrade: 100
      });
      const elapsed = Date.now() - start;
      expect(result.trades).toBeDefined();
      const budgetMs = n <= 1_000 ? 90 : n <= 10_000 ? 450 : 2000;
      expect(elapsed).toBeLessThan(budgetMs);
    });
  }
});
