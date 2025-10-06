#!/bin/bash

# Railway Deployment Script
# This script helps deploy the trading bot to Railway.app

set -e

echo "🚀 Starting Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Create new project or link to existing
echo "📦 Setting up Railway project..."
if [ ! -f ".railway/project.json" ]; then
    echo "Creating new Railway project..."
    railway project new
else
    echo "Using existing Railway project..."
fi

# Set environment variables
echo "🔧 Setting up environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=8001
railway variables set FRONTEND_URL=https://your-app.railway.app

# Add Redis service
echo "🗄️ Adding Redis service..."
railway add redis

# Deploy the application
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://your-app.railway.app"
echo "📊 Check logs with: railway logs"
echo "🔧 Manage your app at: https://railway.app/dashboard"
