// API calls for digital tickets (Member 03). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/**
 * The signed-in passenger's tickets, newest first.
 * @param {string} [status] - Optional TICKET_STATUSES value to filter by.
 * @returns {Promise<object[]>} Ticket views with route, stops, seat and payment.
 */
export async function fetchMyTickets(status) {
  const ticketEnvelope = await apiClient.get('/tickets', { params: status ? { status } : {} });
  return ticketEnvelope.data.tickets;
}

/**
 * One ticket with everything the details screen shows, including the QR fields.
 * @param {string} ticketId - Ticket to open.
 * @returns {Promise<object>} The ticket view.
 */
export async function fetchTicketDetails(ticketId) {
  const ticketEnvelope = await apiClient.get(`/tickets/${ticketId}`);
  return ticketEnvelope.data;
}

/**
 * Books a ticket on a running bus. The fare comes back priced by the server.
 * @param {object} ticketDetails - tripId, boardingStopId, alightingStopId and seatNumbers.
 * @returns {Promise<object>} The new ticket view.
 */
export async function createTicket(ticketDetails) {
  const ticketEnvelope = await apiClient.post('/tickets', ticketDetails);
  return ticketEnvelope.data;
}

/**
 * Changes the stops or the seat on a ticket that has not been used yet.
 * @param {string} ticketId - Ticket to change.
 * @param {object} ticketChanges - Any of boardingStopId, alightingStopId, seatNumbers.
 * @returns {Promise<object>} The updated ticket view.
 */
export async function updateTicket(ticketId, ticketChanges) {
  const ticketEnvelope = await apiClient.put(`/tickets/${ticketId}`, ticketChanges);
  return ticketEnvelope.data;
}

/**
 * Cancels a ticket, which releases its seat and refunds a paid fare.
 * @param {string} ticketId - Ticket to cancel.
 * @returns {Promise<object>} The cancelled ticket view.
 */
export async function cancelTicket(ticketId) {
  const ticketEnvelope = await apiClient.delete(`/tickets/${ticketId}`);
  return ticketEnvelope.data;
}

/**
 * The buses a passenger can buy a ticket on right now, for the "Buy my ticket" picker.
 * @returns {Promise<object[]>} Bookable trips with route, departure, fare and free seats.
 */
export async function fetchBookableTrips() {
  const tripEnvelope = await apiClient.get('/tickets/available-buses');
  return tripEnvelope.data.bookableTrips;
}
