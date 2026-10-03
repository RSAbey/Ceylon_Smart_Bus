// ESLint flat config for the admin dashboard: React + React Hooks, shared banned names, JSDoc rules.
import javascriptRecommended from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import globals from 'globals';
import { readFileSync } from 'node:fs';

const bannedIdentifiers = JSON.parse(
  readFileSync(new URL('../tooling/banned-identifiers.json', import.meta.url), 'utf8')
);

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  javascriptRecommended.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react: reactPlugin, 'react-hooks': reactHooksPlugin, jsdoc: jsdocPlugin },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/prop-types': 'off',
      'id-denylist': ['error', ...bannedIdentifiers],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'jsdoc/require-jsdoc': ['error', { require: { FunctionDeclaration: true } }],
      'jsdoc/require-description': 'error',
      'jsdoc/require-param': 'warn',
      'jsdoc/require-returns': 'warn',
    },
  },
  {
    // Config files run in Node, not the browser.
    files: ['eslint.config.js', 'vite.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
