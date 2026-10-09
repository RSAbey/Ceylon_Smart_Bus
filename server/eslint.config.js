// ESLint flat config for the API: shared banned-name list, JSDoc rules and Node globals.
const javascriptRecommended = require('@eslint/js');
const jsdocPlugin = require('eslint-plugin-jsdoc');
const globals = require('globals');
const bannedIdentifiers = require('../tooling/banned-identifiers.json');

module.exports = [
  javascriptRecommended.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
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
    // The API envelope is { success, message, data } (CLAUDE.md section 4), so the key "data" is mandated here.
    files: ['src/utils/sendResponse.js'],
    rules: {
      'id-denylist': ['error', ...bannedIdentifiers.filter((bannedName) => bannedName !== 'data')],
    },
  },
  {
    // TICKET_VERIFICATION.result is a field name fixed by the ERD (docs/ERD_AND_RELATIONAL.md section 3).
    files: [
      'src/modules/verification/ticketVerification.model.js',
      'src/modules/verification/verification.service.js',
    ],
    rules: {
      'id-denylist': ['error', ...bannedIdentifiers.filter((bannedName) => bannedName !== 'result')],
    },
  },
];
