// Live tracking business logic (Member 02): record driver positions and work out arrival times.
// ETA adds the active delay from Member 04's delayService, which is how FR-08 reaches passengers.
const BusLocation = require('./busLocation.model');
const Trip = require('../trips/trip.model');
const RouteStop = require('../routes/routeStop.model');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const delayService = require('../delays/delay.service');
const { getDistanceInKm } = require('../../utils/geoDistance');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');
const {
  AVERAGE_BUS_SPEED_KMH,
  LOCATION_STALE_AFTER_SECONDS,
  MINUTES_PER_HOUR,
  NEARBY_SEARCH_RADIUS_KM,
  STOP_REACHED_RADIUS_KM,
  TRACKING_STATUSES,
} = require('./tracking.constants');

const MILLISECONDS_PER_SECOND = 1000;
const FIRST_STOP_INDEX = 0;

/**
 * Stores one GPS ping and copies it onto the trip, so passengers can read the latest position
 * from a single document instead of scanning the history.
 * @param {string} tripId - Ongoing trip the driver is running.
 * @param {string} driverId - DriverProfile id of the caller, checked against the trip.
 * @param {object} position - Reported position.
 * @param {number} position.latitude - Latitude.
 * @param {number} position.longitude - Longitude.
 * @param {number} [position.speedKmh] - Current speed.
 * @returns {Promise<object>} The updated trip.
 */
