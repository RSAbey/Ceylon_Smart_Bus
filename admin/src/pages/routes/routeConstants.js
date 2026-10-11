// Reference data for admin route management. Must match server/src/modules/routes/route.constants.js.

export const ROUTE_STATUSES = Object.freeze({
  ACTIVE: 'active',
  DRAFT: 'draft',
  SUSPENDED: 'suspended',
});

export const ROUTE_STATUS_BADGES = Object.freeze({
  [ROUTE_STATUSES.ACTIVE]: { status: 'active', label: 'Active' },
  [ROUTE_STATUSES.DRAFT]: { status: 'cancelled', label: 'Draft' },
  [ROUTE_STATUSES.SUSPENDED]: { status: 'invalid', label: 'Suspended' },
});

export const ROUTE_STATUS_FILTERS = Object.freeze([
  { label: 'All routes', status: '' },
  { label: 'Active', status: ROUTE_STATUSES.ACTIVE },
  { label: 'Draft', status: ROUTE_STATUSES.DRAFT },
  { label: 'Suspended', status: ROUTE_STATUSES.SUSPENDED },
]);

/** Service times are "HH:MM" on a 24-hour clock. Must match the server pattern. */
export const SERVICE_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A route needs a start and an end before it means anything. */
export const MIN_STOPS_PER_ROUTE = 2;

/** Above this many delay reports in the window, the table highlights the route. */
export const BUSY_DELAY_THRESHOLD = 3;

export const ROUTE_MESSAGES = Object.freeze({
  addTitle: 'Add route',
  addSubtitle: 'Create a new route with stops, schedule and fare',
  editTitle: 'Edit route',
  stopsHeading: 'Stops',
  stopsHint:
    'In travel order. Each stop needs a position and a fare from the first stop, because the live map and the ETA are built from them.',
  addStop: 'Add stop',
  searchHint:
    'In travel order. Type a place and choose it from the list, the way you would on a map; that is what gives the stop its position.',
  pickFromList: 'Choose this place from the list so the stop has a position on the map.',
  searching: 'Looking for places...',
  noPlacesFound: 'No place of that name was found. Type the coordinates under Details instead.',
  positionFromMap: 'Position taken from the map',
  suspend: 'Suspend route',
  tooFewStops: 'Add at least two stops: where the route starts and where it ends.',
  fareOrderWarning:
    'Fares should not fall along the route. Check the fare from the first stop on each row.',
});

/** Wait this long after the last keystroke before asking for suggestions. The geocoder asks for no
 *  more than one request a second, and nobody wants a request per letter either. */
export const PLACE_SEARCH_DEBOUNCE_MS = 450;

/** Below this many characters a search is not worth making. Matches the server's own rule. */
export const MIN_PLACE_QUERY_LENGTH = 2;
