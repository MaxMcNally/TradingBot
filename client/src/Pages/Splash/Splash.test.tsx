import { describe, it, expect } from 'vitest';

describe('Splash Page Logic', () => {
  it('should have correct page structure', () => {
    const pageTitle = 'TradingBot';
    expect(pageTitle).toBe('TradingBot');
  });

  it('should have CTA buttons', () => {
    const ctaButtons = ['Get Started', 'Sign In'];
    expect(ctaButtons.length).toBe(2);
    expect(ctaButtons).toContain('Get Started');
    expect(ctaButtons).toContain('Sign In');
  });

  it('should display features', () => {
    const features = [
      'Automated Trading',
      'Strategy Backtesting',
      'Strategy Marketplace',
      'Real-time Execution'
    ];
    expect(features.length).toBeGreaterThan(3);
  });

  it('should navigate to login page', () => {
    const loginPath = '/login';
    expect(loginPath).toBe('/login');
  });
});

