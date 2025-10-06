# Quick Railway Deployment Guide

## 🚀 Manual Deployment Steps

Since we can't do interactive login in this environment, follow these steps:

### 1. Login to Railway
```bash
railway login
```
This will open your browser to authenticate with Railway.

### 2. Create New Project
```bash
railway project new
```
Choose a name for your project (e.g., "trading-bot")

### 3. Add Redis Service
```bash
railway add redis
```

### 4. Set Environment Variables
```bash
# Basic settings
railway variables set NODE_ENV=production
railway variables set TRADING_MODE=paper
railway variables set LOG_LEVEL=info

# Security (generate secure secrets)
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set SESSION_SECRET=$(openssl rand -base64 32)

# API Keys (replace with your actual keys)
railway variables set ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
railway variables set YAHOO_FINANCE_API_KEY=your-yahoo-finance-key
```

### 5. Deploy Your Application
```bash
railway up
```

### 6. Get Your URLs
```bash
railway domain
```

### 7. Set Frontend URL
```bash
# Get your API URL first, then set frontend URL
railway variables set FRONTEND_URL=https://your-app.railway.app
railway variables set REACT_APP_API_URL=https://your-api.railway.app
```

## 🔧 Alternative: Use Railway Dashboard

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Create a new project
3. Connect your GitHub repository
4. Add Redis service
5. Set environment variables in the dashboard
6. Deploy automatically

## 📊 Monitor Your Deployment

```bash
# Check status
railway status

# View logs
railway logs

# Follow logs in real-time
railway logs --follow
```

## 🎯 Expected Results

After deployment, you should have:
- ✅ API service running on Railway
- ✅ Redis cache service
- ✅ Automatic HTTPS
- ✅ Environment variables configured
- ✅ Health checks working

## 🆘 Troubleshooting

### If deployment fails:
1. Check logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Check build logs in Railway dashboard

### If API is not accessible:
1. Verify PORT is set to 8001
2. Check health check endpoint: `/ping`
3. Ensure all dependencies are in package.json

## 🎉 Next Steps

1. **Test your API**: Visit `https://your-app.railway.app/ping`
2. **Deploy frontend**: Either serve from API or deploy separately
3. **Set up monitoring**: Configure alerts in Railway dashboard
4. **Add custom domain**: Configure in Railway settings

## 📱 Quick Commands Reference

```bash
# Deploy
railway up

# Check status
railway status

# View logs
railway logs

# Open dashboard
railway open

# Get domain
railway domain

# Set variable
railway variables set KEY=value

# List variables
railway variables
```
