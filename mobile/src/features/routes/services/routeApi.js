// API calls for route search, details and saved routes (Member 02). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/**
 * Searches routes travelling from one stop to another (FR-04).
 * @param {object} [searchOptions] - What the passenger chose.
 * @param {string} [searchOptions.from] - Boarding stop name.
 * @param {string} [searchOptions.to] - Destination stop name.
 * @param {string} [searchOptions.search] - Free text.
 * @returns {Promise<object[]>} Matching routes with fare and stop count.
 */
export async function searchRoutes(searchOptions = {}) {
  const searchEnvelope = await apiClient.get('/routes', { params: searchOptions });
  return searchEnvelope.data.routes;
}

/**
 * Stop names for the From / To pickers.
 * @returns {Promise<string[]>} Stop names in alphabetical order.
 */
export async function fetchStopNames() {
  const stopEnvelope = await apiClient.get('/routes/stop-names');
  return stopEnvelope.data.stopNames;
}

/**
 * One route with its ordered stops and any bus currently running on it.
 * @param {string} routeId - Route to load.
 * @returns {Promise<{route: object, stops: object[], runningTrips: object[]}>} Route details.
 */
export async function fetchRouteDetails(routeId) {
  const routeEnvelope = await apiClient.get(`/routes/${routeId}`);
  return routeEnvelope.data;
}

/**
 * Other route numbers calling at a stop ("Next bus: 154, 138").
 * @param {string} routeId - Route being viewed.
 * @param {string} stopId - Stop that was expanded.
 * @returns {Promise<{stop: object, routeNumbers: string[]}>} Connecting routes.
 */
export async function fetchStopConnections(routeId, stopId) {
  const connectionEnvelope = await apiClient.get(`/routes/${routeId}/stops/${stopId}/connections`);
  return connectionEnvelope.data;
}

/**
 * The passenger's saved routes.
 * @returns {Promise<object[]>} Saved routes with their running-bus flag.
 */
export async function fetchSavedRoutes() {
  const savedEnvelope = await apiClient.get('/saved-routes');
  return savedEnvelope.data.savedRoutes;
}

/**
 * Saves a route for quick access.
 * @param {string} routeId - Route to save.
 * @returns {Promise<object>} The saved-route row.
 */
export async function saveRoute(routeId) {
  const savedEnvelope = await apiClient.post('/saved-routes', { routeId });
  return savedEnvelope.data;
}

/**
 * Removes a saved route.
 * @param {string} savedRouteId - Saved-route row to remove.
 * @returns {Promise<void>} Resolves once removed.
 */
export async function removeSavedRoute(savedRouteId) {
  await apiClient.delete(`/saved-routes/${savedRouteId}`);
}

/**
 * Remembers a journey the passenger searched for, so it appears under Recent searches.
 * @param {object} searchDetails - originText, destinationText and optional routeId.
 * @returns {Promise<object>} The stored search.
 */
export async function recordRecentSearch(searchDetails) {
  const searchEnvelope = await apiClient.post('/recent-searches', searchDetails);
  return searchEnvelope.data;
}

/**
 * The passenger's recent searches.
 * @returns {Promise<object[]>} Recent searches, newest first.
 */
export async function fetchRecentSearches() {
  const recentEnvelope = await apiClient.get('/recent-searches');
  return recentEnvelope.data.recentSearches;
}

/**
 * Clears every recent search ("Clear all").
 * @returns {Promise<void>} Resolves once cleared.
 */
export async function clearRecentSearches() {
  await apiClient.delete('/recent-searches');
}
