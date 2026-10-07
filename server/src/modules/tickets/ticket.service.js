// Ticket business logic (Member 03, FR-05 and FR-06): buying, viewing, changing and cancelling a
// digital ticket. getActiveTicketHolderIds is a shared contract used by Member 04 (delay notifications).
const { createHmac } = require('node:crypto');
const Ticket = require('./ticket.model');
const Trip = require('../trips/trip.model');
const RouteStop = require('../routes/routeStop.model');
const Payment = require('../payments/payment.model');
const User = require('../users/user.model');
const seatService = require('../seats/seat.service');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require('../payments/payment.constants');
const walletService = require('../payments/wallet.service');
const {
  TICKET_STATUSES,
  TICKET_VALID_HOURS,
  TICKET_KEY_PREFIX,
  TICKET_KEY_SEQUENCE_DIGITS,
  EDITABLE_TICKET_STATUSES,
} = require('./ticket.constants');
const environment = require('../../config/environment');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/** Retries while two passengers book in the same instant and land on the same sequence number. */
const MAX_TICKET_KEY_ATTEMPTS = 20;

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
 * Builds the day's next ticket key, "CSB-20260919-0417". The sequence counts that day's tickets, so
 * two tickets issued in the same millisecond still differ.
 * @returns {Promise<string>} An unused ticket key.
 */
async function reserveUnusedTicketKey() {
  const today = new Date();
  const datePart = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('');

  // Count only this day's tickets, so the sequence restarts each morning as the format implies.
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const ticketsToday = await Ticket.countDocuments({ createdAt: { $gte: startOfDay } });

  for (let offset = 1; offset <= MAX_TICKET_KEY_ATTEMPTS; offset += 1) {
    const sequencePart = String(ticketsToday + offset).padStart(TICKET_KEY_SEQUENCE_DIGITS, '0');
    const candidateKey = `${TICKET_KEY_PREFIX}-${datePart}-${sequencePart}`;
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
  const [boardingStop, alightingStop, seatNumbers, payment, trip, passenger] = await Promise.all([
    RouteStop.findById(ticket.boardingStopId),
    RouteStop.findById(ticket.alightingStopId),
    seatService.getSeatsForTicket(ticket.id),
    Payment.findOne({ ticketId: ticket.id }),
    Trip.findById(ticket.tripId).populate(['busId', 'routeId']),
    User.findById(ticket.userId).select('fullName'),
  ]);

  return {
    ticket,
    route: trip?.routeId || null,
    bus: trip?.busId || null,
    tripStatus: trip?.status || null,
    departsAt: trip?.startedAt || null,
    passengerName: passenger?.fullName || null,
    boardingStop,
    alightingStop,
    seatNumbers,
    seatCount: seatNumbers.length,
    // The ticket stores the total; the screens also show what one seat cost.
    perSeatFare: seatNumbers.length > 0 ? ticket.fareAmount / seatNumbers.length : ticket.fareAmount,
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
  const { fareAmount: perSeatFare } = await priceJourney({
    routeId: matchingTrip.routeId.id,
    boardingStopId: ticketDetails.boardingStopId,
    alightingStopId: ticketDetails.alightingStopId,
  });
  // Every seat on the ticket travels the same journey, so the total is the segment fare per seat.
  const fareAmount = perSeatFare * ticketDetails.seatNumbers.length;

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
    await seatService.bookSeatsForTicket({
      tripId: matchingTrip.id,
      ticketId: createdTicket.id,
      seatNumbers: ticketDetails.seatNumbers,
    });
  } catch (seatError) {
    // A ticket without seats is meaningless, so do not leave a half-booked ticket behind.
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
  const { fareAmount: perSeatFare } = await priceJourney({
    routeId: editableTicket.routeId,
    boardingStopId: nextBoardingStopId,
    alightingStopId: nextAlightingStopId,
  });

  if (ticketChanges.seatNumbers) {
    await seatService.changeSeatsForTicket({
      tripId: editableTicket.tripId,
      ticketId: editableTicket.id,
      seatNumbers: ticketChanges.seatNumbers,
    });
  }

  const currentSeatNumbers = await seatService.getSeatsForTicket(editableTicket.id);
  editableTicket.boardingStopId = nextBoardingStopId;
  editableTicket.alightingStopId = nextAlightingStopId;
  editableTicket.fareAmount = perSeatFare * Math.max(1, currentSeatNumbers.length);
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

  await seatService.releaseSeatsForTicket(cancellableTicket.id);

  const paidPayment = await Payment.findOne({
    ticketId: cancellableTicket.id,
    status: PAYMENT_STATUSES.PAID,
  });
  if (paidPayment) {
    paidPayment.status = PAYMENT_STATUSES.REFUNDED;
    await paidPayment.save();
    // A fare paid from the wallet goes straight back to the wallet, so the balance stays truthful.
    if (paidPayment.method === PAYMENT_METHODS.WALLET) {
      await walletService.refundToWallet(userId, {
        amount: paidPayment.amount,
        description: `Refund for ticket ${cancellableTicket.ticketKey}`,
        ticketId: cancellableTicket.id,
      });
    }
  }

  return buildTicketView(cancellableTicket);
}

/**
 * The buses a passenger can buy a ticket on right now: every ongoing trip with its route, departure
 * time, per-seat fare and how many seats are left. This is what the "+" button on My Tickets opens.
 * @returns {Promise<object[]>} Bookable trips, fullest routes last.
 */
async function listBookableTrips() {
  const runningTrips = await Trip.find({ status: TRIP_STATUSES.ONGOING }).populate([
    'busId',
    'routeId',
  ]);

  const bookableTrips = await Promise.all(
    runningTrips
      .filter((runningTrip) => runningTrip.busId && runningTrip.routeId)
      .map(async (runningTrip) => {
        const bookedSeatCount = await seatService.countBookedSeats(runningTrip.id);
        return {
          tripId: runningTrip.id,
          route: runningTrip.routeId,
          bus: runningTrip.busId,
          departsAt: runningTrip.startedAt,
          baseFare: runningTrip.routeId.baseFare,
          availableSeats: runningTrip.busId.capacity - bookedSeatCount,
          capacity: runningTrip.busId.capacity,
        };
      })
  );
  return bookableTrips.sort((firstTrip, secondTrip) => secondTrip.availableSeats - firstTrip.availableSeats);
}

module.exports = {
  getActiveTicketHolderIds,
  listBookableTrips,
  buildQrSignature,
  buildTicketView,
  createTicket,
  listMyTickets,
  getOwnTicket,
  getTicketDetails,
  updateTicket,
  cancelTicket,
};
