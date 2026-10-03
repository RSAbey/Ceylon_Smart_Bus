// HTTP layer for auth: reads the request, calls auth.service, sends the envelope.
const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');

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

module.exports = { login: asyncHandler(login) };
