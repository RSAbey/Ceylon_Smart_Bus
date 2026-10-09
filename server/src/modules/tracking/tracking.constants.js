// Live tracking rules (Member 02): FR-02, FR-03, NFR-01.

/**
 * Average city bus speed used to turn remaining distance into minutes.
 * Colombo traffic, so deliberately conservative. Documented as an estimate in the report.
 */
const AVERAGE_BUS_SPEED_KMH = 20;

/**
 * A position older than this is treated as unusable, so the app shows "Disrupted" rather than a
 * stale arrival time. NFR-01 requires the shown position to be at most 10 s old in normal running.
 */
const LOCATION_STALE_AFTER_SECONDS = 60;

/** Drivers post their position this often; the passenger app polls at the same rate. */
const LOCATION_POST_INTERVAL_SECONDS = 5;

/** How close a bus must be to count as "at" a stop when working out how far it has progressed. */
const STOP_REACHED_RADIUS_KM = 0.25;

/** Default radius for "buses near me" on the Home screen (FR-03). */
const NEARBY_SEARCH_RADIUS_KM = 5;

const MINUTES_PER_HOUR = 60;

const SECONDS_PER_MINUTE = 60;

/**
 * A trip whose last ping is older than this is treated as stranded: the driver app has almost
 * certainly been closed without ending the trip, which leaves the bus "running" forever and blocks
 * the driver from starting their next run. Only a stranded trip may be force-ended by an admin.
 */
const STRANDED_TRIP_AFTER_MINUTES = 15;

const STRANDED_TRIP_AFTER_SECONDS = STRANDED_TRIP_AFTER_MINUTES * SECONDS_PER_MINUTE;

/** A route needs at least this many stops before progress along it can be worked out. */
const MIN_STOPS_FOR_PROGRESS = 2;

/** Service state shown on the tracking card. */
const TRACKING_STATUSES = Object.freeze({
  ON_TIME: 'onTime',
  DELAYED: 'delayed',
  DISRUPTED: 'disrupted',
});

module.exports = {
  AVERAGE_BUS_SPEED_KMH,
  LOCATION_STALE_AFTER_SECONDS,
  LOCATION_POST_INTERVAL_SECONDS,
  STOP_REACHED_RADIUS_KM,
  NEARBY_SEARCH_RADIUS_KM,
  MINUTES_PER_HOUR,
  SECONDS_PER_MINUTE,
  STRANDED_TRIP_AFTER_MINUTES,
  STRANDED_TRIP_AFTER_SECONDS,
  MIN_STOPS_FOR_PROGRESS,
  TRACKING_STATUSES,
};
