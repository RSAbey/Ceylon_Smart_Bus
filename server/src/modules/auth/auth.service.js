// Authentication business logic: checks credentials and issues the JWT.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const environment = require('../../config/environment');
const User = require('../users/user.model');
const { USER_STATUSES } = require('../users/user.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const EMAIL_MARKER = '@';
const INVALID_CREDENTIALS_MESSAGE = 'Incorrect email/mobile number or password.';

/**
 * Builds the database filter for a login identifier: an email when it contains "@", otherwise a mobile number.
 * @param {string} identifier - Email or mobile number typed by the user.
 * @returns {{email: string} | {mobile: string}} Mongo filter.
 */
function buildIdentifierFilter(identifier) {
  const trimmedIdentifier = identifier.trim();
  return trimmedIdentifier.includes(EMAIL_MARKER)
    ? { email: trimmedIdentifier.toLowerCase() }
    : { mobile: trimmedIdentifier };
}

/**
 * Signs a JWT carrying the fields authenticateToken needs.
 * @param {object} signedInUser - User document.
 * @returns {string} Signed JWT.
 */
function issueAccessToken(signedInUser) {
  return jwt.sign({ userId: signedInUser.id, role: signedInUser.role }, environment.jwtSecret, {
    expiresIn: environment.jwtExpiresIn,
  });
}

/**
 * Logs in any role (passenger, driver or admin) with an email or mobile number and a password.
 * @param {string} identifier - Email or mobile number.
 * @param {string} password - Plain-text password from the login form.
 * @returns {Promise<{token: string, user: object}>} JWT and the public user profile.
 */
async function loginWithPassword(identifier, password) {
  const matchingUser = await User.findOne(buildIdentifierFilter(identifier)).select('+passwordHash');
  // Same message for "no such user" and "wrong password" so attackers cannot discover which accounts exist.
  if (!matchingUser) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, HTTP_STATUS.UNAUTHORIZED);
  }

  const isPasswordCorrect = await bcrypt.compare(password, matchingUser.passwordHash);
  if (!isPasswordCorrect) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, HTTP_STATUS.UNAUTHORIZED);
  }
  if (matchingUser.status === USER_STATUSES.BLOCKED) {
    throw new AppError('Your account is blocked. Please contact support.', HTTP_STATUS.FORBIDDEN);
  }

  return { token: issueAccessToken(matchingUser), user: matchingUser.toJSON() };
}

module.exports = { loginWithPassword };
