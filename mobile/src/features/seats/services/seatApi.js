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

/**
 * Who has reserved a seat on the trip the driver is running.
 * @returns {Promise<object>} Seat counts, the accepting-bookings flag and a row per booking.
 */
export async function fetchTripBookings() {
  const bookingEnvelope = await apiClient.get('/seats/bookings');
  return bookingEnvelope.data;
}

/**
 * Opens or closes the running trip to new seat reservations.
 * @param {boolean} isAcceptingBookings - Whether to keep taking reservations.
 * @returns {Promise<object>} The updated booking overview.
 */
export async function setAcceptingBookings(isAcceptingBookings) {
  const bookingEnvelope = await apiClient.patch('/seats/bookings/accepting', {
    isAcceptingBookings,
  });
  return bookingEnvelope.data;
}
