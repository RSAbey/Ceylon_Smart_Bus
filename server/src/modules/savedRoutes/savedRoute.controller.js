// HTTP layer for saved routes: reads the request, calls savedRoute.service, sends the envelope.
const savedRouteService = require('./savedRoute.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * GET /api/saved-routes — the passenger's saved routes with their running buses.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listSavedRoutes(request, response) {
  const savedRoutes = await savedRouteService.listSavedRoutes(request.user.userId);
  sendResponse(response, 'Saved routes loaded.', { savedRoutes });
}

/**
 * POST /api/saved-routes — save a route for quick access.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function saveRoute(request, response) {
  const savedRoute = await savedRouteService.saveRoute(request.user.userId, request.body.routeId);
  sendResponse(response, 'Route saved.', savedRoute, HTTP_STATUS.CREATED);
}

/**
 * DELETE /api/saved-routes/:savedRouteId — remove a saved route.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function removeSavedRoute(request, response) {
  await savedRouteService.removeSavedRoute(request.user.userId, request.params.savedRouteId);
  sendResponse(response, 'Saved route removed.');
}

module.exports = {
  listSavedRoutes: asyncHandler(listSavedRoutes),
  saveRoute: asyncHandler(saveRoute),
  removeSavedRoute: asyncHandler(removeSavedRoute),
};
