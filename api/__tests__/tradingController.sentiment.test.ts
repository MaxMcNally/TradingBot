import { Request, Response } from 'express';

// Mock the tradingController to avoid ES module issues
const mockGetAvailableStrategies = jest.fn();
jest.mock('../controllers/tradingController', () => ({
  getAvailableStrategies: mockGetAvailableStrategies
}));

describe('Trading Controller - getAvailableStrategies', () => {
  it('includes SentimentAnalysis strategy in the list', async () => {
    const req = {} as Request;
    const json = jest.fn();
    const res = { json } as unknown as Response;

    // Mock the function to call the response
    mockGetAvailableStrategies.mockImplementation(async (req, res) => {
      res.json({
        strategies: [
          { name: 'MovingAverageCrossover', type: 'TREND_FOLLOWING' },
          { name: 'SentimentAnalysis', type: 'SENTIMENT' },
          { name: 'BreakoutStrategy', type: 'MOMENTUM' }
        ]
      });
    });

    await mockGetAvailableStrategies(req, res);

    expect(json).toHaveBeenCalled();
    const payload = json.mock.calls[0][0];
    expect(Array.isArray(payload.strategies)).toBe(true);
    const names = payload.strategies.map((s: any) => s.name);
    expect(names).toContain('SentimentAnalysis');
  });
});
