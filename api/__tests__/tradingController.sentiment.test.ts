import { Request, Response } from 'express';
import { getAvailableStrategies } from '../controllers/tradingController';

describe('Trading Controller - getAvailableStrategies', () => {
  it('includes sentimentAnalysis strategy in the list with unified format', async () => {
    const req = {} as Request;
    const json = jest.fn();
    const res = { json } as unknown as Response;

    await getAvailableStrategies(req, res);

    expect(json).toHaveBeenCalled();
    const payload = json.mock.calls[0][0];
    
    // Check unified response format
    expect(payload).toHaveProperty('success', true);
    expect(payload).toHaveProperty('data');
    expect(payload.data).toHaveProperty('strategies');
    expect(Array.isArray(payload.data.strategies)).toBe(true);
    
    const names = payload.data.strategies.map((s: any) => s.name);
    expect(names).toContain('sentimentAnalysis');
    
    // Check that display names are present
    const sentiment = payload.data.strategies.find((s: any) => s.name === 'sentimentAnalysis');
    expect(sentiment).toHaveProperty('displayName', 'Sentiment Analysis');
  });
});
