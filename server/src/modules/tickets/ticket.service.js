// Ticket business logic (Member 03, FR-05 and FR-06): buying, viewing, changing and cancelling a
// digital ticket. getActiveTicketHolderIds is a shared contract used by Member 04 (delay notifications).
const { createHmac, randomInt } = require('node:crypto');
const Ticket = require('./ticket.model');
const Trip = require('../trips/trip.model');
const RouteStop = require('../routes/routeStop.model');
const Payment = require('../payments/payment.model');
const seatService = require('../seats/seat.service');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const { PAYMENT_STATUSES } = require('../payments/payment.constants');
const {
  TICKET_STATUSES,
  TICKET_VALID_HOURS,
  TICKET_KEY_PREFIX,
  TICKET_KEY_DIGITS,
  EDITABLE_TICKET_STATUSES,
} = require('./ticket.constants');
const environment = require('../../config/environment');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const TICKET_KEY_ATTEMPTS = 5;

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

/**
 * Builds a short human-readable ticket key such as "CSB-408213".
 * @returns {string} A candidate ticket key.
 */
function buildTicketKey() {
  const lowestKeyNumber = 10 ** (TICKET_KEY_DIGITS - 1);
  const highestKeyNumber = 10 ** TICKET_KEY_DIGITS;
  return `${TICKET_KEY_PREFIX}-${randomInt(lowestKeyNumber, highestKeyNumber)}`;
}

/**
 * Picks a ticket key that no existing ticket uses. A duplicate key would let a driver verify the
 * wrong ticket, so the key is checked instead of trusted.
 * @returns {Promise<string>} An unused ticket key.
 */
async function reserveUnusedTicketKey() {
  for (let attemptNumber = 0; attemptNumber < TICKET_KEY_ATTEMPTS; attemptNumber += 1) {
    const candidateKey = buildTicketKey();
    const existingTicket = await Ticket.findOne({ ticketKey: candidateKey });
    if (!existingTicket) return candidateKey;
  }
  throw new AppError('Could not issue a ticket right now. Please try again.', HTTP_STATUS.CONFLICT);
}

/**
 * Signs a ticket so a QR code cannot be forged or hand-edited (NFR-07). The driver app sends the
 * signature back and the server recomputes it, so nothing secret ever leaves the server.
 * @param {string} ticketKey - The ticket's key.
 * @param {string} userId - Passenger who owns the ticket.
 * @returns {string} Hex signature stored on the ticket and printed inside the QR code.
 */
function buildQrSignature(ticketKey, userId) {
  return createHmac('sha256', environment.jwtSecret).update(`${ticketKey}:${userId}`).digest('hex');
}

/**
 * Loads a trip that can still be ticketed, with its bus and route.
 * @param {string} tripId - Trip the passenger chose.
 * @returns {Promise<object>} The ongoing trip with bus and route populated.
 */
