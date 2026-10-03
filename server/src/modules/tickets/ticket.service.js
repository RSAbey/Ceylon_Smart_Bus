// Ticket business logic. getActiveTicketHolderIds is a shared contract used by Member 04 (delay notifications).
const Ticket = require('./ticket.model');
const { TICKET_STATUSES } = require('./ticket.constants');

/**
 * Lists the passengers holding an active ticket on a trip.
 * @param {string} tripId - Trip to check.
 * @returns {Promise<string[]>} Distinct user ids as strings.
 */
async function getActiveTicketHolderIds(tripId) {
  const ticketHolderIds = await Ticket.distinct('userId', {
    tripId,
    status: TICKET_STATUSES.ACTIVE,
  });
  return ticketHolderIds.map(String);
}

module.exports = { getActiveTicketHolderIds };
