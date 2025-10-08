// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.POLYGON_API_KEY = 'test-api-key';

// Global test setup
beforeAll(() => {
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

describe('Test Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have environment variables available', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.POLYGON_API_KEY).toBe('test-api-key');
  });

  it('should have global mocks available', () => {
    expect(global.fetch).toBeDefined();
    expect(global.WebSocket).toBeDefined();
  });
});
