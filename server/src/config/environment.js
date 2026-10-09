// Loads .env once, checks the required variables and exposes one frozen settings object.
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const REQUIRED_VARIABLE_NAMES = ['MONGODB_URI', 'JWT_SECRET'];
const DEFAULT_PORT = 5000;
const DEFAULT_JWT_EXPIRES_IN = '7d';
const DEFAULT_NODE_ENV = 'development';

/**
 * Throws a clear error when a required environment variable is missing, so the API never starts half-configured.
 * @returns {void}
 */
function assertRequiredVariablesPresent() {
  const missingVariableNames = REQUIRED_VARIABLE_NAMES.filter(
    (variableName) => !process.env[variableName]
  );
  if (missingVariableNames.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missingVariableNames.join(', ')}. ` +
        'Copy server/.env.example to server/.env and fill them in.'
    );
  }
}

/**
 * Splits the comma-separated CLIENT_ORIGINS variable into a clean array of origins.
 * @param {string | undefined} rawOrigins - Value of CLIENT_ORIGINS.
 * @returns {string[]} Allowed browser origins.
 */
function parseClientOrigins(rawOrigins) {
  if (!rawOrigins) return [];
  return rawOrigins
    .split(',')
    .map((clientOrigin) => clientOrigin.trim())
    .filter((clientOrigin) => clientOrigin.length > 0);
}

assertRequiredVariablesPresent();

const nodeEnvironment = process.env.NODE_ENV || DEFAULT_NODE_ENV;

const environment = Object.freeze({
  nodeEnvironment,
  isProduction: nodeEnvironment === 'production',
  port: Number(process.env.PORT) || DEFAULT_PORT,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN,
  clientOrigins: Object.freeze(parseClientOrigins(process.env.CLIENT_ORIGINS)),
  // Resend sends the password-reset code. Optional: without a key the reset flow still works in
  // development, where the code comes back in the response instead of by email.
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
});

module.exports = environment;
