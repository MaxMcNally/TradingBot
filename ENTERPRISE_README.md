# Enterprise Tier Features

This document provides comprehensive documentation for Enterprise tier features, including the Enterprise API, API key management, and webhook integrations.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [API Key Management](#api-key-management)
- [Enterprise API](#enterprise-api)
- [Webhooks](#webhooks)
- [Examples](#examples)
- [Security](#security)
- [Rate Limits](#rate-limits)
- [Support](#support)

## Overview

Enterprise tier provides programmatic access to your trading bots through a RESTful API. With Enterprise features, you can:

- **Programmatically manage bots**: Start, stop, and monitor trading bots via API
- **Access performance data**: Retrieve bot statistics, performance metrics, and trading history
- **Real-time notifications**: Subscribe to webhook events for bot lifecycle and trade execution
- **No PII exposure**: All API responses exclude personally identifiable information (email, username, user ID)

## Getting Started

### Prerequisites

- Active Enterprise tier subscription
- Access to the Developer Dashboard in Settings

### Step 1: Create an API Key

1. Navigate to **Settings** → **Developer Dashboard**
2. Click on the **API Keys** tab
3. Click **Create API Key**
4. Enter a descriptive name for your API key
5. **Important**: Copy and save both the API Key and API Secret immediately. The secret will not be shown again.

### Step 2: Authenticate API Requests

Include your API key in all requests using one of these methods:

**Option 1: X-API-Key Header (Recommended)**
```bash
curl -H "X-API-Key: your_api_key_here" \
     https://api.example.com/api/enterprise/bots
```

**Option 2: Bearer Token**
```bash
curl -H "Authorization: Bearer your_api_key_here" \
     https://api.example.com/api/enterprise/bots
```

### Step 3: Make Your First API Call

```bash
curl -H "X-API-Key: your_api_key_here" \
     https://api.example.com/api/enterprise/stats
```

## API Key Management

### Creating API Keys

API keys are scoped to your Enterprise account and provide full access to the Enterprise API. Each key can be given a descriptive name for easy identification.

**Best Practices:**
- Use descriptive names (e.g., "Production API", "Development Testing")
- Rotate keys periodically for security
- Never commit API keys to version control
- Use different keys for different environments

### Viewing API Keys

You can view all your API keys in the Developer Dashboard. The dashboard shows:
- Key name
- Key prefix (first 8 characters for identification)
- Last used timestamp
- Creation date

**Note**: The full API key and secret are only shown once during creation. Store them securely.

### Deleting API Keys

To revoke access, simply delete the API key from the Developer Dashboard. This action cannot be undone.

## Enterprise API

### Base URL

```
https://api.example.com/api/enterprise
```

For local development:
```
http://localhost:8001/api/enterprise
```

### Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Endpoints

#### Get All Bots

Retrieve a list of all your trading bots (trading sessions).

**Endpoint:** `GET /enterprise/bots`

**Query Parameters:**
- `limit` (optional): Maximum number of bots to return (default: 50, max: 1000)

**Example Request:**
```bash
curl -H "X-API-Key: your_api_key" \
     "https://api.example.com/api/enterprise/bots?limit=10"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "ACTIVE",
      "mode": "PAPER",
      "start_time": "2024-01-15T10:00:00Z",
      "end_time": null,
      "initial_cash": 10000,
      "final_cash": null,
      "total_trades": 25,
      "winning_trades": 18,
      "total_pnl": 1250.50,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Get Active Bot

Retrieve information about your currently active bot.

**Endpoint:** `GET /enterprise/bots/active`

**Example Request:**
```bash
curl -H "X-API-Key: your_api_key" \
     "https://api.example.com/api/enterprise/bots/active"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "ACTIVE",
    "mode": "PAPER",
    "start_time": "2024-01-15T10:00:00Z",
    "initial_cash": 10000,
    "total_trades": 25,
    "winning_trades": 18,
    "total_pnl": 1250.50
  }
}
```

**Error Response (No Active Bot):**
```json
{
  "success": false,
  "error": "No active bot found"
}
```

#### Get Bot by ID

Retrieve detailed information about a specific bot, including all trades.

**Endpoint:** `GET /enterprise/bots/:botId`

**Example Request:**
```bash
curl -H "X-API-Key: your_api_key" \
     "https://api.example.com/api/enterprise/bots/1"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "COMPLETED",
    "mode": "PAPER",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T18:00:00Z",
    "initial_cash": 10000,
    "final_cash": 11250.50,
    "total_trades": 50,
    "winning_trades": 35,
    "total_pnl": 1250.50,
    "created_at": "2024-01-15T10:00:00Z",
    "trades": [
      {
        "id": 1,
        "symbol": "AAPL",
        "action": "BUY",
        "quantity": 10,
        "price": 150.25,
        "timestamp": "2024-01-15T10:05:00Z",
        "pnl": null
      },
      {
        "id": 2,
        "symbol": "AAPL",
        "action": "SELL",
        "quantity": 10,
        "price": 152.50,
        "timestamp": "2024-01-15T11:30:00Z",
        "pnl": 22.50
      }
    ]
  }
}
```

#### Start Bot

Create and start a new trading bot.

**Endpoint:** `POST /enterprise/bots`

**Request Body:**
```json
{
  "mode": "PAPER",
  "initialCash": 10000,
  "symbols": ["AAPL", "GOOGL", "MSFT"],
  "strategy": "MovingAverage",
  "scheduledEndTime": "2024-01-16T18:00:00Z"
}
```

**Parameters:**
- `mode` (required): Trading mode - `"PAPER"` or `"LIVE"`
- `initialCash` (required): Starting capital amount
- `symbols` (required): Array of stock symbols to trade
- `strategy` (required): Strategy name to use
- `scheduledEndTime` (optional): ISO 8601 timestamp for automatic bot stop

**Example Request:**
```bash
curl -X POST \
     -H "X-API-Key: your_api_key" \
     -H "Content-Type: application/json" \
     -d '{
       "mode": "PAPER",
       "initialCash": 10000,
       "symbols": ["AAPL", "GOOGL"],
       "strategy": "MovingAverage"
     }' \
     "https://api.example.com/api/enterprise/bots"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "status": "ACTIVE",
    "mode": "PAPER",
    "start_time": "2024-01-15T14:00:00Z",
    "initial_cash": 10000
  }
}
```

**Error Response (Active Bot Exists):**
```json
{
  "success": false,
  "error": "User already has an active trading session",
  "activeBotId": 1
}
```

#### Stop Bot

Stop a running trading bot.

**Endpoint:** `POST /enterprise/bots/:botId/stop`

**Example Request:**
```bash
curl -X POST \
     -H "X-API-Key: your_api_key" \
     "https://api.example.com/api/enterprise/bots/1/stop"
