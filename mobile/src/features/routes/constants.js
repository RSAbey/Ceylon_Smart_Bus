// Constants for the routes feature (Member 02). Put values here instead of magic strings in screens.

export const ROUTES_CONSTANTS = Object.freeze({});

/** Labels on the Route Details stop timeline. */
export const STOP_BADGES = Object.freeze({
  current: 'Current stop',
  terminus: 'Terminus',
  expanded: 'Expanded',
});

export const SEARCH_MESSAGES = Object.freeze({
  destinationRequired: 'Choose where you are going.',
  sameStops: 'Choose two different stops.',
  noResults: 'No bus runs between those stops yet.',
});

/** Empty-state copy for Saved Routes (screen 16). */
export const SAVED_ROUTES_EMPTY = Object.freeze({
  title: 'No saved routes yet',
  message: 'Save your frequent routes for quick access and live tracking.',
  actionLabel: 'Add your first route',
});
