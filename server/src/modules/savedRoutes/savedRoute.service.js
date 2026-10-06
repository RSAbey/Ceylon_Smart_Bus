// Saved-route business logic (Member 02). getUserIdsBySavedRoute is a shared contract used by Member 04.
const SavedRoute = require('./savedRoute.model');
const Route = require('../routes/route.model');
const Trip = require('../trips/trip.model');
const RouteStop = require('../routes/routeStop.model');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * Lists the passengers who saved a route.
 * @param {string} routeId - Route to check.
 * @returns {Promise<string[]>} Distinct user ids as strings.
 */
async function getUserIdsBySavedRoute(routeId) {
  const savedRouteUserIds = await SavedRoute.distinct('userId', { routeId });
  return savedRouteUserIds.map(String);
}

/**
 * A passenger's saved routes, each with the next bus still running on it (the "Next: 10 mins" line).
 * @param {string} userId - Signed-in passenger.
 * @returns {Promise<object[]>} Saved routes with their route and running trip count.
 */
async function listSavedRoutes(userId) {
  const savedRoutes = await SavedRoute.find({ userId }).populate('routeId').sort({ createdAt: -1 });

  return Promise.all(
    savedRoutes.map(async (savedRoute) => {
      const runningTrips = await Trip.find({
        routeId: savedRoute.routeId?.id,
        status: TRIP_STATUSES.ONGOING,
      }).select('_id');
      const stopCount = await RouteStop.countDocuments({ routeId: savedRoute.routeId?.id });
      return {
        id: savedRoute.id,
        route: savedRoute.routeId,
        stopCount,
        runningTripIds: runningTrips.map((runningTrip) => runningTrip.id),
        hasRunningBus: runningTrips.length > 0,
        createdAt: savedRoute.createdAt,
      };
    })
  );
}

/**
 * Saves a route for a passenger. Saving the same route twice is treated as success so the
 * star button never fails on a double tap.
 * @param {string} userId - Signed-in passenger.
 * @param {string} routeId - Route to save.
 * @returns {Promise<object>} The saved-route row.
 */
async function saveRoute(userId, routeId) {
  const matchingRoute = await Route.findById(routeId);
  if (!matchingRoute) {
    throw new AppError('Route not found.', HTTP_STATUS.NOT_FOUND);
  }
  const alreadySaved = await SavedRoute.findOne({ userId, routeId });
  if (alreadySaved) return alreadySaved;
  return SavedRoute.create({ userId, routeId });
}

/**
 * Removes a saved route, refusing to touch another passenger's row.
 * @param {string} userId - Signed-in passenger.
 * @param {string} savedRouteId - Saved-route row to remove.
 * @returns {Promise<void>} Resolves once removed.
 */
async function removeSavedRoute(userId, savedRouteId) {
  const savedRoute = await SavedRoute.findById(savedRouteId);
  if (!savedRoute) {
    throw new AppError('Saved route not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (String(savedRoute.userId) !== String(userId)) {
    throw new AppError('You can only remove your own saved routes.', HTTP_STATUS.FORBIDDEN);
  }
  await SavedRoute.findByIdAndDelete(savedRouteId);
}

module.exports = { getUserIdsBySavedRoute, listSavedRoutes, saveRoute, removeSavedRoute };
