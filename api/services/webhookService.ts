import axios from 'axios';
import crypto from 'crypto';
import { Webhook, WebhookEventType } from '../models/Webhook';
import { db } from '../initDb';

export interface WebhookPayload {
  event_type: WebhookEventType;
  timestamp: string;
  bot_id?: number;
  data: any;
}

export class WebhookService {
  /**
   * Send webhook event to all active webhooks subscribed to the event type
   */
  static async sendWebhookEvent(
    userId: number,
    eventType: WebhookEventType,
    data: any
  ): Promise<void> {
    try {
      // Find all active webhooks for this user subscribed to this event
      const webhooks = await Webhook.findByUserIdAndEventType(userId, eventType);

      if (webhooks.length === 0) {
        return; // No webhooks to send
      }

      const payload: WebhookPayload = {
        event_type: eventType,
        timestamp: new Date().toISOString(),
        data
      };

      // Add bot_id if present in data
      if (data.bot_id || data.session_id) {
        payload.bot_id = data.bot_id || data.session_id;
      }

      // Send to all webhooks in parallel
      const promises = webhooks.map(webhook => 
        this.sendToWebhook(webhook, payload)
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error sending webhook event:', error);
      // Don't throw - webhooks should not break the main flow
    }
  }

  /**
   * Send webhook to a specific endpoint
   */
  private static async sendToWebhook(
    webhook: any,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      let body = JSON.stringify(payload);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'TradingBot-Webhook/1.0'
      };

      // Sign payload if secret is provided
      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(body)
          .digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      // Send webhook with timeout
      const response = await axios.post(webhook.url, body, {
        headers,
        timeout: 10000, // 10 second timeout
        validateStatus: () => true // Don't throw on any status
      });

      // Log the webhook event
      await this.logWebhookEvent(
        webhook.id!,
        payload.event_type,
        payload,
        response.status,
        response.data,
        response.status >= 200 && response.status < 300 ? null : `HTTP ${response.status}`
      );

      // Update last triggered timestamp
      await Webhook.updateLastTriggered(webhook.id!);

      if (response.status >= 200 && response.status < 300) {
        console.log(`Webhook sent successfully to ${webhook.url}`);
      } else {
        console.warn(`Webhook returned status ${response.status} for ${webhook.url}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      console.error(`Error sending webhook to ${webhook.url}:`, errorMessage);

      // Log failed webhook event
      await this.logWebhookEvent(
        webhook.id!,
        payload.event_type,
        payload,
        null,
        null,
        errorMessage
      );
    }
  }

  /**
   * Log webhook event to database
   */
  private static async logWebhookEvent(
    webhookId: number,
    eventType: string,
    payload: WebhookPayload,
    responseCode: number | null,
    responseBody: any,
    errorMessage: string | null
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const status = errorMessage ? 'FAILED' : (responseCode && responseCode >= 200 && responseCode < 300 ? 'SUCCESS' : 'FAILED');
      
      db.run(
        `INSERT INTO webhook_events (webhook_id, event_type, payload, status, response_code, response_body, error_message, created_at, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          webhookId,
          eventType,
          JSON.stringify(payload),
          status,
          responseCode,
          responseBody ? JSON.stringify(responseBody) : null,
          errorMessage
        ],
        (err: any) => {
          if (err) {
            console.error('Error logging webhook event:', err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Send bot started event
   */
  static async sendBotStartedEvent(
    userId: number,
    sessionId: number,
    sessionData: any
  ): Promise<void> {
    await this.sendWebhookEvent(userId, 'bot.started', {
      bot_id: sessionId,
      status: sessionData.status,
      mode: sessionData.mode,
      start_time: sessionData.start_time,
      initial_cash: sessionData.initial_cash
    });
  }

  /**
   * Send bot finished event
   */
  static async sendBotFinishedEvent(
    userId: number,
    sessionId: number,
    sessionData: any,
    performanceData?: any
  ): Promise<void> {
    await this.sendWebhookEvent(userId, 'bot.finished', {
      bot_id: sessionId,
      status: sessionData.status,
      mode: sessionData.mode,
      start_time: sessionData.start_time,
      end_time: sessionData.end_time,
      initial_cash: sessionData.initial_cash,
      final_cash: sessionData.final_cash,
      total_trades: sessionData.total_trades,
      winning_trades: sessionData.winning_trades,
      total_pnl: sessionData.total_pnl,
      performance: performanceData || null
    });
  }

  /**
   * Send bot error event
   */
  static async sendBotErrorEvent(
    userId: number,
    sessionId: number | null,
    error: Error
  ): Promise<void> {
    await this.sendWebhookEvent(userId, 'bot.error', {
      bot_id: sessionId,
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send trade executed event
   */
  static async sendTradeExecutedEvent(
    userId: number,
    tradeData: any
  ): Promise<void> {
    await this.sendWebhookEvent(userId, 'trade.executed', {
      trade_id: tradeData.id,
      symbol: tradeData.symbol,
      action: tradeData.action,
      quantity: tradeData.quantity,
      price: tradeData.price,
      timestamp: tradeData.timestamp,
      pnl: tradeData.pnl
    });
  }
}

export default WebhookService;

