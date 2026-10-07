// API calls for the seat map (Member 03). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/**
 * The seat map for one trip: every seat with whether it is already taken.
 * @param {string} tripId - Trip the passenger is booking on.
 * @returns {Promise<object>} Bus details, seats, seatsPerRow and the free/taken counts.
 */
export async function fetchSeatMap(tripId) {
  const seatEnvelope = await apiClient.get(`/seats/trip/${tripId}`);
  return seatEnvelope.data;
}
