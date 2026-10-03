// HTTP layer for users: reads the request, calls user.service, sends the envelope.
const userService = require('./user.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');

/**
 * GET /api/users/me — returns the signed-in user's profile (used to restore a session).
 * @param {import('express').Request} request - Express request with request.user set by authenticateToken.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getMyProfile(request, response) {
  const userProfile = await userService.getUserProfileById(request.user.userId);
  sendResponse(response, 'Profile loaded.', userProfile);
}

module.exports = { getMyProfile: asyncHandler(getMyProfile) };
