#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Initializing project structure..."

# Root directories
mkdir -p api
mkdir -p client/src/components
mkdir -p db

echo "Creating Vite React client..."
# Initialize Vite + React + JSX client
npm create vite@latest client -- --template react
cd client
npm install
cd ..

# Create components
touch client/src/components/Dashboard.jsx
touch client/src/components/Settings.jsx
touch client/src/components/Login.jsx
touch client/src/components/Backtesting.jsx

# Create API structure
touch api/server.js
touch api/routes.js
touch api/settings.db

# SQLite database folder
mkdir -p db/sqlite

echo "Creating ESLint configuration..."
cat > client/.eslintrc.json <<EOL
{
  "extends": ["airbnb", "airbnb/hooks"],
  "plugins": ["react", "react-hooks"]
}
EOL

echo "Creating Dockerfile stub..."
cat > Dockerfile <<EOL
# Use a Node.js base image
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
EOL

echo "Creating Git ignore file..."
cat > .gitignore <<EOL
/node_modules
/dist
/db
.env
.DS_Store
EOL

echo "Adding files to git repository..."
git init
git add .
git commit -m "Initial project setup with Vite client, API, components, ESLint, and Dockerfile stub"

echo "Setup complete!"
