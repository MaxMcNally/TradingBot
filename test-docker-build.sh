#!/bin/bash

# Test Docker Build Script
# This script tests the Docker build process locally to catch issues before CI/CD
# Usage: ./test-docker-build.sh [api|client|both]

set -e

# Get service argument (default to both)
SERVICE=${1:-both}

echo "🐳 Testing Docker build locally for: $SERVICE"

# Function to test API Docker build
test_api_build() {
    echo "🔨 Testing API Docker build..."
    echo "Building API image..."
    
    # Build the API Docker image
    docker build -t trading-bot-api:test .
    
    echo "✅ API Docker build successful!"
    echo "Image size:"
    docker images trading-bot-api:test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    # Test that the image can start
    echo "🧪 Testing API container startup..."
    CONTAINER_ID=$(docker run -d -p 8001:8001 --name test-api-container trading-bot-api:test)
    
    # Wait a moment for startup
    sleep 5
    
    # Check if container is running
    if docker ps | grep -q test-api-container; then
        echo "✅ API container started successfully!"
        
        # Test health endpoint
        echo "🏥 Testing API health endpoint..."
        if curl -f http://localhost:8001/ping > /dev/null 2>&1; then
            echo "✅ API health check passed!"
        else
            echo "⚠️ API health check failed (this might be expected if dependencies are missing)"
        fi
    else
        echo "❌ API container failed to start"
        echo "Container logs:"
        docker logs test-api-container
    fi
    
    # Cleanup
    echo "🧹 Cleaning up API test container..."
    docker stop test-api-container > /dev/null 2>&1 || true
    docker rm test-api-container > /dev/null 2>&1 || true
}

# Function to test client Docker build
test_client_build() {
    echo "🔨 Testing client Docker build..."
    echo "Building client image..."
    
    # Build the client Docker image
    docker build -f client/Dockerfile -t trading-bot-client:test ./client
    
    echo "✅ Client Docker build successful!"
    echo "Image size:"
    docker images trading-bot-client:test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    # Test that the image can start
    echo "🧪 Testing client container startup..."
    CONTAINER_ID=$(docker run -d -p 3000:80 --name test-client-container trading-bot-client:test)
    
    # Wait a moment for startup
    sleep 3
    
    # Check if container is running
    if docker ps | grep -q test-client-container; then
        echo "✅ Client container started successfully!"
        
        # Test that nginx is serving files
        echo "🌐 Testing client web server..."
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Client web server is responding!"
        else
            echo "⚠️ Client web server not responding"
        fi
    else
        echo "❌ Client container failed to start"
        echo "Container logs:"
        docker logs test-client-container
    fi
    
    # Cleanup
    echo "🧹 Cleaning up client test container..."
    docker stop test-client-container > /dev/null 2>&1 || true
    docker rm test-client-container > /dev/null 2>&1 || true
}

# Main execution
case $SERVICE in
    "api")
        test_api_build
        ;;
    "client")
        test_client_build
        ;;
    "both")
        test_api_build
        echo ""
        test_client_build
        ;;
    *)
        echo "❌ Invalid service. Use 'api', 'client', or 'both'"
        exit 1
        ;;
esac

echo ""
echo "✅ Docker build tests completed!"
echo ""
echo "Usage examples:"
echo "  ./test-docker-build.sh api     # Test only API build"
echo "  ./test-docker-build.sh client  # Test only client build"
echo "  ./test-docker-build.sh both    # Test both builds (default)"
echo ""
echo "Note: This tests the same Docker build process that CircleCI uses."
echo "If these builds pass, the CI/CD pipeline should also pass."