async function recordBusLocation(tripId, driverId, { latitude, longitude, speedKmh }) {
  const ongoingTrip = await Trip.findById(tripId);
  if (!ongoingTrip) {
    throw new AppError('Trip not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (String(ongoingTrip.driverId) !== String(driverId)) {
    throw new AppError('You can only post the position of your own trip.', HTTP_STATUS.FORBIDDEN);
  }
  if (ongoingTrip.status !== TRIP_STATUSES.ONGOING) {
    throw new AppError('This trip is not running.', HTTP_STATUS.BAD_REQUEST);
  }

  const recordedAt = new Date();
  await BusLocation.create({ tripId, latitude, longitude, speedKmh, recordedAt });

  ongoingTrip.lastLatitude = latitude;
  ongoingTrip.lastLongitude = longitude;
  ongoingTrip.lastLocationAt = recordedAt;
  await ongoingTrip.save();
  return ongoingTrip;
}

/**
 * Works out how old a position is, in seconds.
 * @param {Date} [lastLocationAt] - When the position was recorded.
 * @returns {number | null} Age in seconds, or null when there is no position at all.
 */
function getPositionAgeSeconds(lastLocationAt) {
  if (!lastLocationAt) return null;
  return Math.round((Date.now() - new Date(lastLocationAt).getTime()) / MILLISECONDS_PER_SECOND);
}

/**
 * Finds how far along its route the bus is, as an index into the ordered stop list.
 * The bus is "at" the nearest stop; everything after that index is still ahead of it.
 * @param {{latitude: number, longitude: number}} busPosition - Latest bus position.
 * @param {object[]} orderedStops - Route stops sorted by stopSequence.
 * @returns {number} Index of the stop the bus has most recently reached.
 */
function findCurrentStopIndex(busPosition, orderedStops) {
  let nearestIndex = FIRST_STOP_INDEX;
  let shortestDistanceKm = Number.POSITIVE_INFINITY;
  orderedStops.forEach((routeStop, stopIndex) => {
    const distanceKm = getDistanceInKm(busPosition, routeStop);
    if (distanceKm < shortestDistanceKm) {
      shortestDistanceKm = distanceKm;
      nearestIndex = stopIndex;
    }
  });
  // Once the bus is essentially at a stop, treat the following stop as the next one.
  const hasReachedNearestStop = shortestDistanceKm <= STOP_REACHED_RADIUS_KM;
  return hasReachedNearestStop ? nearestIndex : Math.max(FIRST_STOP_INDEX, nearestIndex - 1);
}

/**
 * Distance the bus still has to travel to reach a stop, following the route through intermediate stops.
 * @param {{latitude: number, longitude: number}} busPosition - Latest bus position.
 * @param {object[]} orderedStops - Route stops sorted by stopSequence.
 * @param {number} currentStopIndex - Where the bus is now.
 * @param {number} targetStopIndex - Stop the passenger is waiting at.
 * @returns {number} Distance in kilometres.
 */
function getRemainingDistanceKm(busPosition, orderedStops, currentStopIndex, targetStopIndex) {
  let remainingKm = getDistanceInKm(busPosition, orderedStops[currentStopIndex + 1] || orderedStops[targetStopIndex]);
  for (let stopIndex = currentStopIndex + 1; stopIndex < targetStopIndex; stopIndex += 1) {
    remainingKm += getDistanceInKm(orderedStops[stopIndex], orderedStops[stopIndex + 1]);
  }
  return remainingKm;
}

/**
 * Turns a distance into whole minutes at the assumed average speed.
 * @param {number} distanceKm - Distance still to travel.
 * @returns {number} Minutes, rounded up so the passenger is never told to hurry too late.
 */
function distanceToMinutes(distanceKm) {
  return Math.ceil((distanceKm / AVERAGE_BUS_SPEED_KMH) * MINUTES_PER_HOUR);
}

/**
 * Builds the live tracking card for one trip: position, service status and arrival time (FR-02, FR-08).
 * @param {string} tripId - Trip to track.
 * @param {string} [targetStopId] - Stop the passenger is waiting at; defaults to the final stop.
 * @returns {Promise<object>} Tracking details for the app.
 */
async function getTripTracking(tripId, targetStopId) {
  const trackedTrip = await Trip.findById(tripId).populate('routeId').populate('busId');
  if (!trackedTrip) {
    throw new AppError('Trip not found.', HTTP_STATUS.NOT_FOUND);
  }

  const orderedStops = await RouteStop.find({ routeId: trackedTrip.routeId.id }).sort({ stopSequence: 1 });
  const positionAgeSeconds = getPositionAgeSeconds(trackedTrip.lastLocationAt);
  const delayMinutes = await delayService.getActiveDelayMinutes(tripId);

  const isTripRunning = trackedTrip.status === TRIP_STATUSES.ONGOING;
  const hasUsablePosition =
    isTripRunning && positionAgeSeconds !== null && positionAgeSeconds <= LOCATION_STALE_AFTER_SECONDS;

  const trackingCard = {
    tripId: trackedTrip.id,
    route: trackedTrip.routeId,
    bus: trackedTrip.busId,
    stops: orderedStops,
    position: hasUsablePosition
      ? { latitude: trackedTrip.lastLatitude, longitude: trackedTrip.lastLongitude }
      : null,
    positionAgeSeconds,
    delayMinutes,
    // Without a fresh position there is no honest arrival time, so the app shows "Disrupted".
    status: !hasUsablePosition
      ? TRACKING_STATUSES.DISRUPTED
      : delayMinutes > 0
        ? TRACKING_STATUSES.DELAYED
        : TRACKING_STATUSES.ON_TIME,
    etaMinutes: null,
    currentStopId: null,
    targetStopId: null,
  };

  if (!hasUsablePosition || orderedStops.length === 0) return trackingCard;

  const currentStopIndex = findCurrentStopIndex(trackingCard.position, orderedStops);
  const requestedIndex = targetStopId
    ? orderedStops.findIndex((routeStop) => String(routeStop.id) === String(targetStopId))
    : orderedStops.length - 1;
  const targetStopIndex = requestedIndex === -1 ? orderedStops.length - 1 : requestedIndex;

  trackingCard.currentStopId = orderedStops[currentStopIndex].id;
  trackingCard.targetStopId = orderedStops[targetStopIndex].id;

  // The bus has already passed this stop, so there is no arrival time left to give.
  if (targetStopIndex <= currentStopIndex) {
    trackingCard.etaMinutes = 0;
    return trackingCard;
  }

  const remainingKm = getRemainingDistanceKm(
    trackingCard.position,
    orderedStops,
    currentStopIndex,
    targetStopIndex
  );
  trackingCard.remainingDistanceKm = Number(remainingKm.toFixed(2));
  trackingCard.etaMinutes = distanceToMinutes(remainingKm) + delayMinutes;
  return trackingCard;
}

/**
 * Lists ongoing trips whose bus is within a radius of the passenger, nearest first (FR-03).
 * The driver is never identified: only the bus position is exposed (NFR-08).
 * @param {object} searchArea - Where the passenger is.
 * @param {number} searchArea.latitude - Passenger latitude.
 * @param {number} searchArea.longitude - Passenger longitude.
 * @param {number} [searchArea.radiusKm] - Search radius.
 * @returns {Promise<object[]>} Nearby buses with their route and distance.
 */
async function findNearbyBuses({ latitude, longitude, radiusKm = NEARBY_SEARCH_RADIUS_KM }) {
  const runningTrips = await Trip.find({ status: TRIP_STATUSES.ONGOING })
    .populate('routeId')
    .populate('busId');

  return runningTrips
    .filter((runningTrip) => {
      const positionAgeSeconds = getPositionAgeSeconds(runningTrip.lastLocationAt);
      return positionAgeSeconds !== null && positionAgeSeconds <= LOCATION_STALE_AFTER_SECONDS;
    })
    .map((runningTrip) => ({
      tripId: runningTrip.id,
      route: runningTrip.routeId,
      busName: runningTrip.busId?.busName,
      plateNumber: runningTrip.busId?.plateNumber,
      position: { latitude: runningTrip.lastLatitude, longitude: runningTrip.lastLongitude },
      distanceKm: Number(
        getDistanceInKm(
          { latitude, longitude },
          { latitude: runningTrip.lastLatitude, longitude: runningTrip.lastLongitude }
        ).toFixed(2)
      ),
    }))
    .filter((nearbyBus) => nearbyBus.distanceKm <= radiusKm)
    .sort((firstBus, secondBus) => firstBus.distanceKm - secondBus.distanceKm);
}

/**
 * Every ongoing trip with its latest position, for the admin live fleet map.
 * @returns {Promise<object[]>} Ongoing trips with route, bus and position.
 */
async function getFleetPositions() {
  const runningTrips = await Trip.find({ status: TRIP_STATUSES.ONGOING })
    .populate('routeId')
    .populate('busId');

  return Promise.all(
    runningTrips.map(async (runningTrip) => ({
      tripId: runningTrip.id,
      route: runningTrip.routeId,
      bus: runningTrip.busId,
      position:
        runningTrip.lastLatitude === undefined
          ? null
          : { latitude: runningTrip.lastLatitude, longitude: runningTrip.lastLongitude },
      positionAgeSeconds: getPositionAgeSeconds(runningTrip.lastLocationAt),
      delayMinutes: await delayService.getActiveDelayMinutes(runningTrip.id),
      startedAt: runningTrip.startedAt,
    }))
  );
}

module.exports = {
  recordBusLocation,
  getTripTracking,
  findNearbyBuses,
  getFleetPositions,
};
