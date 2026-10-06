// Constants for the live tracking feature (Member 02). Put values here instead of magic numbers in screens.

export const TRACKING_CONSTANTS = Object.freeze({});

/** Service states the tracking card can show; must match the server's TRACKING_STATUSES. */
export const TRACKING_STATUSES = Object.freeze({
  ON_TIME: 'onTime',
  DELAYED: 'delayed',
  DISRUPTED: 'disrupted',
});

/** Caption under the arrival time for each state (screens 10 to 12). */
export const TRACKING_CAPTIONS = Object.freeze({
  [TRACKING_STATUSES.ON_TIME]: 'Next bus at your stop',
  [TRACKING_STATUSES.DELAYED]: 'Next bus at your stop',
  [TRACKING_STATUSES.DISRUPTED]: 'Service disrupted on this route',
});

/** Shown in place of the number of minutes when there is no usable position. */
export const NO_ETA_PLACEHOLDER = '—';

/** How far the map zooms around the bus; roughly a few kilometres across. */
export const MAP_LATITUDE_DELTA = 0.05;
export const MAP_LONGITUDE_DELTA = 0.05;

/** Fallback centre (Colombo) used before the first position arrives. */
export const COLOMBO_CENTRE = Object.freeze({ latitude: 6.9271, longitude: 79.8612 });

/** Driver location reporting while a trip runs. */
export const DRIVER_LOCATION_INTERVAL_MS = 5000;
