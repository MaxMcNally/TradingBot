import AlpacaCredential from "../models/AlpacaCredential";
import { alpacaPaperTradeService } from "../services/alpacaPaperTradeService";

jest.mock("../models/AlpacaCredential", () => {
  return {
    __esModule: true,
    default: {
      getDecryptedCredentials: jest.fn(),
    },
  };
});

const mockedGetCredentials = AlpacaCredential.getDecryptedCredentials as jest.Mock;

describe("alpacaPaperTradeService", () => {
  const originalEnv = {
    APP_ENV: process.env.APP_ENV,
    NODE_ENV: process.env.NODE_ENV,
    CREDENTIALS_ENCRYPTION_KEY: process.env.CREDENTIALS_ENCRYPTION_KEY,
  };

  beforeEach(() => {
    mockedGetCredentials.mockReset();
    process.env.CREDENTIALS_ENCRYPTION_KEY = "unit-test-key";
  });

  afterAll(() => {
    if (originalEnv.APP_ENV) {
      process.env.APP_ENV = originalEnv.APP_ENV;
    } else {
      delete process.env.APP_ENV;
    }
    if (originalEnv.NODE_ENV) {
      process.env.NODE_ENV = originalEnv.NODE_ENV;
    } else {
      delete process.env.NODE_ENV;
    }
    if (originalEnv.CREDENTIALS_ENCRYPTION_KEY) {
      process.env.CREDENTIALS_ENCRYPTION_KEY = originalEnv.CREDENTIALS_ENCRYPTION_KEY;
    } else {
      delete process.env.CREDENTIALS_ENCRYPTION_KEY;
    }
  });

  it("skips forwarding trades when environment is not allowed", async () => {
    process.env.APP_ENV = "production";
    const result = await alpacaPaperTradeService.forwardSignal(1, { symbol: "AAPL", qty: 1, side: "buy" });
    expect(result.success).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.message).toMatch(/development or staging/i);
  });

  it("skips forwarding when no credentials are stored", async () => {
    process.env.APP_ENV = "development";
    mockedGetCredentials.mockResolvedValue(null);

    const result = await alpacaPaperTradeService.forwardSignal(42, { symbol: "MSFT", qty: 1, side: "buy" });
    expect(mockedGetCredentials).toHaveBeenCalledWith(42);
    expect(result.success).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.message).toMatch(/No Alpaca credentials/);
  });
});
