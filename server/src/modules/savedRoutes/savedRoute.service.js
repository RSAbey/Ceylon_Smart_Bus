// Saved-route business logic. getUserIdsBySavedRoute is a shared contract used by Member 04 (delay notifications).
const SavedRoute = require('./savedRoute.model');

/**
 * Lists the passengers who saved a route.
 * @param {string} routeId - Route to check.
 * @returns {Promise<string[]>} Distinct user ids as strings.
 */
async function getUserIdsBySavedRoute(routeId) {
  const savedRouteUserIds = await SavedRoute.distinct('userId', { routeId });
  return savedRouteUserIds.map(String);
}

module.exports = { getUserIdsBySavedRoute };
