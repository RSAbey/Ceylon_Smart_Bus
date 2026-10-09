// Live tracking business logic (Member 02): record driver positions and work out arrival times.
// ETA adds the active delay from Member 04's delayService, which is how FR-08 reaches passengers.
const BusLocation = require('./busLocation.model');
const Trip = require('../trips/trip.model');
const RouteStop = require('../routes/routeStop.model');
const Bus = require('../buses/bus.model');
const { BUS_STATUSES } = require('../buses/bus.constants');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const delayService = require('../delays/delay.service');
const ticketService = require('../tickets/ticket.service');
const { getDistanceInKm } = require('../../utils/geoDistance');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');
const {
  AVERAGE_BUS_SPEED_KMH,
  LOCATION_STALE_AFTER_SECONDS,
  MIN_STOPS_FOR_PROGRESS,
  MINUTES_PER_HOUR,
  NEARBY_SEARCH_RADIUS_KM,
  SECONDS_PER_MINUTE,
  STOP_REACHED_RADIUS_KM,
  STRANDED_TRIP_AFTER_SECONDS,
  TRACKING_STATUSES,
} = require('./tracking.constants');

const MILLISECONDS_PER_SECOND = 1000;
const FIRST_STOP_INDEX = 0;
const PERCENT_SCALE = 100;

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
 * Decides the service state shown on the fleet row: no usable position means there is nothing
 * honest to say about arrival, so the bus reads as Disrupted rather than On time.
 * @param {boolean} hasUsablePosition - Whether the latest ping is fresh enough to trust.
 * @param {number} delayMinutes - Active delay from Member 04's delayService.
 * @returns {string} A TRACKING_STATUSES value.
 */
function decideLiveStatus(hasUsablePosition, delayMinutes) {
  if (!hasUsablePosition) return TRACKING_STATUSES.DISRUPTED;
  return delayMinutes > 0 ? TRACKING_STATUSES.DELAYED : TRACKING_STATUSES.ON_TIME;
}

/**
 * How far along its route a bus has got, for the fleet list.
 * @param {{latitude: number, longitude: number} | null} busPosition - Latest bus position.
 * @param {object[]} orderedStops - Route stops sorted by stopSequence.
 * @returns {{nextStopName: string|null, stopsRemaining: number|null, progressPercent: number|null}}
 *   Progress along the route, all null when it cannot be worked out.
 */
function summariseRouteProgress(busPosition, orderedStops) {
  const emptyProgress = { nextStopName: null, stopsRemaining: null, progressPercent: null };
  if (!busPosition || orderedStops.length < MIN_STOPS_FOR_PROGRESS) return emptyProgress;

  const lastStopIndex = orderedStops.length - 1;
  const currentStopIndex = findCurrentStopIndex(busPosition, orderedStops);
  const nextStopIndex = Math.min(currentStopIndex + 1, lastStopIndex);
  return {
    nextStopName: orderedStops[nextStopIndex].stopName,
    stopsRemaining: lastStopIndex - currentStopIndex,
    progressPercent: Math.round((currentStopIndex / lastStopIndex) * PERCENT_SCALE),
  };
}

/**
 * Reads the stops of several routes in one query and groups them by route, so the fleet map can
 * draw each route line without a query per bus.
 * @param {string[]} routeIds - Routes currently being served.
 * @returns {Promise<Map<string, object[]>>} Ordered stops keyed by route id.
 */
async function loadStopsByRoute(routeIds) {
  const routeStops = await RouteStop.find({ routeId: { $in: routeIds } }).sort({ stopSequence: 1 });
  const stopsByRoute = new Map();
  routeStops.forEach((routeStop) => {
    const routeKey = String(routeStop.routeId);
    if (!stopsByRoute.has(routeKey)) stopsByRoute.set(routeKey, []);
    stopsByRoute.get(routeKey).push(routeStop);
  });
  return stopsByRoute;
}

/**
 * Builds one row of the admin fleet list: who is driving what, where it is and how it is running.
 * Unlike the passenger feed this does name the driver, because operations staff need to call them.
 * @param {object} runningTrip - Ongoing trip with route, bus and driver populated.
 * @param {object[]} orderedStops - Stops of the route it is serving.
 * @returns {Promise<object>} One fleet row.
 */
async function buildFleetRow(runningTrip, orderedStops) {
  const positionAgeSeconds = getPositionAgeSeconds(runningTrip.lastLocationAt);
  const hasUsablePosition =
    positionAgeSeconds !== null && positionAgeSeconds <= LOCATION_STALE_AFTER_SECONDS;
  const busPosition =
    runningTrip.lastLatitude === undefined
      ? null
      : { latitude: runningTrip.lastLatitude, longitude: runningTrip.lastLongitude };

  // Speed lives on the ping rather than the trip, so the newest ping is read for this one field.
  const [latestPing, delayMinutes, ticketHolderIds] = await Promise.all([
    BusLocation.findOne({ tripId: runningTrip.id }).sort({ recordedAt: -1 }).select('speedKmh'),
    delayService.getActiveDelayMinutes(runningTrip.id),
    ticketService.getActiveTicketHolderIds(runningTrip.id),
  ]);

  const driverProfile = runningTrip.driverId;
  return {
    tripId: runningTrip.id,
    route: runningTrip.routeId,
    bus: runningTrip.busId,
    driver: driverProfile
      ? {
          id: driverProfile.id,
          fullName: driverProfile.userId?.fullName,
          mobile: driverProfile.userId?.mobile,
          licenseNumber: driverProfile.licenseNumber,
        }
      : null,
    position: busPosition,
    positionAgeSeconds,
    speedKmh: hasUsablePosition ? (latestPing?.speedKmh ?? null) : null,
    delayMinutes,
    liveStatus: decideLiveStatus(hasUsablePosition, delayMinutes),
    isStranded: positionAgeSeconds === null || positionAgeSeconds >= STRANDED_TRIP_AFTER_SECONDS,
    passengerCount: ticketHolderIds.length,
    startedAt: runningTrip.startedAt,
    ...summariseRouteProgress(hasUsablePosition ? busPosition : null, orderedStops),
  };
}

