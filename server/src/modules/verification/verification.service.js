// Verification business logic (Member 03, FR-09 and NFR-06): a driver checks a ticket by QR scan or
// by typing the ticket key. Every check is stored, valid or not, so the transaction report is complete.
const TicketVerification = require('./ticketVerification.model');
const Ticket = require('../tickets/ticket.model');
const Payment = require('../payments/payment.model');
const ticketService = require('../tickets/ticket.service');
const tripService = require('../trips/trip.service');
const seatService = require('../seats/seat.service');
const RouteStop = require('../routes/routeStop.model');
const { VERIFICATION_METHODS, VERIFICATION_RESULTS } = require('./verification.constants');
const { TICKET_STATUSES } = require('../tickets/ticket.constants');
const { PAYMENT_STATUSES } = require('../payments/payment.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/** How many past checks the driver's screen lists under the scanner. */
const RECENT_VERIFICATION_LIMIT = 10;

/**
 * Stores one check and returns the answer the driver's screen shows.
 * @param {object} checkDetails - What was checked and how it turned out.
 * @param {string | null} checkDetails.ticketId - Ticket that was found, or null when nothing matched.
 * @param {string} checkDetails.driverId - DriverProfile doing the checking.
 * @param {string} checkDetails.method - QR or typed ticket key.
 * @param {string} checkDetails.verificationResult - Valid or invalid.
 * @param {string} checkDetails.reason - Message shown to the driver.
 * @param {object} [checkDetails.ticketSummary] - Journey details shown on a valid result.
 * @returns {Promise<object>} The verification outcome.
 */
async function recordVerification({
  ticketId,
  driverId,
  method,
  verificationResult,
  reason,
  ticketSummary = null,
}) {
  // An unmatched code has no ticket to point at, so only real tickets get a stored row.
  if (ticketId) {
    await TicketVerification.create({ ticketId, driverId, method, result: verificationResult });
  }
  return {
    isValid: verificationResult === VERIFICATION_RESULTS.VALID,
    reason,
    ticket: ticketSummary,
    checkedAt: new Date(),
  };
}

/**
 * The journey details a driver needs to see on a valid ticket: who is travelling, between which
 * stops, and which seat. Nothing about other passengers is included (NFR-08).
 * @param {object} ticket - The verified ticket.
 * @returns {Promise<object>} Summary for the driver's screen.
 */
async function buildDriverTicketSummary(ticket) {
  const [boardingStop, alightingStop, seatBooking, passengerTicket] = await Promise.all([
    RouteStop.findById(ticket.boardingStopId),
    RouteStop.findById(ticket.alightingStopId),
    seatService.getSeatForTicket(ticket.id),
    Ticket.findById(ticket.id).populate('userId', 'fullName'),
  ]);

  return {
    id: ticket.id,
    ticketKey: ticket.ticketKey,
    passengerName: passengerTicket?.userId?.fullName || null,
    boardingStopName: boardingStop?.stopName || null,
    alightingStopName: alightingStop?.stopName || null,
    seatNumber: seatBooking?.seatNumber || null,
    fareAmount: ticket.fareAmount,
    status: ticket.status,
  };
}

/**
 * Checks one ticket for the driver's running trip and marks a good ticket as used so the same
 * ticket cannot be shown twice (NFR-07).
 * @param {string} userId - Signed-in driver's user id.
 * @param {object} checkRequest - ticketKey, optional qrSignature, and the method used.
 * @returns {Promise<object>} Whether the ticket is valid, with the reason and journey details.
 */
async function verifyTicket(userId, checkRequest) {
  const driverProfile = await tripService.getDriverProfileForUser(userId);
  const runningTrip = await tripService.getOngoingTripForDriver(driverProfile.id);
  if (!runningTrip) {
    throw new AppError(
      'Start your trip before checking tickets, so the app knows which bus you are on.',
      HTTP_STATUS.CONFLICT
    );
  }

  const method = checkRequest.qrSignature
    ? VERIFICATION_METHODS.QR
    : VERIFICATION_METHODS.TICKET_KEY;
  const ticketKey = checkRequest.ticketKey.trim().toUpperCase();
  const matchingTicket = await Ticket.findOne({ ticketKey });

  if (!matchingTicket) {
    return recordVerification({
      ticketId: null,
      driverId: driverProfile.id,
      method,
      verificationResult: VERIFICATION_RESULTS.INVALID,
      reason: 'No ticket exists with that code.',
    });
  }

  /** Each check below is a reason to refuse, in the order the driver would care about. */
  const refusalReason = await (async () => {
    if (
      method === VERIFICATION_METHODS.QR &&
      checkRequest.qrSignature !==
        ticketService.buildQrSignature(matchingTicket.ticketKey, matchingTicket.userId)
    ) {
      return 'This QR code has been tampered with.';
    }
    if (String(matchingTicket.tripId) !== String(runningTrip.id)) {
      return 'This ticket is for a different bus.';
    }
    if (matchingTicket.status === TICKET_STATUSES.USED) {
      return 'This ticket has already been used.';
    }
    if (matchingTicket.status !== TICKET_STATUSES.ACTIVE) {
      return `This ticket is ${matchingTicket.status}.`;
    }
    if (matchingTicket.validUntil < new Date()) {
      return 'This ticket has expired.';
    }
    const payment = await Payment.findOne({ ticketId: matchingTicket.id });
    if (payment?.status !== PAYMENT_STATUSES.PAID) {
      return 'The fare for this ticket has not been paid.';
    }
    return null;
  })();

  if (refusalReason) {
    return recordVerification({
      ticketId: matchingTicket.id,
      driverId: driverProfile.id,
      method,
      verificationResult: VERIFICATION_RESULTS.INVALID,
      reason: refusalReason,
      ticketSummary: await buildDriverTicketSummary(matchingTicket),
    });
  }

  matchingTicket.status = TICKET_STATUSES.USED;
  await matchingTicket.save();

  return recordVerification({
    ticketId: matchingTicket.id,
    driverId: driverProfile.id,
    method,
    verificationResult: VERIFICATION_RESULTS.VALID,
    reason: 'Ticket is valid. Let the passenger board.',
    ticketSummary: await buildDriverTicketSummary(matchingTicket),
  });
}

/**
 * The driver's recent checks, so they can see what they just scanned.
 * @param {string} userId - Signed-in driver's user id.
 * @returns {Promise<object[]>} Recent verifications, newest first.
 */
async function listMyVerifications(userId) {
  const driverProfile = await tripService.getDriverProfileForUser(userId);
  const verifications = await TicketVerification.find({ driverId: driverProfile.id })
    .sort({ verifiedAt: -1 })
    .limit(RECENT_VERIFICATION_LIMIT)
    .populate('ticketId', 'ticketKey fareAmount');

  return verifications.map((verification) => ({
    id: verification.id,
    ticketKey: verification.ticketId?.ticketKey || null,
    fareAmount: verification.ticketId?.fareAmount || null,
    method: verification.method,
    verificationResult: verification.result,
    verifiedAt: verification.verifiedAt,
  }));
}

module.exports = { verifyTicket, listMyVerifications };
