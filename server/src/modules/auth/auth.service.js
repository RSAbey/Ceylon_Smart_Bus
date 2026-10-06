// Authentication business logic: registration with OTP confirmation, credential checks and JWT issuing (FR-01).
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const environment = require('../../config/environment');
const User = require('../users/user.model');
const { USER_ROLES, USER_STATUSES, OTP_PURPOSES } = require('../users/user.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');
const { BCRYPT_SALT_ROUNDS } = require('./auth.constants');
const otpService = require('./otp.service');

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
 * Rejects an email or mobile number that another account already uses, with per-field messages for the form.
 * @param {string} emailAddress - Lower-cased email.
 * @param {string} mobileNumber - Mobile number.
 * @returns {Promise<void>} Resolves when both are free.
 */
async function assertContactDetailsAreFree(emailAddress, mobileNumber) {
  const existingAccounts = await User.find({ $or: [{ email: emailAddress }, { mobile: mobileNumber }] }).select(
    'email mobile'
  );
  const fieldErrors = [];
  if (existingAccounts.some((account) => account.email === emailAddress)) {
    fieldErrors.push({ field: 'email', message: 'An account already uses this email address.' });
  }
  if (existingAccounts.some((account) => account.mobile === mobileNumber)) {
    fieldErrors.push({ field: 'mobile', message: 'An account already uses this mobile number.' });
  }
  if (fieldErrors.length > 0) {
    throw new AppError('This account already exists.', HTTP_STATUS.CONFLICT, fieldErrors);
  }
}

/**
 * Creates a passenger account and sends it an OTP to confirm the mobile number.
 * No token is issued here: the caller must confirm the code first.
 * @param {object} registrationDetails - Values from the Sign Up form.
 * @param {string} registrationDetails.fullName - Passenger's full name.
 * @param {string} registrationDetails.email - Email address.
 * @param {string} registrationDetails.mobile - Mobile number.
 * @param {string} registrationDetails.password - Plain-text password.
 * @returns {Promise<object>} Pending-verification details for the Verification screen.
 */
async function registerPassenger({ fullName, email, mobile, password }) {
  const emailAddress = email.trim().toLowerCase();
  const mobileNumber = mobile.trim();
  await assertContactDetailsAreFree(emailAddress, mobileNumber);

  const createdUser = await User.create({
    fullName: fullName.trim(),
    email: emailAddress,
    mobile: mobileNumber,
    passwordHash: await bcrypt.hash(password, BCRYPT_SALT_ROUNDS),
    role: USER_ROLES.PASSENGER,
  });

  const issuedOtp = await otpService.issueOtp(createdUser.id, OTP_PURPOSES.REGISTER);
  return {
    userId: createdUser.id,
    maskedMobile: otpService.maskMobileNumber(createdUser.mobile),
    ...issuedOtp,
  };
}

/**
 * Loads a user that is waiting to confirm a code, rejecting unknown or blocked accounts.
 * @param {string} userId - Account being verified.
 * @returns {Promise<object>} The user document.
 */
async function loadUserAwaitingVerification(userId) {
  const pendingUser = await User.findById(userId);
  if (!pendingUser) {
    throw new AppError('This registration is no longer valid. Please sign up again.', HTTP_STATUS.NOT_FOUND);
  }
  if (pendingUser.status === USER_STATUSES.BLOCKED) {
    throw new AppError('Your account is blocked. Please contact support.', HTTP_STATUS.FORBIDDEN);
  }
  return pendingUser;
}

/**
 * Confirms the registration code and signs the new passenger in.
 * @param {string} userId - Account being verified.
 * @param {string} otpCode - The 6 digits typed on the Verification screen.
 * @returns {Promise<{token: string, user: object}>} JWT and the public profile.
 */
async function verifyRegistrationOtp(userId, otpCode) {
  const pendingUser = await loadUserAwaitingVerification(userId);
  await otpService.verifyOtp(userId, OTP_PURPOSES.REGISTER, otpCode);
  return { token: issueAccessToken(pendingUser), user: pendingUser.toJSON() };
}

/**
 * Issues a replacement registration code (the "Resend" action on the Verification screen).
 * @param {string} userId - Account being verified.
 * @returns {Promise<object>} New expiry, cooldown and (outside production) the code.
 */
async function resendRegistrationOtp(userId) {
  const pendingUser = await loadUserAwaitingVerification(userId);
  const issuedOtp = await otpService.issueOtp(pendingUser.id, OTP_PURPOSES.REGISTER);
  return { userId: pendingUser.id, maskedMobile: otpService.maskMobileNumber(pendingUser.mobile), ...issuedOtp };
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

module.exports = {
  registerPassenger,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  loginWithPassword,
};
