#!/bin/bash

# Full Pipeline Test Script
# This script runs all the CI/CD pipeline steps locally to catch issues before pushing
# Usage: ./test-full-pipeline.sh

set -e

echo "🚀 Running full CI/CD pipeline test locally..."
echo "This will test all the same steps that CircleCI runs."
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
yarn install
echo "✅ Dependencies installed successfully"
echo ""

# Step 2: Run API tests
echo "🧪 Step 2: Running API tests..."
yarn test:api
echo "✅ API tests passed"
echo ""

# Step 3: Run client tests
echo "🧪 Step 3: Running client tests..."
yarn test:client
echo "✅ Client tests passed"
echo ""

# Step 4: Run linting
echo "🔍 Step 4: Running linting..."
yarn lint --max-warnings 1000
echo "✅ Linting passed"
echo ""

# Step 5: Test Docker builds
echo "🐳 Step 5: Testing Docker builds..."
echo "Testing API Docker build..."
docker build -t trading-bot-api:test . > /dev/null 2>&1
echo "✅ API Docker build successful"

echo "Testing client Docker build..."
docker build -f client/Dockerfile -t trading-bot-client:test ./client > /dev/null 2>&1
echo "✅ Client Docker build successful"
echo ""

# Step 6: Clean up test images
echo "🧹 Step 6: Cleaning up test images..."
docker rmi trading-bot-api:test > /dev/null 2>&1 || true
docker rmi trading-bot-client:test > /dev/null 2>&1 || true
echo "✅ Test images cleaned up"
echo ""

echo "🎉 All pipeline steps completed successfully!"
echo ""
echo "✅ Dependencies installed"
echo "✅ API tests passed"
echo "✅ Client tests passed"
echo "✅ Linting passed"
echo "✅ Docker builds successful"
echo ""
echo "🚀 Ready to push to GitHub and trigger CI/CD pipeline!"
echo ""
echo "Next steps:"
echo "1. git add ."
echo "2. git commit -m 'Your commit message'"
echo "3. git push origin main"
echo "4. Create a release tag: git tag v1.0.X && git push origin v1.0.X"
