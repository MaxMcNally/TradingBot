import { Request, Response } from 'express';
import { getAvailableStrategies } from '../controllers/tradingController';
import { describe, it, expect } from '@jest/globals';

// Test for unified strategies API endpoint

describe('Unified Strategies API', () => {
  it('includes sentimentAnalysis with expected parameters and display name', async () => {
    // Create mock req/res
    const req = {} as unknown as Request;
    const json = jest.fn();
    const res = { json } as unknown as Response;

    await getAvailableStrategies(req, res);

    expect(json).toHaveBeenCalled();
    const payload = json.mock.calls[0][0];
    
    // Check response structure
    expect(payload).toHaveProperty('success', true);
    expect(payload).toHaveProperty('data');
    expect(payload.data).toHaveProperty('strategies');
    
    const names = payload.data.strategies.map((s: any) => s.name);
    expect(names).toContain('sentimentAnalysis');

    const sentiment = payload.data.strategies.find((s: any) => s.name === 'sentimentAnalysis');
    expect(sentiment).toHaveProperty('displayName', 'Sentiment Analysis');
    expect(sentiment).toHaveProperty('description');
    expect(sentiment).toHaveProperty('category');
    expect(sentiment.parameters).toHaveProperty('lookbackDays');
    expect(sentiment.parameters).toHaveProperty('buyThreshold');
    expect(sentiment.parameters).toHaveProperty('sellThreshold');
  });

  it('includes all expected strategies with display names', async () => {
    const req = {} as unknown as Request;
    const json = jest.fn();
    const res = { json } as unknown as Response;

    await getAvailableStrategies(req, res);

    const payload = json.mock.calls[0][0];
    const strategies = payload.data.strategies;
    
    // Check that all expected strategies are present
    // Note: 'custom' is not included in getAvailableStrategies as it's user-specific
    const expectedStrategies = [
      { name: 'meanReversion', displayName: 'Mean Reversion' },
      { name: 'movingAverageCrossover', displayName: 'Moving Average Crossover' },
      { name: 'momentum', displayName: 'Momentum' },
      { name: 'bollingerBands', displayName: 'Bollinger Bands' },
      { name: 'breakout', displayName: 'Breakout' },
      { name: 'sentimentAnalysis', displayName: 'Sentiment Analysis' }
    ];

    expectedStrategies.forEach(expected => {
      const strategy = strategies.find((s: any) => s.name === expected.name);
      expect(strategy).toBeDefined();
      expect(strategy.displayName).toBe(expected.displayName);
      expect(strategy).toHaveProperty('description');
      expect(strategy).toHaveProperty('category');
      expect(strategy).toHaveProperty('parameters');
    });
  });

  it('includes min/max limits for number parameters', async () => {
    const req = {} as unknown as Request;
    const json = jest.fn();
    const res = { json } as unknown as Response;

    await getAvailableStrategies(req, res);

    const payload = json.mock.calls[0][0];
    const meanReversion = payload.data.strategies.find((s: any) => s.name === 'meanReversion');
    
    // Check that number parameters have min/max limits
    expect(meanReversion.parameters.window).toHaveProperty('min', 5);
    expect(meanReversion.parameters.window).toHaveProperty('max', 200);
    expect(meanReversion.parameters.threshold).toHaveProperty('min', 0.01);
    expect(meanReversion.parameters.threshold).toHaveProperty('max', 0.2);
    expect(meanReversion.parameters.threshold).toHaveProperty('step', 0.01);
  });

  it('includes select options for select parameters', async () => {
    const req = {} as unknown as Request;
    const json = jest.fn();
    const res = { json } as unknown as Response;

    await getAvailableStrategies(req, res);

    const payload = json.mock.calls[0][0];
    const maCrossover = payload.data.strategies.find((s: any) => s.name === 'movingAverageCrossover');
    
    // Check that select parameters have options
    expect(maCrossover.parameters.maType).toHaveProperty('options');
    expect(maCrossover.parameters.maType.options).toEqual(['SMA', 'EMA']);
  });
});
