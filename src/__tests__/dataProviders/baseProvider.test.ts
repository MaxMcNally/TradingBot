import { DataProvider } from '../../dataProviders/baseProvider';

describe('DataProvider', () => {
  let provider: DataProvider;

  beforeEach(() => {
    provider = new DataProvider();
  });

  describe('getQuote', () => {
    it('should return null by default', async () => {
      const result = await provider.getQuote('AAPL');
      expect(result).toBeNull();
    });
  });

  describe('getHistorical', () => {
    it('should return empty array by default', async () => {
      const result = await provider.getHistorical('AAPL', '1d', '2023-01-01', '2023-01-31');
      expect(result).toEqual([]);
    });
  });

  describe('connectStream', () => {
    it('should return resolved promise by default', async () => {
      const result = await provider.connectStream(['AAPL'], () => {});
      expect(result).toBeUndefined();
    });
  });
});
