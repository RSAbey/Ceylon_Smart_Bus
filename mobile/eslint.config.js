// ESLint flat config for the Expo app: Expo's React + React Hooks rules, shared banned names, JSDoc rules.
const expoConfig = require('eslint-config-expo/flat');
const jsdocPlugin = require('eslint-plugin-jsdoc');
const bannedIdentifiers = require('../tooling/banned-identifiers.json');

/**
 * Returns the banned list without the names a specific file is forced to use.
 * @param {string[]} allowedNames - Names mandated by a framework for that file.
 * @returns {Array<string>} id-denylist rule options.
 */
function denylistExcept(allowedNames) {
  return ['error', ...bannedIdentifiers.filter((bannedName) => !allowedNames.includes(bannedName))];
}

module.exports = [
  ...expoConfig,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'android/**', 'ios/**'],
  },
  {
    files: ['**/*.js'],
    plugins: { jsdoc: jsdocPlugin },
    rules: {
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
    // AppTextInput wraps React Native's TextInput, whose controlled-input prop is named `value`.
    files: ['src/components/ui/AppTextInput.js'],
    rules: { 'id-denylist': denylistExcept(['value']) },
  },
];
