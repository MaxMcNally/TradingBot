#!/bin/bash

# Railway Setup Script
# This script helps set up Railway for the first time

set -e

echo "🚀 Setting up Railway for Trading Bot..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed successfully!"
else
    echo "✅ Railway CLI already installed"
fi

# Check if user is logged in
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
else
    echo "✅ Already logged in to Railway"
    railway whoami
fi

# Create or link project
echo "📦 Setting up Railway project..."
if [ ! -f ".railway/project.json" ]; then
    echo "Creating new Railway project..."
    railway project new
    echo "✅ New Railway project created!"
else
    echo "✅ Using existing Railway project"
fi

# Add Redis service
echo "🗄️ Adding Redis service..."
if ! railway service list | grep -q "redis"; then
    railway add redis
    echo "✅ Redis service added!"
else
    echo "✅ Redis service already exists"
fi

# Set basic environment variables
echo "🔧 Setting up basic environment variables..."
railway variables set NODE_ENV=production
railway variables set TRADING_MODE=paper
railway variables set LOG_LEVEL=info

echo "✅ Basic environment variables set!"

echo ""
echo "🎉 Railway setup complete!"
echo ""
echo "Next steps:"
echo "1. Set your API keys: railway variables set ALPHA_VANTAGE_API_KEY=your-key"
echo "2. Set your JWT secret: railway variables set JWT_SECRET=your-secret"
echo "3. Deploy your app: yarn railway:deploy"
echo "4. Check logs: yarn railway:logs"
echo ""
echo "📊 Manage your project at: https://railway.app/dashboard"
