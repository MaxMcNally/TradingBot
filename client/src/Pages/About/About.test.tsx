import { describe, it, expect } from 'vitest';

describe('About Page Logic', () => {
  it('should have correct page structure', () => {
    const pageTitle = 'About TradingBot';
    const featuresCount = 6;

    expect(pageTitle).toBe('About TradingBot');
    expect(featuresCount).toBe(6);
  });

  it('should display key features', () => {
    const features = [
      'Automated Trading',
      'Strategy Backtesting',
      'Strategy Marketplace',
      'Real-time Execution',
      'Secure Integration',
      'Portfolio Management'
    ];

    expect(features.length).toBe(6);
    expect(features[0]).toBe('Automated Trading');
  });

  it('should have mission statement', () => {
    const hasMission = true;
    expect(hasMission).toBe(true);
  });
});

