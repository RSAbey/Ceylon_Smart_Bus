// Reference data for the admin Live Fleet screen.
// Must match server/src/modules/tracking/tracking.constants.js.

export const LIVE_STATUSES = Object.freeze({
  ON_TIME: 'onTime',
  DELAYED: 'delayed',
  DISRUPTED: 'disrupted',
});

export const FLEET_STATUS_FILTERS = Object.freeze([
  { label: 'All buses', liveStatus: '' },
  { label: 'On time', liveStatus: LIVE_STATUSES.ON_TIME },
  { label: 'Delayed', liveStatus: LIVE_STATUSES.DELAYED },
  { label: 'No signal', liveStatus: LIVE_STATUSES.DISRUPTED },
]);

/**
 * The driver app posts a position every 5 s. The dashboard refreshes half as often, which is fresh
 * enough for a control room and keeps a table an administrator is reading from flickering.
 */
export const FLEET_REFRESH_INTERVAL_MS = 10000;

/** Mirrors STRANDED_TRIP_AFTER_MINUTES on the server: when a trip may be force-ended. */
export const STRANDED_TRIP_AFTER_MINUTES = 15;

const SECONDS_PER_MINUTE = 60;

export const FLEET_MESSAGES = Object.freeze({
  title: 'Live Fleet',
  subtitle: 'Every bus on an ongoing trip, from its latest GPS ping',
  mapCaption:
    'Positions are plotted by longitude and latitude from the newest ping of each bus, over the stops of the routes being served.',
  noPositions: 'No bus is reporting a position right now.',
  emptyTitle: 'No bus matches',
  emptyMessage: 'Clear the filter, or wait for a driver to start a trip.',
  strandedHeading: 'Trips left running',
  strandedExplanation: `A driver app that closes without ending its trip leaves the bus running here, and the driver cannot start their next run. Closing the trip from here only ends the record after ${STRANDED_TRIP_AFTER_MINUTES} minutes of silence.`,
  closeTripConfirm: 'End this trip?',
  closeTripLabel: 'End trip',
});

/**
 * Turns the age of a ping into words. Seconds for a live feed, minutes once it is stale, because
 * "412 s ago" is harder to read than "7 min ago".
 * @param {number | null} positionAgeSeconds - Age of the newest ping, or null when there is none.
 * @returns {string} Age for the table, for example "4 s ago".
 */
export function describePingAge(positionAgeSeconds) {
  if (positionAgeSeconds === null || positionAgeSeconds === undefined) return 'No ping yet';
  if (positionAgeSeconds < SECONDS_PER_MINUTE) return `${positionAgeSeconds} s ago`;
  return `${Math.round(positionAgeSeconds / SECONDS_PER_MINUTE)} min ago`;
}

/**
 * How long a bus has been silent, written as a sentence for the warning strip and the confirm
 * dialog, where "No ping yet" would not read as English.
 * @param {number | null} positionAgeSeconds - Age of the newest ping, or null when there is none.
 * @returns {string} For example "last reported a position 22 min ago".
 */
export function describeSilence(positionAgeSeconds) {
  if (positionAgeSeconds === null || positionAgeSeconds === undefined) {
    return 'has not reported a position since the trip started';
  }
  return `last reported a position ${describePingAge(positionAgeSeconds)}`;
}

/**
 * The badge for one bus. Every status is named in words as well as coloured (NFR-09), and a delay
 * carries its size so an administrator can tell 2 minutes from 40.
 * @param {object} fleetRow - One row from GET /api/admin/fleet.
 * @returns {{status: string, label: string}} Props for StatusBadge.
 */
export function describeLiveStatus(fleetRow) {
  if (fleetRow.liveStatus === LIVE_STATUSES.DELAYED) {
    return { status: 'delayed', label: `Delayed ${fleetRow.delayMinutes} min` };
  }
  if (fleetRow.liveStatus === LIVE_STATUSES.DISRUPTED) {
    return {
      status: 'disrupted',
      label: fleetRow.isStranded ? 'Silent, trip left running' : 'No signal',
    };
  }
  return { status: 'onTime', label: 'On time' };
}
