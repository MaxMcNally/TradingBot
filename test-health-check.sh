#!/bin/bash

# Health Check Test Script
# This script helps debug Railway deployment health check issues

set -e

echo "🔍 Railway Health Check Debug Script"
echo "====================================="

# Get the deployment URL
echo "📋 Getting Railway deployment URL..."
if [ -f ".env" ]; then
    source .env
    
    # Set environment-specific variables
    ENV=${1:-qa}
    if [ "$ENV" = "qa" ]; then
        RAILWAY_TOKEN_VAR="RAILWAY_TOKEN_QA"
        SERVICE_NAME="api-qa"
    elif [ "$ENV" = "prod" ]; then
        RAILWAY_TOKEN_VAR="RAILWAY_TOKEN_PROD"
        SERVICE_NAME="api"
    else
        echo "❌ Invalid environment. Use 'qa' or 'prod'"
        exit 1
    fi
    
    RAILWAY_TOKEN_VALUE=$(eval echo \$$RAILWAY_TOKEN_VAR)
    export RAILWAY_TOKEN=$RAILWAY_TOKEN_VALUE
    
    # Set environment and get domain
    railway environment $ENV
    DOMAIN=$(railway domain --service $SERVICE_NAME 2>/dev/null || echo "No domain found")
    
    if [ "$DOMAIN" != "No domain found" ]; then
        echo "🌐 Deployment URL: https://$DOMAIN"
        echo ""
        
        # Test the health check endpoint
        echo "🏥 Testing health check endpoint..."
        echo "Testing: https://$DOMAIN/ping"
        
        # Test with curl
        if command -v curl &> /dev/null; then
            echo "Using curl to test..."
            curl -f -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
                "https://$DOMAIN/ping" || echo "❌ Health check failed"
        else
            echo "❌ curl not found. Please install curl to test health checks."
        fi
        
        echo ""
        echo "📊 Additional debugging info:"
        echo "- Check Railway logs: railway logs --service $SERVICE_NAME"
        echo "- Check Railway status: railway status"
        echo "- Check environment variables: railway variables --service $SERVICE_NAME"
        
    else
        echo "❌ No domain found for service $SERVICE_NAME"
        echo "The deployment might not be complete yet."
    fi
else
    echo "❌ .env file not found. Please create one with your Railway tokens."
    exit 1
fi

echo ""
echo "🔧 Common health check issues:"
echo "1. Missing environment variables (JWT_SECRET, DATABASE_URL, etc.)"
echo "2. Database connection failures"
echo "3. Application not starting on the correct port"
echo "4. Missing dependencies or build errors"
echo "5. Application crashes during startup"
