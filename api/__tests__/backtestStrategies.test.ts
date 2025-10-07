import { Request, Response } from 'express';
import { backtestRouter } from '../routes/backtest';
import { describe, it, expect } from '@jest/globals';

// Lightweight route handler test for strategies list

describe('Backtest strategies list', () => {
  it('includes sentimentAnalysis with expected parameters', () => {
    // Create mock req/res
    const req = {} as unknown as Request;
    const json = jest.fn();
    const res = { json } as unknown as Response;

    // Extract the handler from router stack (last get to /strategies)
    const layer: any = (backtestRouter as any).stack.find((l: any) => l.route && l.route.path === '/strategies');
    expect(layer).toBeTruthy();
    const handler = layer.route.stack[0].handle;

    handler(req, res);

    const payload = json.mock.calls[0][0];
    const names = payload.data.strategies.map((s: any) => s.name);
    expect(names).toContain('sentimentAnalysis');

    const sentiment = payload.data.strategies.find((s: any) => s.name === 'sentimentAnalysis');
    expect(sentiment.parameters).toHaveProperty('lookbackDays');
    expect(sentiment.parameters).toHaveProperty('buyThreshold');
    expect(sentiment.parameters).toHaveProperty('sellThreshold');
  });
});
