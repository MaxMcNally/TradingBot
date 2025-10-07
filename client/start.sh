#!/bin/sh

# Set default API URL if not provided
API_URL=${API_URL:-"http://api-qa-qa.up.railway.app"}

echo "Starting client with API_URL: $API_URL"

# Replace the API URL in nginx config
sed -i "s|http://api-qa-qa.up.railway.app|$API_URL|g" /etc/nginx/nginx.conf

# Start nginx directly (no user switching for now)
echo "Starting nginx..."
exec nginx -g 'daemon off;'
