import { Request, Response } from 'express';
import { getAvailableStrategies } from '../controllers/tradingController';

describe('Trading Controller - getAvailableStrategies', () => {
  it('includes SentimentAnalysis strategy in the list', async () => {
    const req = {} as Request;
    const json = jest.fn();
    const res = { json } as unknown as Response;

    await getAvailableStrategies(req, res);

    expect(json).toHaveBeenCalled();
    const payload = json.mock.calls[0][0];
    expect(Array.isArray(payload.strategies)).toBe(true);
    const names = payload.strategies.map((s: any) => s.name);
    expect(names).toContain('SentimentAnalysis');
  });
});
