// API calls for registration and OTP confirmation (Member 01). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/**
 * Creates a passenger account and triggers the confirmation code.
 * @param {object} registrationForm - Values from the Sign Up screen.
 * @param {string} registrationForm.fullName - Passenger's full name.
 * @param {string} registrationForm.email - Email address.
 * @param {string} registrationForm.mobile - Mobile number.
 * @param {string} registrationForm.password - Chosen password.
 * @param {boolean} registrationForm.hasAcceptedTerms - Whether the terms checkbox is ticked.
 * @returns {Promise<object>} Pending verification details (userId, maskedMobile, resendAfterSeconds, devOtpCode).
 */
export async function registerPassenger(registrationForm) {
  const registrationEnvelope = await apiClient.post('/auth/register', registrationForm);
  return registrationEnvelope.data;
}

/**
 * Confirms the 6-digit code and returns the new session.
 * @param {string} userId - Account being verified.
 * @param {string} otpCode - The code the passenger typed.
 * @returns {Promise<{token: string, user: object}>} Session for AuthContext.
 */
export async function verifyRegistrationOtp(userId, otpCode) {
  const verificationEnvelope = await apiClient.post('/auth/verify-otp', { userId, otpCode });
  return verificationEnvelope.data;
}

/**
 * Asks the server for a replacement confirmation code.
 * @param {string} userId - Account being verified.
 * @returns {Promise<object>} New expiry, cooldown and (in development) the code.
 */
export async function resendRegistrationOtp(userId) {
  const resendEnvelope = await apiClient.post('/auth/resend-otp', { userId });
  return resendEnvelope.data;
}

/**
 * Asks for a password-reset code to be emailed. The answer is the same whether or not the address
 * has an account, so this cannot be used to find out who is registered.
 * @param {string} email - The address typed on the Reset password screen.
 * @returns {Promise<object>} When the code expires, when it can be resent, and in development the code.
 */
export async function requestPasswordReset(email) {
  const resetEnvelope = await apiClient.post('/auth/forgot-password', { email });
  return resetEnvelope.data;
}

/**
 * Finishes a reset with the emailed code.
 * @param {object} resetForm - What the screen collected.
 * @param {string} resetForm.email - The account's email address.
 * @param {string} resetForm.otpCode - The six digits from the email.
 * @param {string} resetForm.newPassword - The password to store.
 * @returns {Promise<void>} Resolves once the new password is stored.
 */
export async function resetPassword({ email, otpCode, newPassword }) {
  await apiClient.post('/auth/reset-password', { email, otpCode, newPassword });
}
