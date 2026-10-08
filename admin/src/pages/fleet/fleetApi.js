// API calls for the Live Fleet page (Member 02): the live positions, and closing a stranded trip.
import apiClient from '../../services/apiClient';

/**
 * Every bus on an ongoing trip, with the route lines to plot them against and the summary counts.
 * @returns {Promise<{fleet: object[], routePaths: object[], summary: object}>} Live fleet state.
 */
export async function fetchLiveFleet() {
  const fleetEnvelope = await apiClient.get('/admin/fleet');
  return fleetEnvelope.data;
}

/**
 * Closes a trip the driver app left running. The server refuses while the bus is still reporting.
 * @param {string} tripId - Trip to close.
 * @returns {Promise<void>} Resolves once the trip is closed.
 */
export async function endStrandedTrip(tripId) {
  await apiClient.post(`/admin/fleet/${tripId}/end`);
}
