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

/** Fallback centre (Colombo) used before the first position arrives. */
export const COLOMBO_CENTRE = Object.freeze({ latitude: 6.9271, longitude: 79.8612 });

export const MAP_MESSAGES = Object.freeze({
  busLabel: 'The bus',
  driverBusLabel: 'Your bus',
  mapFailed:
    'The map could not load. It needs a connection for the street tiles; the stops and times below are still live.',
});

/** Driver location reporting while a trip runs. */
export const DRIVER_LOCATION_INTERVAL_MS = 5000;

/** Wording on the driver's My Routes tab. */
export const DRIVER_ROUTE_MESSAGES = Object.freeze({
  title: 'My Routes',
  subtitle: 'The route your assigned bus serves',
  stopsHeading: 'Stops in travel order',
  noRouteTitle: 'No route assigned',
  noRouteMessage: 'An administrator assigns a route to your bus. Ask them to set one before your shift.',
});

/** Wording on the driver's Live Tracking tab. */
export const DRIVER_LIVE_MESSAGES = Object.freeze({
  title: 'Live Tracking',
  onDuty: 'On Duty',
  offDuty: 'Off Duty',
  gpsStrong: 'GPS Strong',
  gpsWeak: 'GPS Weak',
  gpsNone: 'No GPS',
  nextStop: 'Next Stop',
  speed: 'Speed',
  status: 'Status',
  reportDelay: 'Report Delay',
  endTrip: 'End Trip',
  startTrip: 'Start Trip',
  notStartedTitle: 'You are not on a trip',
  notStartedMessage: 'Start your run so passengers can track this bus and buy tickets for it.',
  endConfirmTitle: 'End this trip?',
  endConfirmMessage: 'Passengers will stop seeing this bus on the live map.',
});

/** A position older than this is treated as a weak GPS fix on the driver's own screen. */
export const WEAK_GPS_AFTER_SECONDS = 20;