```

**Example Response:**
```json
{
  "success": true,
  "message": "Bot stopped successfully"
}
```

#### Get Performance Metrics

Retrieve performance metrics for all your trading strategies and sessions.

**Endpoint:** `GET /enterprise/performance`

**Query Parameters:**
- `limit` (optional): Maximum number of records to return (default: 50)

**Example Request:**
```bash
curl -H "X-API-Key: your_api_key" \
     "https://api.example.com/api/enterprise/performance?limit=20"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "strategy_name": "MovingAverage",
      "strategy_type": "TrendFollowing",
      "execution_type": "LIVE_TRADING",
      "session_id": 1,
      "symbols": ["AAPL", "GOOGL"],
      "start_date": "2024-01-15",
      "end_date": "2024-01-16",
      "initial_capital": 10000,
      "final_capital": 11250.50,
      "total_return": 12.5,
      "total_return_dollar": 1250.50,
      "max_drawdown": 5.2,
      "sharpe_ratio": 1.85,
      "sortino_ratio": 2.10,
      "win_rate": 70.0,
      "total_trades": 50,
      "winning_trades": 35,
      "losing_trades": 15,
      "avg_win": 45.50,
      "avg_loss": -25.30,
      "profit_factor": 2.15,
      "largest_win": 125.00,
      "largest_loss": -50.00,
      "created_at": "2024-01-16T18:00:00Z"
    }
  ]
}
```

#### Get Stats Summary

Retrieve aggregate statistics across all your bots.

**Endpoint:** `GET /enterprise/stats`

**Example Request:**
```bash
curl -H "X-API-Key: your_api_key" \
     "https://api.example.com/api/enterprise/stats"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "total_bots": 10,
    "active_bots": 1,
    "total_trades": 500,
    "total_winning_trades": 325,
    "win_rate": 65.0,
    "total_pnl": 12500.75,
    "average_return": 12.5,
    "average_win_rate": 65.0
  }
}
```

## Webhooks

Webhooks allow you to receive real-time notifications when events occur in your trading bots.

### Setting Up Webhooks

1. Navigate to **Settings** → **Developer Dashboard** → **Webhooks** tab
2. Click **Add Webhook**
3. Enter your webhook URL (must be HTTPS in production)
4. Select the event types you want to subscribe to
5. (Optional) Enter a webhook secret for payload signing
6. Click **Create**

### Webhook Events

#### Available Events

- **`bot.started`**: Fired when a bot starts trading
- **`bot.finished`**: Fired when a bot completes or is stopped
- **`bot.error`**: Fired when a bot encounters an error
- **`trade.executed`**: Fired when a trade is executed

### Webhook Payload Format

All webhook payloads follow this structure:

```json
{
  "event_type": "bot.started",
  "timestamp": "2024-01-15T10:00:00Z",
  "bot_id": 1,
  "data": {
    // Event-specific data
  }
}
```

### Event-Specific Payloads

#### bot.started

```json
{
  "event_type": "bot.started",
  "timestamp": "2024-01-15T10:00:00Z",
  "bot_id": 1,
  "data": {
    "status": "ACTIVE",
    "mode": "PAPER",
    "start_time": "2024-01-15T10:00:00Z",
    "initial_cash": 10000
  }
}
```

#### bot.finished

```json
{
  "event_type": "bot.finished",
  "timestamp": "2024-01-15T18:00:00Z",
  "bot_id": 1,
  "data": {
    "status": "COMPLETED",
    "mode": "PAPER",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T18:00:00Z",
    "initial_cash": 10000,
    "final_cash": 11250.50,
    "total_trades": 50,
    "winning_trades": 35,
    "total_pnl": 1250.50,
    "performance": {
      "total_return": 12.5,
      "win_rate": 70.0,
      "sharpe_ratio": 1.85
      // ... additional performance metrics
    }
  }
}
```

#### bot.error

```json
{
  "event_type": "bot.error",
  "timestamp": "2024-01-15T12:00:00Z",
  "bot_id": 1,
  "data": {
    "error_message": "Connection timeout",
    "error_stack": "Error: Connection timeout\n    at ...",
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

#### trade.executed

```json
{
  "event_type": "trade.executed",
  "timestamp": "2024-01-15T10:05:00Z",
  "bot_id": 1,
  "data": {
    "trade_id": 123,
    "symbol": "AAPL",
    "action": "BUY",
    "quantity": 10,
    "price": 150.25,
    "timestamp": "2024-01-15T10:05:00Z",
    "pnl": null
  }
}
```

### Webhook Security

#### Signature Verification

If you configure a webhook secret, all payloads will be signed using HMAC SHA256. The signature is included in the `X-Webhook-Signature` header:

```
X-Webhook-Signature: sha256=<signature>
```

**Verification Example (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  const expectedSignature = `sha256=${digest}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Verification Example (Python):**
```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    digest = hmac.new(
        secret.encode('utf-8'),
        json.dumps(payload).encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    expected_signature = f"sha256={digest}"
    return hmac.compare_digest(signature, expected_signature)
```

### Webhook Delivery

- Webhooks are sent via HTTP POST requests
- Your endpoint must respond with a 2xx status code within 10 seconds
- Failed deliveries are logged but not retried automatically
- Webhook events are logged in the `webhook_events` table for audit purposes

### Managing Webhooks

- **Toggle Active/Inactive**: Temporarily disable webhooks without deleting them
- **Edit**: Update webhook URL, event types, or secret
- **Delete**: Permanently remove a webhook

## Examples

### Complete Bot Lifecycle

```bash
# 1. Start a bot
BOT_RESPONSE=$(curl -X POST \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "PAPER",
    "initialCash": 10000,
    "symbols": ["AAPL", "GOOGL"],
    "strategy": "MovingAverage"
  }' \
  "https://api.example.com/api/enterprise/bots")

BOT_ID=$(echo $BOT_RESPONSE | jq -r '.data.id')

# 2. Monitor the bot
curl -H "X-API-Key: your_api_key" \
     "https://api.example.com/api/enterprise/bots/$BOT_ID"

# 3. Stop the bot
curl -X POST \
     -H "X-API-Key: your_api_key" \
     "https://api.example.com/api/enterprise/bots/$BOT_ID/stop"

# 4. Get final performance
curl -H "X-API-Key: your_api_key" \
     "https://api.example.com/api/enterprise/performance"
```

### Python SDK Example

```python
import requests

API_KEY = "your_api_key_here"
BASE_URL = "https://api.example.com/api/enterprise"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Start a bot
response = requests.post(
    f"{BASE_URL}/bots",
    headers=headers,
    json={
        "mode": "PAPER",
        "initialCash": 10000,
        "symbols": ["AAPL", "GOOGL"],
        "strategy": "MovingAverage"
    }
)
bot = response.json()["data"]
bot_id = bot["id"]

# Get bot status
response = requests.get(
    f"{BASE_URL}/bots/{bot_id}",
    headers=headers
)
bot_details = response.json()["data"]

# Stop the bot
response = requests.post(
    f"{BASE_URL}/bots/{bot_id}/stop",
    headers=headers
)
```

### Webhook Handler Example (Node.js)

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.use(express.json());

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;

  // Verify signature
  if (WEBHOOK_SECRET) {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = hmac.update(JSON.stringify(payload)).digest('hex');
    const expectedSignature = `sha256=${digest}`;
    
    if (signature !== expectedSignature) {
      return res.status(401).send('Invalid signature');
    }
  }

  // Handle event
  switch (payload.event_type) {
    case 'bot.started':
      console.log(`Bot ${payload.bot_id} started`);
      break;
    case 'bot.finished':
      console.log(`Bot ${payload.bot_id} finished with PnL: ${payload.data.total_pnl}`);
      break;
    case 'trade.executed':
      console.log(`Trade: ${payload.data.action} ${payload.data.quantity} ${payload.data.symbol}`);
      break;
  }

  res.status(200).send('OK');
});

app.listen(3000);
```

## Security

### API Key Security

- **Never expose API keys**: Keep keys secure and never commit them to version control
- **Use environment variables**: Store keys in environment variables or secure secret management systems
- **Rotate regularly**: Periodically rotate API keys for enhanced security
- **Monitor usage**: Check the "Last Used" timestamp regularly for suspicious activity

### Webhook Security

- **Use HTTPS**: Always use HTTPS endpoints for webhooks in production
- **Verify signatures**: Always verify webhook signatures when a secret is configured
- **Validate payloads**: Validate all incoming webhook payloads before processing
- **Idempotency**: Design webhook handlers to be idempotent (safe to process multiple times)

### Best Practices

1. **Rate Limiting**: Implement rate limiting in your API clients
2. **Error Handling**: Always handle errors gracefully
3. **Logging**: Log all API interactions for audit purposes
4. **Monitoring**: Set up monitoring for webhook delivery failures

## Rate Limits

Currently, Enterprise API has generous rate limits. If you need higher limits, please contact support.

## Support

For Enterprise tier support:

- **Documentation**: Check the Developer Dashboard → API Documentation tab
- **Issues**: Contact your dedicated success manager
- **Feature Requests**: Submit through your account representative

---

**Last Updated**: January 2024
**API Version**: 1.0

