// HTTP layer for live tracking: reads the request, calls tracking.service, sends the envelope.
const trackingService = require('./tracking.service');
const tripService = require('../trips/trip.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');

/**
 * POST /api/tracking/location — the driver app posts its position every few seconds (FR-02, NFR-01).
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function postBusLocation(request, response) {
  const driverProfile = await tripService.getDriverProfileForUser(request.user.userId);
  const { tripId, latitude, longitude, speedKmh } = request.body;
  const updatedTrip = await trackingService.recordBusLocation(tripId, driverProfile.id, {
    latitude,
    longitude,
    speedKmh,
  });
  sendResponse(response, 'Position recorded.', {
    tripId: updatedTrip.id,
    lastLocationAt: updatedTrip.lastLocationAt,
  });
}

/**
 * GET /api/tracking/trips/:tripId — live position, service status and arrival time for one bus.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getTripTracking(request, response) {
  const trackingCard = await trackingService.getTripTracking(request.params.tripId, request.query.stopId);
  sendResponse(response, 'Tracking loaded.', trackingCard);
}

/**
 * GET /api/tracking/nearby?lat=&lng=&radiusKm= — buses running near the passenger (FR-03).
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getNearbyBuses(request, response) {
  const { lat, lng, radiusKm } = request.query;
  const nearbyBuses = await trackingService.findNearbyBuses({
    latitude: Number(lat),
    longitude: Number(lng),
    radiusKm: radiusKm ? Number(radiusKm) : undefined,
  });
  sendResponse(response, 'Nearby buses loaded.', { buses: nearbyBuses });
}

/**
 * GET /api/admin/fleet — every running bus with its position, route line and the summary counts.
 * @param {import('express').Request} _request - Unused.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getFleetPositions(_request, response) {
  const liveFleet = await trackingService.getFleetPositions();
  sendResponse(response, 'Fleet loaded.', liveFleet);
}

/**
 * POST /api/admin/fleet/:tripId/end — closes a trip the driver app left running.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function endStrandedTrip(request, response) {
  const closedTrip = await trackingService.endStrandedTrip(request.params.tripId);
  sendResponse(response, 'Trip closed.', { trip: closedTrip });
}

module.exports = {
  postBusLocation: asyncHandler(postBusLocation),
  getTripTracking: asyncHandler(getTripTracking),
  getNearbyBuses: asyncHandler(getNearbyBuses),
  getFleetPositions: asyncHandler(getFleetPositions),
  endStrandedTrip: asyncHandler(endStrandedTrip),
};
