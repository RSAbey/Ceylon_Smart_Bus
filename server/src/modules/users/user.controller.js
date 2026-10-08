// HTTP layer for users: reads the request, calls user.service, sends the envelope.
const userService = require('./user.service');
const passengerService = require('./passenger.service');
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

/**
 * PATCH /api/users/me — saves changes from the Edit Profile screen.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function updateMyProfile(request, response) {
  const { fullName, email, mobile, avatarUrl } = request.body;
  const updatedProfile = await userService.updateMyProfile(request.user.userId, {
    fullName,
    email,
    mobile,
    avatarUrl,
  });
  sendResponse(response, 'Your profile has been updated.', updatedProfile);
}

/**
 * DELETE /api/users/me — permanently removes the signed-in user's own account.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function deleteMyAccount(request, response) {
  await userService.deleteMyAccount(request.user.userId);
  sendResponse(response, 'Your account has been deleted.');
}

/**
 * GET /api/admin/users — paged account list for the dashboard.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listUsers(request, response) {
  const { role, status, search, page, pageSize } = request.query;
  const userPage = await userService.listUsersForAdmin({
    role,
    status,
    searchText: search,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });
  sendResponse(response, 'Accounts loaded.', userPage);
}

/**
 * PATCH /api/admin/users/:userId/status — blocks or unblocks an account.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function setUserStatus(request, response) {
  const updatedAccount = await userService.setUserStatus(
    request.params.userId,
    request.body.status,
    request.user.userId
  );
  sendResponse(response, 'Account status updated.', updatedAccount);
}

/**
 * GET /api/admin/users/passengers?status=&search= — the passenger roster with what each has done.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listPassengers(request, response) {
  const passengerList = await passengerService.listPassengersForAdmin({
    status: request.query.status,
    searchText: request.query.search,
  });
  sendResponse(response, 'Passengers loaded.', passengerList);
}

/**
 * GET /api/admin/users/passengers/:userId — one passenger's record for the support screen.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getPassenger(request, response) {
  const passengerProfile = await passengerService.getPassengerForAdmin(request.params.userId);
  sendResponse(response, 'Passenger loaded.', passengerProfile);
}

module.exports = {
  getMyProfile: asyncHandler(getMyProfile),
  listPassengers: asyncHandler(listPassengers),
  getPassenger: asyncHandler(getPassenger),
  updateMyProfile: asyncHandler(updateMyProfile),
  deleteMyAccount: asyncHandler(deleteMyAccount),
  listUsers: asyncHandler(listUsers),
  setUserStatus: asyncHandler(setUserStatus),
};
