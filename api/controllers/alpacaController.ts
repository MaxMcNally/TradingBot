import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import AlpacaCredential from "../models/AlpacaCredential";
import { alpacaPaperTradeService } from "../services/alpacaPaperTradeService";
import { isEncryptionKeyConfigured } from "../utils/secretManager";

const requireUser = (req: AuthenticatedRequest, res: Response): number | null => {
  if (!req.user?.id) {
    res.status(401).json({ message: "Authentication required" });
    return null;
  }
  return req.user.id;
};

export const getAlpacaStatus = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const record = await AlpacaCredential.getByUser(userId);
  res.json({
    enabled: alpacaPaperTradeService.isPaperTradingAllowed(),
    status: record
      ? {
          connected: true,
          paperOnly: record.is_paper_only,
          keyLastFour: record.key_last4,
          updatedAt: record.updated_at,
        }
      : {
          connected: false,
        },
  });
};

export const connectAlpaca = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  if (!alpacaPaperTradeService.isPaperTradingAllowed()) {
    return res.status(403).json({ message: alpacaPaperTradeService.getDisabledReason() });
  }

  if (!isEncryptionKeyConfigured()) {
    return res.status(500).json({ message: "Server is missing CREDENTIALS_ENCRYPTION_KEY env var." });
  }

  const { apiKey, apiSecret, isPaperOnly = true, skipVerification = false } = req.body || {};

  if (!apiKey || !apiSecret) {
    return res.status(400).json({ message: "Both apiKey and apiSecret are required." });
  }

  if (!isPaperOnly) {
    return res.status(400).json({ message: "Only Alpaca paper trading keys are supported today." });
  }

  if (!skipVerification) {
    const validation = await alpacaPaperTradeService.verifyCredentials(apiKey, apiSecret);
    if (!validation.success) {
      return res.status(validation.status || 400).json({ message: validation.message || "Failed to verify credentials." });
    }
  }

  const stored = await AlpacaCredential.upsert(userId, { apiKey, apiSecret, isPaperOnly });

  res.json({
    message: "Alpaca paper trading connected.",
    status: {
      connected: true,
      keyLastFour: stored.key_last4,
      updatedAt: stored.updated_at,
    },
  });
};

export const disconnectAlpaca = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  await AlpacaCredential.deleteForUser(userId);
  res.json({ message: "Alpaca integration disconnected." });
};

export const testAlpacaConnection = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  if (!alpacaPaperTradeService.isPaperTradingAllowed()) {
    return res.status(403).json({ message: alpacaPaperTradeService.getDisabledReason() });
  }

  const { apiKey, apiSecret } = req.body || {};
  let key = apiKey;
  let secret = apiSecret;

  if (!key || !secret) {
    const stored = await AlpacaCredential.getDecryptedCredentials(userId);
    if (!stored) {
      return res.status(404).json({ message: "No stored credentials to test." });
    }
    key = stored.apiKey;
    secret = stored.apiSecret;
  }

  const result = await alpacaPaperTradeService.verifyCredentials(key, secret);
  if (!result.success) {
    return res.status(result.status || 400).json({ message: result.message || "Verification failed." });
  }

  res.json({
    message: "Alpaca connection verified.",
    account: result.data,
  });
};
