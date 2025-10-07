#!/bin/sh

# Set default API URL if not provided
API_URL=${API_URL:-"http://api-qa-qa.up.railway.app"}
PORT=${PORT:-80}

echo "Starting client with API_URL: $API_URL and PORT: $PORT"

# Replace the API URL and PORT in nginx config
sed -i "s|http://api-qa-qa.up.railway.app|$API_URL|g" /etc/nginx/nginx.conf
sed -i "s|\${PORT:-80}|$PORT|g" /etc/nginx/nginx.conf

# Start nginx directly (no user switching for now)
echo "Starting nginx on port $PORT..."
exec nginx -g 'daemon off;'