/**
 * Counts the figures above the fleet map: how the running buses are doing, and how many roadworthy
 * buses are not out at all, which is the number an administrator acts on.
 * @param {object[]} fleet - Rows from buildFleetRow.
 * @param {string[]} runningBusIds - Buses currently on a trip.
 * @returns {Promise<object>} Fleet summary counts.
 */
async function summariseFleet(fleet, runningBusIds) {
  const idleBusCount = await Bus.countDocuments({
    status: BUS_STATUSES.ACTIVE,
    _id: { $nin: runningBusIds },
  });
  const countWithStatus = (liveStatus) =>
    fleet.filter((fleetRow) => fleetRow.liveStatus === liveStatus).length;

  return {
    runningCount: fleet.length,
    onTimeCount: countWithStatus(TRACKING_STATUSES.ON_TIME),
    delayedCount: countWithStatus(TRACKING_STATUSES.DELAYED),
    disruptedCount: countWithStatus(TRACKING_STATUSES.DISRUPTED),
    strandedCount: fleet.filter((fleetRow) => fleetRow.isStranded).length,
    idleBusCount,
    passengersOnBoard: fleet.reduce((runningTotal, fleetRow) => runningTotal + fleetRow.passengerCount, 0),
  };
}

/**
 * Everything the admin Live Fleet screen shows: each running bus, the route lines to plot them
 * against, and the summary counts above the map.
 * @returns {Promise<{fleet: object[], routePaths: object[], summary: object}>} Live fleet state.
 */
async function getFleetPositions() {
  const runningTrips = await Trip.find({ status: TRIP_STATUSES.ONGOING })
    .populate('routeId')
    .populate('busId')
    .populate({ path: 'driverId', populate: { path: 'userId', select: 'fullName mobile' } });

  const servedRouteIds = [
    ...new Set(runningTrips.map((runningTrip) => String(runningTrip.routeId?.id)).filter(Boolean)),
  ];
  const stopsByRoute = await loadStopsByRoute(servedRouteIds);

  const fleet = await Promise.all(
    runningTrips.map((runningTrip) =>
      buildFleetRow(runningTrip, stopsByRoute.get(String(runningTrip.routeId?.id)) || [])
    )
  );
  const runningBusIds = runningTrips
    .map((runningTrip) => runningTrip.busId?.id)
    .filter(Boolean);

  const routePaths = servedRouteIds.map((routeId) => ({
    routeId,
    stops: (stopsByRoute.get(routeId) || []).map((routeStop) => ({
      stopName: routeStop.stopName,
      stopSequence: routeStop.stopSequence,
      latitude: routeStop.latitude,
      longitude: routeStop.longitude,
    })),
  }));

  return { fleet, routePaths, summary: await summariseFleet(fleet, runningBusIds) };
}

/**
 * Force-ends a trip the driver app left running. Allowed only once the bus has stopped reporting
 * for STRANDED_TRIP_AFTER_SECONDS: while the feed is live the driver is still on the road, and
 * ending their trip from here would take a bus off the passenger map mid-journey.
 * @param {string} tripId - Trip to close.
 * @returns {Promise<object>} The closed trip.
 */
async function endStrandedTrip(tripId) {
  const strandedTrip = await Trip.findById(tripId);
  if (!strandedTrip) {
    throw new AppError('Trip not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (strandedTrip.status !== TRIP_STATUSES.ONGOING) {
    throw new AppError('This trip has already finished.', HTTP_STATUS.BAD_REQUEST);
  }

  const positionAgeSeconds = getPositionAgeSeconds(strandedTrip.lastLocationAt);
  const isStranded = positionAgeSeconds === null || positionAgeSeconds >= STRANDED_TRIP_AFTER_SECONDS;
  if (!isStranded) {
    throw new AppError(
      `This bus reported its position ${Math.round(positionAgeSeconds / SECONDS_PER_MINUTE)} minute(s) ago, so the trip is still running. Ask the driver to end it from the driver app.`,
      HTTP_STATUS.CONFLICT
    );
  }

  strandedTrip.status = TRIP_STATUSES.CANCELLED;
  strandedTrip.endedAt = new Date();
  await strandedTrip.save();
  return strandedTrip;
}

module.exports = {
  recordBusLocation,
  getTripTracking,
  findNearbyBuses,
  getFleetPositions,
  endStrandedTrip,
};
