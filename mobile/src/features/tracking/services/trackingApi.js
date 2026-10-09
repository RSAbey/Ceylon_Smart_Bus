// API calls for live tracking and driver trips (Member 02).
import apiClient from '../../../services/apiClient';

/**
 * Live position, service status and arrival time for one bus (FR-02).
 * @param {string} tripId - Trip being tracked.
 * @param {string} [stopId] - Stop the passenger is waiting at.
 * @returns {Promise<object>} Tracking card.
 */
export async function fetchTripTracking(tripId, stopId) {
  const trackingEnvelope = await apiClient.get(`/tracking/trips/${tripId}`, {
    params: stopId ? { stopId } : undefined,
  });
  return trackingEnvelope.data;
}

/**
 * Buses running near the passenger (FR-03).
 * @param {object} position - Where the passenger is.
 * @param {number} position.latitude - Latitude.
 * @param {number} position.longitude - Longitude.
 * @param {number} [position.radiusKm] - Search radius.
 * @returns {Promise<object[]>} Nearby buses, nearest first.
 */
export async function fetchNearbyBuses({ latitude, longitude, radiusKm }) {
  const nearbyEnvelope = await apiClient.get('/tracking/nearby', {
    params: { lat: latitude, lng: longitude, radiusKm },
  });
  return nearbyEnvelope.data.buses;
}

/**
 * The driver's assigned bus, route, stops and running trip.
 * @returns {Promise<object>} Trip overview.
 */
export async function fetchMyTripOverview() {
  const tripEnvelope = await apiClient.get('/trips/mine');
  return tripEnvelope.data;
}

/**
 * Starts a trip on the driver's assigned bus.
 * @returns {Promise<object>} The new trip.
 */
export async function startTrip() {
  const tripEnvelope = await apiClient.post('/trips/start');
  return tripEnvelope.data;
}

/**
 * Ends the driver's running trip.
 * @param {boolean} [isCancelled] - True to mark the trip cancelled rather than completed.
 * @returns {Promise<object>} The finished trip.
 */
export async function endTrip(isCancelled = false) {
  const tripEnvelope = await apiClient.post('/trips/end', { isCancelled });
  return tripEnvelope.data;
}

/**
 * Reports the bus position while a trip is running (NFR-01).
 * @param {string} tripId - Running trip.
 * @param {object} position - Current position.
 * @param {number} position.latitude - Latitude.
 * @param {number} position.longitude - Longitude.
 * @param {number} [position.speedKmh] - Speed.
 * @returns {Promise<object>} Confirmation with the recorded time.
 */
export async function postBusLocation(tripId, { latitude, longitude, speedKmh }) {
  const locationEnvelope = await apiClient.post('/tracking/location', {
    tripId,
    latitude,
    longitude,
    speedKmh,
  });
  return locationEnvelope.data;
}
