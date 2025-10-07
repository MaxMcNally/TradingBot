#!/bin/bash

# Test Railway Deployment Script
# This script deploys both API and client services to Railway
# Usage: ./test-railway-deploy.sh [qa|prod]

set -e

# Get environment argument (default to qa)
ENV=${1:-qa}

echo "🚀 Deploying to Railway $ENV environment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check Railway CLI version
echo "📋 Railway CLI version:"
railway --version

# Set Railway environment variables based on environment
echo "🔧 Setting Railway environment variables for $ENV environment..."
if [ -f ".env" ]; then
    source .env
    
    # Set environment-specific variables
    if [ "$ENV" = "qa" ]; then
        RAILWAY_TOKEN_VAR="RAILWAY_TOKEN_QA"
        API_SERVICE="api-qa"
        CLIENT_SERVICE="client-qa"
    elif [ "$ENV" = "prod" ]; then
        RAILWAY_TOKEN_VAR="RAILWAY_TOKEN_PROD"
        API_SERVICE="api"
        CLIENT_SERVICE="client"
    else
        echo "❌ Invalid environment. Use 'qa' or 'prod'"
        exit 1
    fi
    
    # Get the token value
    RAILWAY_TOKEN_VALUE=$(eval echo \$$RAILWAY_TOKEN_VAR)
    
    echo "$RAILWAY_TOKEN_VAR is set: $([ -n "$RAILWAY_TOKEN_VALUE" ] && echo "YES" || echo "NO")"
    echo "RAILWAY_PROJECT_ID is set: $([ -n "$RAILWAY_PROJECT_ID" ] && echo "YES" || echo "NO")"
    
    if [ -n "$RAILWAY_TOKEN_VALUE" ]; then
        echo "$RAILWAY_TOKEN_VAR length: ${#RAILWAY_TOKEN_VALUE}"
        echo "$RAILWAY_TOKEN_VAR starts with: ${RAILWAY_TOKEN_VALUE:0:10}..."
        export RAILWAY_TOKEN=$RAILWAY_TOKEN_VALUE
    else
        echo "❌ $RAILWAY_TOKEN_VAR not found in .env file"
        exit 1
    fi
    
    if [ -n "$RAILWAY_PROJECT_ID" ]; then
        export RAILWAY_PROJECT_ID=$RAILWAY_PROJECT_ID
    else
        echo "❌ RAILWAY_PROJECT_ID not found in .env file"
        exit 1
    fi
else
    echo "❌ .env file not found. Please create one with your Railway tokens."
    exit 1
fi

# Set Railway environment and test authentication
echo "🌍 Setting Railway environment to $ENV and testing authentication..."
if railway environment $ENV && railway whoami &> /dev/null; then
    echo "✅ Railway authentication successful"
    railway whoami
else
    echo "❌ Railway authentication failed"
    echo ""
    echo "This usually means you have User Tokens instead of Project Tokens."
    echo "Project Tokens should start with 'railway_' prefix."
    echo "Your token starts with: ${RAILWAY_TOKEN_VALUE:0:10}..."
    echo ""
    echo "To fix this:"
    echo "1. Go to Railway Dashboard → Your Project → Settings → Tokens"
    echo "2. Create a new 'Project Token' (not User Token)"
    echo "3. Copy the token (should start with 'railway_')"
    echo "4. Update your .env file with the Project Token"
    echo ""
    echo "Alternatively, you can try interactive login:"
    echo "railway login"
    exit 1
fi

# Test Railway project status
echo "📊 Checking Railway project status..."
if railway status &> /dev/null; then
    echo "✅ Railway project status check successful"
    railway status
else
    echo "❌ Railway project status check failed"
    echo "Please check your RAILWAY_PROJECT_ID in the .env file"
    exit 1
fi

# Deploy both API and client services
echo "🚀 Deploying both API and client services to Railway..."
echo "API Service: $API_SERVICE"
echo "Client Service: $CLIENT_SERVICE"

# Ask for confirmation
read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying API service..."
    railway up --service $API_SERVICE
    
    echo "🚀 Deploying client service..."
    railway up --service $CLIENT_SERVICE
    
    echo "✅ Both services deployed successfully!"
    echo ""
    echo "You can check the deployment status at:"
    echo "https://railway.app/dashboard"
else
    echo "⏭️ Skipping deployment"
fi

echo "✅ Railway deployment script completed!"
echo ""
echo "Usage examples:"
echo "  ./test-railway-deploy.sh qa    # Deploy to QA environment"
echo "  ./test-railway-deploy.sh prod  # Deploy to production environment"
