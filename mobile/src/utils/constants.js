// App-wide constants (timeouts, polling intervals, storage keys, roles, route paths). No magic numbers in screens.

/** Requests slower than this fail with a "check your connection" error instead of hanging. */
export const API_TIMEOUT_MS = 15000;

/** Port the API listens on (server/.env PORT). Used to derive the dev API address from the Metro host. */
export const API_PORT = 5000;

/** Live bus position refresh — the API keeps positions at most 10 s old (NFR-01). */
export const TRACKING_POLL_INTERVAL_MS = 5000;

/** Notification list / unread badge refresh (PROJECT_PLAN.md 3.3). */
export const NOTIFICATION_POLL_INTERVAL_MS = 30000;

/** Wait this long after the last keystroke before searching. */
export const SEARCH_DEBOUNCE_MS = 400;

export const SECURE_STORE_KEYS = Object.freeze({
  accessToken: 'ceylonSmartBus.accessToken',
  /** "yes" when the user ticked Remember me, so the session survives closing the app. */
  shouldRememberSession: 'ceylonSmartBus.shouldRememberSession',
});

export const REMEMBER_SESSION_FLAG = Object.freeze({ yes: 'yes', no: 'no' });

/** Must match server/src/modules/users/user.constants.js. */
export const USER_ROLES = Object.freeze({
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  ADMIN: 'admin',
});

/** Landing route for each role after sign-in. */
export const ROLE_HOME_ROUTES = Object.freeze({
  [USER_ROLES.PASSENGER]: '/(passenger)/(tabs)/home',
  [USER_ROLES.DRIVER]: '/(driver)/(tabs)/dashboard',
});

export const LOGIN_ROUTE = '/(auth)/login';
