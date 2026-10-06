// OTP lifecycle: issue, verify and resend the 6-digit code used to confirm a mobile number (FR-01).
// There is no SMS gateway in this project, so the code is returned in the API response in development only.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const environment = require('../../config/environment');
const OtpVerification = require('./otpVerification.model');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');
const {
  OTP_SMALLEST_VALUE,
  OTP_LARGEST_VALUE,
  OTP_LIFETIME_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  BCRYPT_SALT_ROUNDS,
} = require('./auth.constants');

const MILLISECONDS_PER_MINUTE = 60 * 1000;
const VISIBLE_MOBILE_DIGITS = 4;

/**
 * Generates a cryptographically random 6-digit code.
 * @returns {string} The code, for example "481903".
 */
function generateOtpCode() {
  return String(crypto.randomInt(OTP_SMALLEST_VALUE, OTP_LARGEST_VALUE));
}

/**
 * Hides all but the last few digits of a mobile number for display ("0772000001" -> "••••••0001").
 * @param {string} [mobileNumber] - Full mobile number.
 * @returns {string} Masked number, or an empty string when there is none.
 */
function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) return '';
  const visiblePart = mobileNumber.slice(-VISIBLE_MOBILE_DIGITS);
  return '•'.repeat(Math.max(0, mobileNumber.length - VISIBLE_MOBILE_DIGITS)) + visiblePart;
}

/**
 * Issues a fresh code, replacing any earlier unused code for the same user and purpose.
 * @param {string} userId - Owner of the code.
 * @param {string} otpPurpose - One of OTP_PURPOSES.
 * @returns {Promise<{expiresAt: Date, resendAfterSeconds: number, devOtpCode: string | undefined}>}
 *   Expiry, resend cooldown, and the code itself outside production.
 */
async function issueOtp(userId, otpPurpose) {
  // Only the newest code may be used, so older ones are burned first.
  await OtpVerification.updateMany({ userId, purpose: otpPurpose, isUsed: false }, { $set: { isUsed: true } });

  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_LIFETIME_MINUTES * MILLISECONDS_PER_MINUTE);
  await OtpVerification.create({
    userId,
    codeHash: await bcrypt.hash(otpCode, BCRYPT_SALT_ROUNDS),
    purpose: otpPurpose,
    expiresAt,
  });

  return {
    expiresAt,
    resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    // Never leak the code in production; in development it stands in for the SMS we cannot send.
    devOtpCode: environment.isProduction ? undefined : otpCode,
  };
}

/**
 * Checks a code the user typed. Wrong codes count towards OTP_MAX_ATTEMPTS, after which the code is burned.
 * @param {string} userId - Owner of the code.
 * @param {string} otpPurpose - One of OTP_PURPOSES.
 * @param {string} submittedCode - The 6 digits entered on the Verification screen.
 * @returns {Promise<void>} Resolves when the code is correct; throws otherwise.
 */
async function verifyOtp(userId, otpPurpose, submittedCode) {
  const pendingOtp = await OtpVerification.findOne({
    userId,
    purpose: otpPurpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ _id: -1 });

  if (!pendingOtp) {
    throw new AppError('This code has expired. Please request a new one.', HTTP_STATUS.BAD_REQUEST);
  }

  const isCodeCorrect = await bcrypt.compare(submittedCode, pendingOtp.codeHash);
  if (isCodeCorrect) {
    pendingOtp.isUsed = true;
    await pendingOtp.save();
    return;
  }

  pendingOtp.attemptCount += 1;
  const remainingAttempts = OTP_MAX_ATTEMPTS - pendingOtp.attemptCount;
  if (remainingAttempts <= 0) {
    // Burn the code so the remaining guesses cannot be used on it.
    pendingOtp.isUsed = true;
    await pendingOtp.save();
    throw new AppError('Too many incorrect attempts. Please request a new code.', HTTP_STATUS.BAD_REQUEST);
  }
  await pendingOtp.save();
  throw new AppError(`Invalid confirmation code. Remaining attempts: ${remainingAttempts}`, HTTP_STATUS.BAD_REQUEST);
}

module.exports = { issueOtp, verifyOtp, maskMobileNumber };
