// API calls for the Home screens (Member 04).
import apiClient from '../../../services/apiClient';

/**
 * Everything the passenger Home screen shows, in one call (NFR-05).
 * @param {object} [position] - The passenger's location, when they have allowed it.
 * @param {number} [position.latitude] - Latitude.
 * @param {number} [position.longitude] - Longitude.
 * @returns {Promise<object>} Name, nearby buses, saved routes and recent searches.
 */
export async function fetchPassengerHome(position = {}) {
  const hasLocation = position.latitude !== undefined && position.longitude !== undefined;
  const homeEnvelope = await apiClient.get('/home/passenger', {
    params: hasLocation ? { lat: position.latitude, lng: position.longitude } : undefined,
  });
  return homeEnvelope.data;
}

/**
 * The driver dashboard: assigned bus, running trip and any active delay.
 * @returns {Promise<object>} Driver home details.
 */
export async function fetchDriverHome() {
  const homeEnvelope = await apiClient.get('/home/driver');
  return homeEnvelope.data;
}
