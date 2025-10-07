// import js from "@eslint/js"; // Unused import
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  // Ignore dist directory and other build outputs
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "client/dist/**",
      "client/node_modules/**",
      "api/node_modules/**",
      "**/*.d.ts",
      "**/__tests__/disabled/**"
    ]
  },

  // TypeScript files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unsafe-declaration-merging": "warn",
      "@typescript-eslint/no-var-requires": "warn",
      "no-undef": "off"
    }
  },

  // JavaScript files
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      ecmaVersion: 2022,
      sourceType: "module"
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error"
    }
  },

  // React configuration
  {
    files: ["**/*.{jsx,tsx}"],
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "18.2.0"
      }
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off", // Not needed with React 17+
      "react/no-unescaped-entities": "warn",
      "react/jsx-no-undef": "error",
      "react/jsx-no-duplicate-props": "error"
    }
  }
];