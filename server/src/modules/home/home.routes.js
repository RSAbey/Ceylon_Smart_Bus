// Home endpoints mounted at /api/home (Member 04). One call fills the whole Home screen (NFR-05).
const express = require('express');
const trackingService = require('../tracking/tracking.service');
const savedRouteService = require('../savedRoutes/savedRoute.service');
const recentSearchService = require('../recentSearches/recentSearch.service');
const tripService = require('../trips/trip.service');
const delayService = require('../delays/delay.service');
const userService = require('../users/user.service');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const { USER_ROLES } = require('../users/user.constants');

const homeRouter = express.Router();

/** Shown on Home before the passenger grants location access. */
const NEARBY_LIMIT = 5;

homeRouter.use(authenticateToken);

/**
 * GET /api/home/passenger?lat=&lng= — nearby buses, saved routes and recent searches in one call.
 * Location is optional: without it the screen still shows saved routes and recent searches.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getPassengerHome(request, response) {
  const { lat, lng } = request.query;
  const hasLocation = lat !== undefined && lng !== undefined && !Number.isNaN(Number(lat));

  const [signedInUser, savedRoutes, recentSearches] = await Promise.all([
    userService.getUserProfileById(request.user.userId),
    savedRouteService.listSavedRoutes(request.user.userId),
    recentSearchService.listRecentSearches(request.user.userId),
  ]);

  const nearbyBuses = hasLocation
    ? (await trackingService.findNearbyBuses({ latitude: Number(lat), longitude: Number(lng) })).slice(
        0,
        NEARBY_LIMIT
      )
    : [];

  sendResponse(response, 'Home loaded.', {
    fullName: signedInUser.fullName,
    nearbyBuses,
    savedRoutes,
    recentSearches,
    hasLocation,
  });
}

/**
 * GET /api/home/driver — the driver dashboard: assigned bus, running trip and any active delay.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getDriverHome(request, response) {
  const tripOverview = await tripService.getDriverTripOverview(request.user.userId);
  const activeDelayMinutes = tripOverview.trip
    ? await delayService.getActiveDelayMinutes(tripOverview.trip.id)
    : 0;
  sendResponse(response, 'Driver home loaded.', { ...tripOverview, activeDelayMinutes });
}

homeRouter.get('/passenger', asyncHandler(getPassengerHome));
homeRouter.get('/driver', authorizeRoles(USER_ROLES.DRIVER), asyncHandler(getDriverHome));

module.exports = homeRouter;
