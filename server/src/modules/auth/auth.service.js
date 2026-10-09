// Authentication business logic: registration with OTP confirmation, credential checks and JWT issuing (FR-01).
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const environment = require('../../config/environment');
const User = require('../users/user.model');
const { USER_ROLES, USER_STATUSES, OTP_PURPOSES } = require('../users/user.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');
const {
  BCRYPT_SALT_ROUNDS,
  OTP_LIFETIME_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
} = require('./auth.constants');
const otpService = require('./otp.service');
const { printOtpForTesting } = require('./otpTerminalNotice');
const { sendEmail } = require('../../utils/emailSender');

const EMAIL_MARKER = '@';
const MILLISECONDS_PER_MINUTE = 60 * 1000;
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
  printOtpForTesting({
    purpose: OTP_PURPOSES.REGISTER,
    recipient: createdUser.mobile,
    otpCode: issuedOtp.plainOtpCode,
    lifetimeMinutes: OTP_LIFETIME_MINUTES,
  });
  // Named one by one, never spread: issueOtp also returns the code in plain text for the caller to
  // send, and spreading would put that straight into the API response, production included.
  return {
    userId: createdUser.id,
    maskedMobile: otpService.maskMobileNumber(createdUser.mobile),
    expiresAt: issuedOtp.expiresAt,
    resendAfterSeconds: issuedOtp.resendAfterSeconds,
    devOtpCode: issuedOtp.devOtpCode,
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
  printOtpForTesting({
    purpose: OTP_PURPOSES.REGISTER,
    recipient: pendingUser.mobile,
    otpCode: issuedOtp.plainOtpCode,
    lifetimeMinutes: OTP_LIFETIME_MINUTES,
  });
  // Named one by one for the same reason as registerPassenger: never spread an issued OTP.
  return {
    userId: pendingUser.id,
    maskedMobile: otpService.maskMobileNumber(pendingUser.mobile),
    expiresAt: issuedOtp.expiresAt,
    resendAfterSeconds: issuedOtp.resendAfterSeconds,
    devOtpCode: issuedOtp.devOtpCode,
  };
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

/**
 * Writes the reset email. Kept beside the flow it belongs to so the wording and the code cannot
 * drift apart.
 * @param {string} otpCode - The six digits the person has to type.
 * @returns {{subject: string, bodyText: string, bodyHtml: string}} The message.
 */
function buildResetEmail(otpCode) {
  const subject = 'Your Ceylon Smart Bus password reset code';
  const bodyText =
    `Your password reset code is ${otpCode}.

` +
    `It expires in ${OTP_LIFETIME_MINUTES} minutes. If you did not ask to reset your password, ` +
    'you can ignore this email and nothing will change.';
  const bodyHtml =
    `<p>Your password reset code is <strong style="font-size:20px;letter-spacing:3px">${otpCode}</strong>.</p>` +
    `<p>It expires in ${OTP_LIFETIME_MINUTES} minutes.</p>` +
    '<p>If you did not ask to reset your password, you can ignore this email and nothing will change.</p>';
  return { subject, bodyText, bodyHtml };
}

/**
 * Emails one reset code, and decides what a failure to send means.
 * In production the email is the only copy of the code, so a failure has to reach the caller.
 * In development the code also comes back in the response, and Resend's shared test sender refuses
 * every recipient except the account owner, so a failure there is logged and the flow carries on.
 * @param {string} toAddress - The account's email address.
 * @param {string} otpCode - The six digits to send.
 * @returns {Promise<void>} Resolves once the attempt is over.
 */
async function sendResetCodeEmail(toAddress, otpCode) {
  const resetEmail = buildResetEmail(otpCode);
  const emailDetails = {
    toAddress,
    subject: resetEmail.subject,
    bodyText: resetEmail.bodyText,
    bodyHtml: resetEmail.bodyHtml,
  };

  if (environment.isProduction) {
    await sendEmail(emailDetails);
    return;
  }

  try {
    await sendEmail(emailDetails);
  } catch (sendFailure) {
    console.error('Reset code email was not sent:', sendFailure.message);
  }
}

/**
 * Starts a password reset: issues a six-digit code and emails it (FR-01, NFR-07).
 * The answer is the same whether or not an account exists, so this cannot be used to find out which
 * email addresses are registered.
 * @param {string} emailAddress - The address typed on the Forgot password screen.
 * @returns {Promise<object>} When the code expires, when it may be resent, and in development the code.
 */
async function requestPasswordReset(emailAddress) {
  const normalisedEmail = emailAddress.trim().toLowerCase();
  const matchingUser = await User.findOne({ email: normalisedEmail });

  if (!matchingUser || matchingUser.status === USER_STATUSES.BLOCKED) {
    // Nothing is sent, and the caller is told exactly what a real request is told.
    return {
      expiresAt: new Date(Date.now() + OTP_LIFETIME_MINUTES * MILLISECONDS_PER_MINUTE),
      resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      lifetimeMinutes: OTP_LIFETIME_MINUTES,
    };
  }

  const issuedOtp = await otpService.issueOtp(matchingUser.id, OTP_PURPOSES.RESET);
  // Printed before the send is attempted, so a tester has the code even if Resend refuses it.
  printOtpForTesting({
    purpose: OTP_PURPOSES.RESET,
    recipient: matchingUser.email,
    otpCode: issuedOtp.plainOtpCode,
    lifetimeMinutes: OTP_LIFETIME_MINUTES,
  });
  await sendResetCodeEmail(matchingUser.email, issuedOtp.plainOtpCode);

  return {
    expiresAt: issuedOtp.expiresAt,
    resendAfterSeconds: issuedOtp.resendAfterSeconds,
    lifetimeMinutes: OTP_LIFETIME_MINUTES,
    devOtpCode: issuedOtp.devOtpCode,
  };
}

/**
 * Finishes a password reset: checks the code, then stores the new password.
 * @param {object} resetDetails - What the Forgot password screen collected.
 * @param {string} resetDetails.email - The account's email address.
 * @param {string} resetDetails.otpCode - The six digits from the email.
 * @param {string} resetDetails.newPassword - The password to store.
 * @returns {Promise<void>} Resolves once the new password is stored.
 */
async function resetPassword({ email, otpCode, newPassword }) {
  const matchingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (!matchingUser) {
    // The code can only have come from a real account, so a missing one means the wrong email.
    throw new AppError('This code has expired. Please request a new one.', HTTP_STATUS.BAD_REQUEST);
  }

  await otpService.verifyOtp(matchingUser.id, OTP_PURPOSES.RESET, otpCode);
  matchingUser.passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await matchingUser.save();
}

module.exports = {
  registerPassenger,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  loginWithPassword,
  requestPasswordReset,
  resetPassword,
};
