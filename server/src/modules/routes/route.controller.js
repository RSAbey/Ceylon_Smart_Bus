// HTTP layer for routes: reads the request, calls route.service, sends the envelope.
const routeService = require('./route.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * GET /api/routes — search routes by origin/destination or free text (FR-04).
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function searchRoutes(request, response) {
  const { from, to, search } = request.query;
  const matchingRoutes = await routeService.searchRoutes({
    originText: from,
    destinationText: to,
    searchText: search,
  });
  sendResponse(response, 'Routes loaded.', { routes: matchingRoutes });
}

/**
 * GET /api/routes/stop-names — distinct stop names for the From / To pickers.
 * @param {import('express').Request} _request - Unused.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listStopNames(_request, response) {
  const stopNames = await routeService.listStopNames();
  sendResponse(response, 'Stops loaded.', { stopNames });
}

/**
 * GET /api/routes/:routeId — one route with its ordered stops and any bus running on it.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getRouteDetails(request, response) {
  const routeWithStops = await routeService.getRouteWithStops(request.params.routeId);
  const runningTrips = await routeService.findRunningTripsOnRoute(request.params.routeId);
  sendResponse(response, 'Route loaded.', { ...routeWithStops, runningTrips });
}

/**
 * GET /api/routes/:routeId/stops/:stopId/connections — other route numbers calling at this stop.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getStopConnections(request, response) {
  const { route, stops } = await routeService.getRouteWithStops(request.params.routeId);
  const selectedStop = stops.find((routeStop) => String(routeStop.id) === String(request.params.stopId));
  const routeNumbers = selectedStop
    ? await routeService.findRouteNumbersServingStop(selectedStop.stopName, route.id)
    : [];
  sendResponse(response, 'Connections loaded.', { stop: selectedStop || null, routeNumbers });
}

/**
 * POST /api/admin/routes — create a route with its stops.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function createRoute(request, response) {
  const createdRoute = await routeService.createRoute(request.body);
  sendResponse(response, 'Route created.', createdRoute, HTTP_STATUS.CREATED);
}

/**
 * PATCH /api/admin/routes/:routeId — edit a route and optionally replace its stops.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function updateRoute(request, response) {
  const updatedRoute = await routeService.updateRoute(request.params.routeId, request.body);
  sendResponse(response, 'Route updated.', updatedRoute);
}

/**
 * DELETE /api/admin/routes/:routeId — delete a route and its stops.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function deleteRoute(request, response) {
  await routeService.deleteRoute(request.params.routeId);
  sendResponse(response, 'Route deleted.');
}

module.exports = {
  searchRoutes: asyncHandler(searchRoutes),
  listStopNames: asyncHandler(listStopNames),
  getRouteDetails: asyncHandler(getRouteDetails),
  getStopConnections: asyncHandler(getStopConnections),
  createRoute: asyncHandler(createRoute),
  updateRoute: asyncHandler(updateRoute),
  deleteRoute: asyncHandler(deleteRoute),
};
