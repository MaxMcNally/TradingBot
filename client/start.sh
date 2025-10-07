#!/bin/sh

# Set default API URL if not provided
API_URL=${API_URL:-"http://api-qa-qa.up.railway.app"}

# Replace the API URL in nginx config
sed -i "s|http://api-qa-qa.up.railway.app|$API_URL|g" /etc/nginx/nginx.conf

# Create nginx directories and set permissions
mkdir -p /var/run/nginx
mkdir -p /var/log/nginx
chown -R nginx:nginx /var/run/nginx
chown -R nginx:nginx /var/log/nginx

# Start nginx as nginx user
exec su-exec nginx nginx -g 'daemon off;'