async function getTicketableTrip(tripId) {
  const matchingTrip = await Trip.findById(tripId).populate(['busId', 'routeId']);
  if (!matchingTrip) {
    throw new AppError('Trip not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (matchingTrip.status !== TRIP_STATUSES.ONGOING) {
    throw new AppError('This bus has finished its trip. Pick a bus that is running.', HTTP_STATUS.CONFLICT);
  }
  return matchingTrip;
}

/**
 * Checks the two stops belong to the trip's route and are in travel order, then prices the journey.
 * A reversed pair is rejected because the bus will never reach the alighting stop.
 * @param {object} journeyDetails - Route and the chosen stops.
 * @param {string} journeyDetails.routeId - Route the trip runs on.
 * @param {string} journeyDetails.boardingStopId - Where the passenger gets on.
 * @param {string} journeyDetails.alightingStopId - Where the passenger gets off.
 * @returns {Promise<{boardingStop: object, alightingStop: object, fareAmount: number}>} Priced journey.
 */
async function priceJourney({ routeId, boardingStopId, alightingStopId }) {
  const [boardingStop, alightingStop] = await Promise.all([
    RouteStop.findOne({ _id: boardingStopId, routeId }),
    RouteStop.findOne({ _id: alightingStopId, routeId }),
  ]);
  if (!boardingStop || !alightingStop) {
    throw new AppError('Those stops are not on this bus route.', HTTP_STATUS.UNPROCESSABLE_ENTITY, [
      { field: 'boardingStopId', message: 'Choose stops from this route.' },
    ]);
  }
  if (boardingStop.stopSequence >= alightingStop.stopSequence) {
    throw new AppError(
      'The bus reaches your boarding stop after the stop you chose to get off at.',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      [{ field: 'alightingStopId', message: 'Pick a stop further along the route.' }]
    );
  }
  return {
    boardingStop,
    alightingStop,
    fareAmount: Math.max(0, alightingStop.fareFromOrigin - boardingStop.fareFromOrigin),
  };
}

/**
 * Collects everything the ticket screens show for one ticket: route, stops, seat and payment.
 * @param {object} ticket - A Ticket document.
 * @returns {Promise<object>} Ticket view used by every ticket screen.
 */
async function buildTicketView(ticket) {
  const [boardingStop, alightingStop, seatBooking, payment, trip] = await Promise.all([
    RouteStop.findById(ticket.boardingStopId),
    RouteStop.findById(ticket.alightingStopId),
    seatService.getSeatForTicket(ticket.id),
    Payment.findOne({ ticketId: ticket.id }),
    Trip.findById(ticket.tripId).populate(['busId', 'routeId']),
  ]);

  return {
    ticket,
    route: trip?.routeId || null,
    bus: trip?.busId || null,
    tripStatus: trip?.status || null,
    boardingStop,
    alightingStop,
    seatNumber: seatBooking?.seatNumber || null,
    payment,
    isPaid: payment?.status === PAYMENT_STATUSES.PAID,
  };
}

/**
 * Buys a ticket: prices the journey, holds the seat and signs the QR code. The ticket starts unpaid
 * and the Payment screen records the (mock) payment straight afterwards.
 * @param {string} userId - Signed-in passenger.
 * @param {object} ticketDetails - tripId, boardingStopId, alightingStopId and seatNumber.
 * @returns {Promise<object>} The new ticket view.
 */
async function createTicket(userId, ticketDetails) {
  const matchingTrip = await getTicketableTrip(ticketDetails.tripId);
  const { fareAmount } = await priceJourney({
    routeId: matchingTrip.routeId.id,
    boardingStopId: ticketDetails.boardingStopId,
    alightingStopId: ticketDetails.alightingStopId,
  });

  const ticketKey = await reserveUnusedTicketKey();
  const createdTicket = await Ticket.create({
    ticketKey,
    userId,
    tripId: matchingTrip.id,
    routeId: matchingTrip.routeId.id,
    boardingStopId: ticketDetails.boardingStopId,
    alightingStopId: ticketDetails.alightingStopId,
    fareAmount,
    qrSignature: buildQrSignature(ticketKey, userId),
    validUntil: new Date(Date.now() + TICKET_VALID_HOURS * MILLISECONDS_PER_HOUR),
  });

  try {
    await seatService.bookSeatForTicket({
      tripId: matchingTrip.id,
      ticketId: createdTicket.id,
      seatNumber: ticketDetails.seatNumber,
    });
  } catch (seatError) {
    // A ticket without a seat is meaningless, so do not leave a half-booked ticket behind.
    await Ticket.findByIdAndDelete(createdTicket.id);
    throw seatError;
  }

  return buildTicketView(createdTicket);
}

/**
 * The passenger's tickets, newest first, optionally narrowed to one status tab.
 * @param {string} userId - Signed-in passenger.
 * @param {string} [status] - One of TICKET_STATUSES.
 * @returns {Promise<object[]>} Ticket views for the My Tickets list.
 */
async function listMyTickets(userId, status) {
  const ticketFilter = { userId };
  if (status) ticketFilter.status = status;
  const tickets = await Ticket.find(ticketFilter).sort({ createdAt: -1 });
  return Promise.all(tickets.map(buildTicketView));
}

/**
 * Loads one of the passenger's own tickets, refusing to show somebody else's (NFR-08).
 * @param {string} userId - Signed-in passenger.
 * @param {string} ticketId - Ticket to open.
 * @returns {Promise<object>} The ticket document.
 */
async function getOwnTicket(userId, ticketId) {
  const matchingTicket = await Ticket.findById(ticketId);
  if (!matchingTicket) {
    throw new AppError('Ticket not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (String(matchingTicket.userId) !== String(userId)) {
    throw new AppError('You can only view your own tickets.', HTTP_STATUS.FORBIDDEN);
  }
  return matchingTicket;
}

/**
 * One ticket with its stops, seat and payment, for the Ticket Details screen.
 * @param {string} userId - Signed-in passenger.
 * @param {string} ticketId - Ticket to open.
 * @returns {Promise<object>} The ticket view.
 */
async function getTicketDetails(userId, ticketId) {
  const matchingTicket = await getOwnTicket(userId, ticketId);
  return buildTicketView(matchingTicket);
}

/**
 * Changes a ticket's stops or seat while it is still active. A used, cancelled or expired ticket is
 * frozen, because the journey has already happened or been refunded.
 * @param {string} userId - Signed-in passenger.
 * @param {string} ticketId - Ticket to change.
 * @param {object} ticketChanges - Any of boardingStopId, alightingStopId, seatNumber.
 * @returns {Promise<object>} The updated ticket view.
 */
async function updateTicket(userId, ticketId, ticketChanges) {
  const editableTicket = await getOwnTicket(userId, ticketId);
  if (!EDITABLE_TICKET_STATUSES.includes(editableTicket.status)) {
    throw new AppError(
      `A ${editableTicket.status} ticket can no longer be changed.`,
      HTTP_STATUS.CONFLICT
    );
  }
  await getTicketableTrip(editableTicket.tripId);

  const nextBoardingStopId = ticketChanges.boardingStopId || editableTicket.boardingStopId;
  const nextAlightingStopId = ticketChanges.alightingStopId || editableTicket.alightingStopId;
  const { fareAmount } = await priceJourney({
    routeId: editableTicket.routeId,
    boardingStopId: nextBoardingStopId,
    alightingStopId: nextAlightingStopId,
  });

  if (ticketChanges.seatNumber) {
    await seatService.changeSeatForTicket({
      tripId: editableTicket.tripId,
      ticketId: editableTicket.id,
      seatNumber: ticketChanges.seatNumber,
    });
  }

  editableTicket.boardingStopId = nextBoardingStopId;
  editableTicket.alightingStopId = nextAlightingStopId;
  editableTicket.fareAmount = fareAmount;
  await editableTicket.save();

  return buildTicketView(editableTicket);
}

/**
 * Cancels a ticket: the seat goes back on the map and a paid fare is marked refunded (FR-05).
 * @param {string} userId - Signed-in passenger.
 * @param {string} ticketId - Ticket to cancel.
 * @returns {Promise<object>} The cancelled ticket view.
 */
async function cancelTicket(userId, ticketId) {
  const cancellableTicket = await getOwnTicket(userId, ticketId);
  if (cancellableTicket.status === TICKET_STATUSES.USED) {
    throw new AppError('This ticket has already been used on the bus.', HTTP_STATUS.CONFLICT);
  }
  if (cancellableTicket.status === TICKET_STATUSES.CANCELLED) {
    return buildTicketView(cancellableTicket);
  }

  cancellableTicket.status = TICKET_STATUSES.CANCELLED;
  cancellableTicket.cancelledAt = new Date();
  await cancellableTicket.save();

  await seatService.releaseSeatForTicket(cancellableTicket.id);
  await Payment.updateOne(
    { ticketId: cancellableTicket.id, status: PAYMENT_STATUSES.PAID },
    { status: PAYMENT_STATUSES.REFUNDED }
  );

  return buildTicketView(cancellableTicket);
}

module.exports = {
  getActiveTicketHolderIds,
  buildQrSignature,
  buildTicketView,
  createTicket,
  listMyTickets,
  getOwnTicket,
  getTicketDetails,
  updateTicket,
  cancelTicket,
};
