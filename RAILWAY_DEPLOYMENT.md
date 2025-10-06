# Railway Deployment Guide

This guide will help you deploy your Trading Bot application to Railway.app.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install the Railway CLI
3. **GitHub Repository**: Your code should be in a GitHub repository

## Quick Start

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

### 3. Deploy Your Application

```bash
# Option 1: Use the deployment script
yarn railway:deploy

# Option 2: Manual deployment
railway project new
railway up
```

## Detailed Setup

### 1. Create Railway Project

```bash
# Create a new project
railway project new

# Or link to existing project
railway link
```

### 2. Add Services

Your trading bot needs multiple services:

#### API Service (Main)
```bash
# Deploy the main API service
railway up
```

#### Redis Service
```bash
# Add Redis for caching
railway add redis
```

#### PostgreSQL Database (Optional)
```bash
# Add PostgreSQL if you want to migrate from SQLite
railway add postgresql
```

### 3. Configure Environment Variables

Set these environment variables in Railway dashboard or via CLI:

```bash
# Application settings
railway variables set NODE_ENV=production
railway variables set PORT=8001

# Frontend URL (update with your actual Railway URL)
railway variables set FRONTEND_URL=https://your-app.railway.app
railway variables set REACT_APP_API_URL=https://your-api.railway.app

# Trading Bot settings
railway variables set TRADING_MODE=paper
railway variables set LOG_LEVEL=info

# Security (generate secure secrets)
railway variables set JWT_SECRET=your-secure-jwt-secret
railway variables set SESSION_SECRET=your-secure-session-secret

# API Keys (add your actual keys)
railway variables set ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
railway variables set YAHOO_FINANCE_API_KEY=your-yahoo-finance-key
```

### 4. Deploy Frontend (Separate Service)

For the React frontend, you have two options:

#### Option A: Deploy as Separate Service
```bash
# In the client directory
cd client
railway up
```

#### Option B: Serve Static Files from API
The API can serve the built React files directly.

## Project Structure

```
your-railway-project/
├── api-service/          # Main API service
├── redis-service/        # Redis cache
├── postgresql-service/   # Database (optional)
└── client-service/       # React frontend (optional)
```

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | API server port | Yes | `8001` |
| `DATABASE_URL` | Database connection | Auto | Railway provides |
| `REDIS_URL` | Redis connection | Auto | Railway provides |
| `FRONTEND_URL` | Frontend URL | Yes | Your Railway URL |
| `REACT_APP_API_URL` | API URL for frontend | Yes | Your API Railway URL |
| `TRADING_MODE` | Trading mode | No | `paper` |
| `LOG_LEVEL` | Logging level | No | `info` |
| `JWT_SECRET` | JWT signing secret | Yes | Generate secure |
| `SESSION_SECRET` | Session secret | Yes | Generate secure |

## Deployment Commands

```bash
# Deploy to Railway
yarn railway:deploy

# Check deployment status
yarn railway:status

# View logs
yarn railway:logs

# Open Railway dashboard
railway open
```

## Monitoring and Management

### View Logs
```bash
railway logs
railway logs --follow  # Follow logs in real-time
```

### Check Status
```bash
railway status
```

### Access Dashboard
```bash
railway open
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Dockerfile syntax
   - Ensure all dependencies are in package.json
   - Verify build commands in package.json

2. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names match your code
   - Verify no typos in variable values

3. **Database Connection**
   - Railway provides DATABASE_URL automatically
   - Update your code to use DATABASE_URL instead of hardcoded paths

4. **Redis Connection**
   - Railway provides REDIS_URL automatically
   - Ensure your code uses REDIS_URL environment variable

### Debug Commands

```bash
# Check Railway CLI version
railway --version

# Check project status
railway status

# View detailed logs
railway logs --json

# Connect to service shell
railway shell
```

## Cost Management

Railway's free tier includes:
- $5 credit monthly
- Usually enough for small applications
- Monitor usage in Railway dashboard

## Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **JWT Secrets**: Use strong, random secrets
3. **API Keys**: Store in Railway environment variables
4. **HTTPS**: Railway provides HTTPS by default
5. **Database**: Use Railway's managed databases

## Next Steps

1. **Set up monitoring**: Configure alerts in Railway dashboard
2. **Set up CI/CD**: Connect GitHub for automatic deployments
3. **Custom domain**: Add your own domain in Railway settings
4. **Scaling**: Monitor usage and upgrade if needed

## Support

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway GitHub](https://github.com/railwayapp)
