// HTTP layer for trips: reads the request, calls trip.service, sends the envelope.
const tripService = require('./trip.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');
const { TRIP_STATUSES } = require('./trip.constants');

/**
 * GET /api/trips/mine — the driver's assigned bus, route, stops and running trip.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getMyTripOverview(request, response) {
  const tripOverview = await tripService.getDriverTripOverview(request.user.userId);
  sendResponse(response, 'Trip details loaded.', tripOverview);
}

/**
 * GET /api/trips/driver-profile - the driver's own record for the Profile screen.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getMyDriverProfile(request, response) {
  const driverSummary = await tripService.getDriverProfileSummary(request.user.userId);
  sendResponse(response, 'Driver profile loaded.', driverSummary);
}

/**
 * POST /api/trips/start — start a trip on the driver's assigned bus.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function startTrip(request, response) {
  const startedTrip = await tripService.startTrip(request.user.userId);
  sendResponse(response, 'Trip started.', startedTrip, HTTP_STATUS.CREATED);
}

/**
 * POST /api/trips/end — finish the driver's running trip.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function endTrip(request, response) {
  const endStatus = request.body.isCancelled ? TRIP_STATUSES.CANCELLED : TRIP_STATUSES.COMPLETED;
  const finishedTrip = await tripService.endTrip(request.user.userId, endStatus);
  sendResponse(response, 'Trip ended.', finishedTrip);
}

module.exports = {
  getMyTripOverview: asyncHandler(getMyTripOverview),
  getMyDriverProfile: asyncHandler(getMyDriverProfile),
  startTrip: asyncHandler(startTrip),
  endTrip: asyncHandler(endTrip),
};
