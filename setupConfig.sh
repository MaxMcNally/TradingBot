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
npx json -I -f package.json -e 'this["lint-staged"]={"*.{js,ts,jsx,tsx,json,css,md}":["prettier --write","eslint --fix"]}'

# ------------------------
# ESLint with Airbnb config
# ------------------------
yarn add -D eslint eslint-config-airbnb eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier eslint-plugin-prettier

# Initialize ESLint config
npx eslint --init

# Merge Prettier with ESLint
echo '{
  "extends": ["airbnb", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": ["error"]
  }
}' > .eslintrc.json

echo "✅ Setup complete with Prettier, ESLint (Airbnb), and Husky!"