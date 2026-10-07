// API calls for admin route management (Member 02).
import apiClient from '../../services/apiClient';

/**
 * Every route for the admin table, with stop counts, recent delays and the filter-chip counts.
 * @param {object} [listOptions] - Query options.
 * @param {string} [listOptions.status] - Narrows to one ROUTE_STATUSES value.
 * @param {string} [listOptions.searchText] - Matches number, name, origin or destination.
 * @returns {Promise<{routes: object[], statusCounts: object}>} Table rows and chip counts.
 */
export async function fetchRouteTable({ status, searchText } = {}) {
  const routeEnvelope = await apiClient.get('/admin/routes/table', {
    params: { status: status || undefined, search: searchText || undefined },
  });
  return routeEnvelope.data;
}

/**
 * One route with its stops in travel order, for the edit dialog.
 * @param {string} routeId - Route to open.
 * @returns {Promise<{route: object, stops: object[]}>} Route and ordered stops.
 */
export async function fetchRouteDetails(routeId) {
  const routeEnvelope = await apiClient.get(`/admin/routes/${routeId}`);
  return routeEnvelope.data;
}

/**
 * Creates a route and its stops.
 * @param {object} routeForm - Route fields plus an ordered `stops` array.
 * @returns {Promise<object>} The created route and stops.
 */
export async function createRoute(routeForm) {
  const routeEnvelope = await apiClient.post('/admin/routes', routeForm);
  return routeEnvelope.data;
}

/**
 * Updates a route and, when `stops` is supplied, replaces its stop list.
 * @param {string} routeId - Route to change.
 * @param {object} routeChanges - Fields to change.
 * @returns {Promise<object>} The updated route and stops.
 */
export async function updateRoute(routeId, routeChanges) {
  const routeEnvelope = await apiClient.patch(`/admin/routes/${routeId}`, routeChanges);
  return routeEnvelope.data;
}

/**
 * Deletes a route, its stops and the bus assignments pointing at it.
 * @param {string} routeId - Route to remove.
 * @returns {Promise<void>} Resolves once removed.
 */
export async function deleteRoute(routeId) {
  await apiClient.delete(`/admin/routes/${routeId}`);
}
