// HTTP layer for auth: reads the request, calls auth.service, sends the standard envelope.
const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * POST /api/auth/register — creates a passenger account and issues a confirmation code.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function register(request, response) {
  const { fullName, email, mobile, password } = request.body;
  const pendingRegistration = await authService.registerPassenger({ fullName, email, mobile, password });
  sendResponse(response, 'Account created. Enter the code we sent you.', pendingRegistration, HTTP_STATUS.CREATED);
}

/**
 * POST /api/auth/verify-otp — confirms the code and signs the new passenger in.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function verifyOtp(request, response) {
  const { userId, otpCode } = request.body;
  const verifiedSession = await authService.verifyRegistrationOtp(userId, otpCode);
  sendResponse(response, 'Your phone number has been verified.', verifiedSession);
}

/**
 * POST /api/auth/resend-otp — issues a replacement confirmation code.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function resendOtp(request, response) {
  const reissuedOtp = await authService.resendRegistrationOtp(request.body.userId);
  sendResponse(response, 'We sent you a new code.', reissuedOtp);
}

/**
 * POST /api/auth/login — body { identifier, password }; responds with { token, user }.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function login(request, response) {
  const { identifier, password } = request.body;
  const loginOutcome = await authService.loginWithPassword(identifier, password);
  sendResponse(response, 'Signed in successfully.', loginOutcome);
}

/**
 * POST /api/auth/forgot-password — emails a six-digit reset code.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function forgotPassword(request, response) {
  const resetRequest = await authService.requestPasswordReset(request.body.email);
  // The same answer either way, so this cannot be used to find out who has an account.
  sendResponse(
    response,
    'If that email has an account, a reset code is on its way.',
    resetRequest
  );
}

/**
 * POST /api/auth/reset-password — checks the code and stores the new password.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function resetPassword(request, response) {
  await authService.resetPassword({
    email: request.body.email,
    otpCode: request.body.otpCode,
    newPassword: request.body.newPassword,
  });
  sendResponse(response, 'Password changed. Sign in with your new password.');
}

module.exports = {
  forgotPassword: asyncHandler(forgotPassword),
  resetPassword: asyncHandler(resetPassword),
  register: asyncHandler(register),
  verifyOtp: asyncHandler(verifyOtp),
  resendOtp: asyncHandler(resendOtp),
  login: asyncHandler(login),
};
