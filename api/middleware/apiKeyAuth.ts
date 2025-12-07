import { Request, Response, RequestHandler } from "express";
import { ApiKey } from "../models/ApiKey";
import { User } from "../models/User";
import { ApiUsageLog } from "../models/ApiUsageLog";

export interface ApiKeyAuthenticatedRequest extends Request {
  apiKey?: {
    id: number;
    user_id: number;
    key_name: string;
  };
  user?: {
    id: number;
    plan_tier?: string;
  };
}

export const authenticateApiKey: RequestHandler = async (req, res, next) => {
  try {
    // Check for API key in header (X-API-Key or Authorization: Bearer <key>)
    const apiKeyHeader = req.headers['x-api-key'] as string;
    const authHeader = req.headers['authorization'] as string;
    
    let apiKey: string | undefined;
    
    if (apiKeyHeader) {
      apiKey = apiKeyHeader;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    }

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Find the API key in database
    const keyData = await ApiKey.findByKey(apiKey);
    
    if (!keyData) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Verify user has ENTERPRISE tier
    const user = await User.findById(keyData.user_id);
    if (!user || user.plan_tier !== 'ENTERPRISE') {
      return res.status(403).json({ error: 'API access requires Enterprise tier subscription' });
    }

    // Update last used timestamp
    await ApiKey.updateLastUsed(keyData.id!);

    // Attach API key info to request
    (req as ApiKeyAuthenticatedRequest).apiKey = {
      id: keyData.id!,
      user_id: keyData.user_id,
      key_name: keyData.key_name
    };

    // Attach user info (without PII)
    (req as ApiKeyAuthenticatedRequest).user = {
      id: user.id!,
      plan_tier: user.plan_tier
    };

    // Log API usage (async, don't block)
    const startTime = Date.now();
    const originalSend = res.send.bind(res);
    
    res.send = function(body: any) {
      const responseTime = Date.now() - startTime;
      const endpoint = req.path;
      const method = req.method;
      const statusCode = res.statusCode;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || null;
      const requestSize = req.headers['content-length'] ? parseInt(req.headers['content-length']) : null;
      const responseSize = body ? JSON.stringify(body).length : null;

      // Log asynchronously (don't block response)
      ApiUsageLog.create({
        api_key_id: keyData.id!,
        user_id: keyData.user_id,
        endpoint,
        method,
        status_code: statusCode,
        response_time_ms: responseTime,
        request_size: requestSize || undefined,
        response_size: responseSize || undefined,
        ip_address: typeof ipAddress === 'string' ? ipAddress : null,
        user_agent: userAgent || undefined,
        error_message: statusCode >= 400 ? (typeof body === 'string' ? body.substring(0, 500) : JSON.stringify(body).substring(0, 500)) : undefined
      }).catch(err => {
        console.error('Error logging API usage:', err);
      });

      return originalSend(body);
    };

    next();
  } catch (error) {
    console.error('Error authenticating API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

