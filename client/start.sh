#!/bin/sh

# Set default API URL if not provided
API_URL=${API_URL:-"http://api-qa-qa.up.railway.app"}

echo "Starting client with API_URL: $API_URL"

# Replace the API URL in nginx config
sed -i "s|http://api-qa-qa.up.railway.app|$API_URL|g" /etc/nginx/nginx.conf

# Create nginx pid directory and set permissions
mkdir -p /var/run/nginx
chown -R nginx:nginx /var/run/nginx

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Start nginx as nginx user
echo "Starting nginx..."
exec su-exec nginx nginx -g 'daemon off;'
