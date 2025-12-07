import https from "https";
import { URL } from "url";
import AlpacaCredential from "../models/AlpacaCredential";
import { isEncryptionKeyConfigured } from "../utils/secretManager";

export interface AlpacaOrderRequest {
  symbol: string;
  qty: number;
  side: "buy" | "sell";
  type?: "market" | "limit";
  time_in_force?: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
  limit_price?: number;
}

export interface AlpacaServiceResult<T = any> {
  success: boolean;
  status?: number;
  message?: string;
  data?: T;
  skipped?: boolean;
}

const allowedEnvs = new Set(["development", "dev", "staging", "stage", "stg", "test"]);

class AlpacaPaperTradeService {
  private baseHost = "paper-api.alpaca.markets";

  isPaperTradingAllowed(): boolean {
    const env = (process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
    return allowedEnvs.has(env);
  }

  getDisabledReason(): string {
    return "Alpaca paper trading is only available in development or staging environments.";
  }

  async forwardSignal(userId: number, order: AlpacaOrderRequest): Promise<AlpacaServiceResult> {
    if (!this.isPaperTradingAllowed()) {
      return { success: false, skipped: true, message: this.getDisabledReason() };
    }

    if (!isEncryptionKeyConfigured()) {
      return { success: false, message: "Server is missing CREDENTIALS_ENCRYPTION_KEY env var." };
    }

    const credentials = await AlpacaCredential.getDecryptedCredentials(userId);
    if (!credentials) {
      return { success: false, skipped: true, message: "No Alpaca credentials on file for user." };
    }

    if (!credentials.isPaperOnly) {
      return { success: false, skipped: true, message: "Only paper trading credentials are supported for now." };
    }

    return this.placeOrder(credentials.apiKey, credentials.apiSecret, order);
  }

  async verifyCredentials(apiKey: string, apiSecret: string): Promise<AlpacaServiceResult> {
    if (!this.isPaperTradingAllowed()) {
      return { success: false, message: this.getDisabledReason() };
    }

    try {
      const data = await this.request(
        "/v2/account",
        "GET",
        apiKey,
        apiSecret
      );
      return {
        success: true,
        status: 200,
        data: {
          account_id: data?.id,
          status: data?.status,
          buying_power: data?.buying_power,
        },
      };
    } catch (error) {
      const err = error as { status?: number; message: string };
      return { success: false, status: err.status, message: err.message };
    }
  }

  private async placeOrder(apiKey: string, apiSecret: string, order: AlpacaOrderRequest): Promise<AlpacaServiceResult> {
    const payload = {
      symbol: order.symbol,
      qty: order.qty,
      side: order.side,
      type: order.type || "market",
      time_in_force: order.time_in_force || "day",
      ...(order.limit_price ? { limit_price: order.limit_price } : {}),
    };

    try {
      const data = await this.request(
        "/v2/orders",
        "POST",
        apiKey,
        apiSecret,
        payload
      );
      return { success: true, status: 200, data };
    } catch (error) {
      const err = error as { status?: number; message: string };
      return { success: false, status: err.status, message: err.message };
    }
  }

  private request(path: string, method: "GET" | "POST", apiKey: string, apiSecret: string, body?: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(`https://${this.baseHost}${path}`);
      const jsonPayload = body ? JSON.stringify(body) : undefined;

      const options: https.RequestOptions = {
        hostname: url.hostname,
        path: url.pathname + (url.search || ""),
        method,
        headers: {
          "APCA-API-KEY-ID": apiKey,
          "APCA-API-SECRET-KEY": apiSecret,
          "Content-Type": "application/json",
          "User-Agent": "paper-trade-bot/1.0",
        },
        timeout: 5000,
      };

      if (jsonPayload) {
        options.headers = {
          ...options.headers,
          "Content-Length": Buffer.byteLength(jsonPayload).toString(),
        };
      }

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          const status = res.statusCode || 500;

          if (status < 200 || status >= 300) {
            let errorMessage = "Alpaca request failed";
            try {
              const parsed = JSON.parse(raw);
              errorMessage = parsed.message || parsed.error || errorMessage;
            } catch {
              if (raw) {
                errorMessage = raw;
              }
            }
            return reject({ status, message: errorMessage });
          }

          if (!raw) {
            return resolve({});
          }

          try {
            const parsed = JSON.parse(raw);
            resolve(parsed);
          } catch (parseError) {
            reject({ status, message: "Failed to parse Alpaca response" });
          }
        });
      });

      req.on("error", (err) => {
        reject({ message: err.message });
      });

      req.on("timeout", () => {
        req.destroy();
        reject({ message: "Alpaca request timed out" });
      });

      if (jsonPayload) {
        req.write(jsonPayload);
      }
      req.end();
    });
  }
}

export const alpacaPaperTradeService = new AlpacaPaperTradeService();
