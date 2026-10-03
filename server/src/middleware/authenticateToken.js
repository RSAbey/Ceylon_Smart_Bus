// Verifies the Bearer JWT, rejects blocked accounts and sets req.user = { userId, role } (shared contract).
const jwt = require('jsonwebtoken');
const environment = require('../config/environment');
const User = require('../modules/users/user.model');
const { USER_STATUSES } = require('../modules/users/user.constants');
const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../utils/httpStatus');

const BEARER_PREFIX = 'Bearer ';

/**
 * Reads the token from the Authorization header ("Bearer <token>").
 * @param {import('express').Request} request - Incoming request.
 * @returns {string | null} The raw token, or null when the header is missing or malformed.
 */
function extractBearerToken(request) {
  const authorizationHeader = request.headers.authorization || '';
  if (!authorizationHeader.startsWith(BEARER_PREFIX)) return null;
  return authorizationHeader.slice(BEARER_PREFIX.length).trim();
}

/**
 * Express middleware: authenticates the caller and attaches `request.user = { userId, role }`.
 * The user is re-read from the database so a blocked account loses access immediately, not when the token expires.
 * @param {import('express').Request} request - Incoming request.
 * @param {import('express').Response} _response - Unused.
 * @param {import('express').NextFunction} next - Next middleware.
 * @returns {Promise<void>} Resolves after calling next.
 */
async function authenticateToken(request, _response, next) {
  try {
    const bearerToken = extractBearerToken(request);
    if (!bearerToken) {
      throw new AppError('Please sign in to continue.', HTTP_STATUS.UNAUTHORIZED);
    }

    const tokenPayload = jwt.verify(bearerToken, environment.jwtSecret);
    const signedInUser = await User.findById(tokenPayload.userId).select('role status');
    if (!signedInUser) {
      throw new AppError('Your session is no longer valid. Please sign in again.', HTTP_STATUS.UNAUTHORIZED);
    }
    if (signedInUser.status === USER_STATUSES.BLOCKED) {
      throw new AppError('Your account is blocked. Please contact support.', HTTP_STATUS.FORBIDDEN);
    }

    request.user = { userId: signedInUser.id, role: signedInUser.role };
    next();
  } catch (authenticationError) {
    next(authenticationError);
  }
}

module.exports = authenticateToken;
