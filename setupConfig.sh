# ------------------------
# Prettier + Husky + lint-staged setup
# ------------------------
yarn add -D prettier husky lint-staged

# Initialize Prettier config
echo '{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}' > .prettierrc

# Enable Husky
npx husky install
yarn husky add .husky/pre-commit "npx lint-staged"

# Add lint-staged config to package.json
npx json -I -f package.json -e 'this["lint-staged"]={"*.{js,ts,jsx,tsx,json,css,md}":["prettier --write"]}'

echo "✅ Setup complete!"