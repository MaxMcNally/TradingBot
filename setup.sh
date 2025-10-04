#!/bin/bash
set -e

echo "Setting up project structure..."

# Create API and client folders
mkdir -p api/routes api/db client/scripts

# Initialize backend package.json
cd api
npm init -y
npm install express sqlite3 cors dotenv body-parser
cd ..

# Initialize frontend with Vite + React
cd client
npm create vite@latest . -- --template react
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled react-router-dom recharts
cd ..

# Copy setup scripts into scripts folder
cp scripts/setupComponents.sh scripts/setupDB.sh ./scripts/

# Run component setup
bash scripts/setupComponents.sh

# Run DB setup
bash scripts/setupDB.sh

echo "Project scaffolding complete!"
