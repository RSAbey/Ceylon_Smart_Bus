// Route business logic (Member 02): passenger search and details, plus admin route/stop management (FR-04, NFR-10).
const Route = require('./route.model');
const RouteStop = require('./routeStop.model');
const Bus = require('../buses/bus.model');
const Trip = require('../trips/trip.model');
const { ROUTE_STATUSES } = require('./route.constants');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const FIRST_STOP_SEQUENCE = 1;

/**
 * Escapes user input so a search term cannot act as a regular expression.
 * @param {string} searchText - Raw text typed by the user.
 * @returns {RegExp} Case-insensitive matcher.
 */
function buildSearchPattern(searchText) {
  return new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

/**
 * Loads a route with its stops in travel order.
 * @param {string} routeId - Route to load.
 * @returns {Promise<{route: object, stops: object[]}>} Route and ordered stops.
 */
async function getRouteWithStops(routeId) {
  const matchingRoute = await Route.findById(routeId);
  if (!matchingRoute) {
    throw new AppError('Route not found.', HTTP_STATUS.NOT_FOUND);
  }
  const stops = await RouteStop.find({ routeId }).sort({ stopSequence: 1 });
  return { route: matchingRoute, stops };
}

/**
 * Finds active routes that travel from one stop to another in that order (FR-04).
 * With no origin or destination it lists every active route.
 * @param {object} searchOptions - What the passenger typed.
 * @param {string} [searchOptions.originText] - Boarding stop name.
 * @param {string} [searchOptions.destinationText] - Alighting stop name.
 * @param {string} [searchOptions.searchText] - Free text matched against route number or name.
 * @returns {Promise<object[]>} Matching routes, each with its boarding and alighting stop and the fare.
 */
async function searchRoutes({ originText, destinationText, searchText } = {}) {
  const routeFilter = { status: ROUTE_STATUSES.ACTIVE };
  if (searchText) {
    const searchPattern = buildSearchPattern(searchText);
    routeFilter.$or = [
      { routeNumber: searchPattern },
      { routeName: searchPattern },
      { origin: searchPattern },
      { destination: searchPattern },
    ];
  }
  const activeRoutes = await Route.find(routeFilter).sort({ routeNumber: 1 });
  if (!originText && !destinationText) {
    return activeRoutes.map((activeRoute) => ({ route: activeRoute }));
  }

  const matchedRoutes = [];
  for (const activeRoute of activeRoutes) {
    const stops = await RouteStop.find({ routeId: activeRoute.id }).sort({ stopSequence: 1 });
    const boardingStop = originText
      ? stops.find((routeStop) => buildSearchPattern(originText).test(routeStop.stopName))
      : stops[0];
    const alightingStop = destinationText
      ? stops.find((routeStop) => buildSearchPattern(destinationText).test(routeStop.stopName))
      : stops[stops.length - 1];

    // The bus must pass the boarding stop before the alighting stop to be useful for this journey.
    if (!boardingStop || !alightingStop || boardingStop.stopSequence >= alightingStop.stopSequence) continue;

    matchedRoutes.push({
      route: activeRoute,
      boardingStop,
      alightingStop,
      fareAmount: Math.max(0, alightingStop.fareFromOrigin - boardingStop.fareFromOrigin),
      stopCount: alightingStop.stopSequence - boardingStop.stopSequence,
    });
  }
  return matchedRoutes;
}

/**
 * Distinct stop names across all active routes, for the From / To pickers on the search screen.
 * @returns {Promise<string[]>} Stop names in alphabetical order.
 */
async function listStopNames() {
  const activeRoutes = await Route.find({ status: ROUTE_STATUSES.ACTIVE }).select('_id');
  const stopNames = await RouteStop.distinct('stopName', {
    routeId: { $in: activeRoutes.map((activeRoute) => activeRoute.id) },
  });
  return stopNames.sort((firstName, secondName) => firstName.localeCompare(secondName));
}

/**
 * Other route numbers that also call at a stop, shown as "Next bus: 154, 138" when a stop is expanded.
 * @param {string} stopName - Stop to look up.
 * @param {string} [excludeRouteId] - Route already being viewed.
 * @returns {Promise<string[]>} Route numbers serving the same stop.
 */
async function findRouteNumbersServingStop(stopName, excludeRouteId) {
  const matchingStops = await RouteStop.find({ stopName }).select('routeId');
  const routeIds = matchingStops
    .map((routeStop) => String(routeStop.routeId))
    .filter((routeId) => routeId !== String(excludeRouteId));
  const servingRoutes = await Route.find({
    _id: { $in: routeIds },
    status: ROUTE_STATUSES.ACTIVE,
  }).select('routeNumber');
  return servingRoutes.map((servingRoute) => servingRoute.routeNumber);
}

/**
 * Ongoing trips on a route, so the passenger can choose which bus to track.
 * @param {string} routeId - Route to check.
 * @returns {Promise<object[]>} Ongoing trips with their bus.
 */
async function findRunningTripsOnRoute(routeId) {
  return Trip.find({ routeId, status: TRIP_STATUSES.ONGOING }).populate('busId');
}

/**
 * Replaces a route's stop list with a new ordered set. Sequences are renumbered from 1 so an admin
 * can reorder stops without worrying about gaps.
 * @param {string} routeId - Route being edited.
 * @param {object[]} stopList - Stops in travel order.
 * @returns {Promise<object[]>} The stored stops.
 */
async function replaceRouteStops(routeId, stopList) {
  await RouteStop.deleteMany({ routeId });
  if (!stopList || stopList.length === 0) return [];
  return RouteStop.insertMany(
    stopList.map((routeStop, stopIndex) => ({
      routeId,
      stopName: routeStop.stopName.trim(),
      latitude: routeStop.latitude,
      longitude: routeStop.longitude,
      stopSequence: stopIndex + FIRST_STOP_SEQUENCE,
      fareFromOrigin: routeStop.fareFromOrigin,
    }))
  );
}

/**
 * Creates a route and its stops (admin only).
 * @param {object} routeDetails - Route fields plus an ordered `stops` array.
 * @returns {Promise<{route: object, stops: object[]}>} The created route and stops.
 */
async function createRoute(routeDetails) {
  const existingRoute = await Route.findOne({ routeNumber: routeDetails.routeNumber.trim() });
  if (existingRoute) {
    throw new AppError('This route already exists.', HTTP_STATUS.CONFLICT, [
      { field: 'routeNumber', message: 'Another route already uses this number.' },
    ]);
  }
  const createdRoute = await Route.create({
    routeNumber: routeDetails.routeNumber.trim(),
    routeName: routeDetails.routeName.trim(),
    origin: routeDetails.origin.trim(),
    destination: routeDetails.destination.trim(),
    baseFare: routeDetails.baseFare,
    status: routeDetails.status,
  });
  const stops = await replaceRouteStops(createdRoute.id, routeDetails.stops);
  return { route: createdRoute, stops };
}

/**
 * Updates a route and, when `stops` is supplied, replaces its stop list (admin only).
 * @param {string} routeId - Route to update.
 * @param {object} routeChanges - Fields to change.
 * @returns {Promise<{route: object, stops: object[]}>} The updated route and stops.
 */
async function updateRoute(routeId, routeChanges) {
  const editableRoute = await Route.findById(routeId);
  if (!editableRoute) {
    throw new AppError('Route not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (routeChanges.routeNumber && routeChanges.routeNumber.trim() !== editableRoute.routeNumber) {
    const clashingRoute = await Route.findOne({ routeNumber: routeChanges.routeNumber.trim() });
    if (clashingRoute) {
      throw new AppError('This route number is taken.', HTTP_STATUS.CONFLICT, [
        { field: 'routeNumber', message: 'Another route already uses this number.' },
      ]);
    }
    editableRoute.routeNumber = routeChanges.routeNumber.trim();
  }
  ['routeName', 'origin', 'destination'].forEach((fieldName) => {
    if (routeChanges[fieldName] !== undefined) editableRoute[fieldName] = routeChanges[fieldName].trim();
  });
  if (routeChanges.baseFare !== undefined) editableRoute.baseFare = routeChanges.baseFare;
  if (routeChanges.status !== undefined) editableRoute.status = routeChanges.status;
  await editableRoute.save();

  const stops = routeChanges.stops
    ? await replaceRouteStops(routeId, routeChanges.stops)
    : await RouteStop.find({ routeId }).sort({ stopSequence: 1 });
  return { route: editableRoute, stops };
}

/**
 * Deletes a route, its stops and the bus assignments pointing at it (admin only).
 * A route with an ongoing trip is kept, because deleting it would strand passengers tracking that bus.
 * @param {string} routeId - Route to delete.
 * @returns {Promise<void>} Resolves once removed.
 */
async function deleteRoute(routeId) {
  const runningTripCount = await Trip.countDocuments({ routeId, status: TRIP_STATUSES.ONGOING });
  if (runningTripCount > 0) {
    throw new AppError(
      'This route has a bus running on it right now. End the trip before deleting the route.',
      HTTP_STATUS.CONFLICT
    );
  }
  await RouteStop.deleteMany({ routeId });
  await Bus.updateMany({ routeId }, { $unset: { routeId: '' } });
  await Route.findByIdAndDelete(routeId);
}

module.exports = {
  getRouteWithStops,
  searchRoutes,
  listStopNames,
  findRouteNumbersServingStop,
  findRunningTripsOnRoute,
  createRoute,
  updateRoute,
  deleteRoute,
};
