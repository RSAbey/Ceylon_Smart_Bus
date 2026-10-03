// Demo tickets and inquiries (Member 03 tables): 2 tickets with seats + payments, 2 inquiries (one replied). DEMO DATA ONLY.
const crypto = require('crypto');
const environment = require('../../config/environment');
const Ticket = require('../../modules/tickets/ticket.model');
const SeatBooking = require('../../modules/seats/seatBooking.model');
const Payment = require('../../modules/payments/payment.model');
const Inquiry = require('../../modules/inquiries/inquiry.model');
const InquiryReply = require('../../modules/inquiries/inquiryReply.model');
const { TICKET_STATUSES } = require('../../modules/tickets/ticket.constants');
const { SEAT_BOOKING_STATUSES } = require('../../modules/seats/seat.constants');
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require('../../modules/payments/payment.constants');
const {
  INQUIRY_PRIORITIES,
  INQUIRY_TAGS,
  INQUIRY_STATUSES,
} = require('../../modules/inquiries/inquiry.constants');

const TICKET_VALIDITY_MILLISECONDS = 24 * 60 * 60 * 1000;
const SIGNATURE_ALGORITHM = 'sha256';

/** Demo ticket definitions: stop indexes refer to route 154's ordered stops. */
const DEMO_TICKETS = [
  {
    ticketKey: 'CSB-7K4M2Q',
    boardingStopIndex: 1,
    alightingStopIndex: 8,
    seatNumber: '12',
    ticketStatus: TICKET_STATUSES.ACTIVE,
    seatStatus: SEAT_BOOKING_STATUSES.BOOKED,
    paymentMethod: PAYMENT_METHODS.CARD,
    paymentStatus: PAYMENT_STATUSES.PAID,
  },
  {
    ticketKey: 'CSB-3H9T6W',
    boardingStopIndex: 3,
    alightingStopIndex: 6,
    seatNumber: '7',
    ticketStatus: TICKET_STATUSES.CANCELLED,
    seatStatus: SEAT_BOOKING_STATUSES.RELEASED,
    paymentMethod: PAYMENT_METHODS.WALLET,
    paymentStatus: PAYMENT_STATUSES.REFUNDED,
  },
];

/**
 * Demo signature for the QR payload. Member 03 owns the real signing scheme; this only fills the required field.
 * @param {string} ticketKey - Human-readable ticket key.
 * @returns {string} Hex HMAC of the key.
 */
function signDemoTicketKey(ticketKey) {
  return crypto.createHmac(SIGNATURE_ALGORITHM, environment.jwtSecret).update(ticketKey).digest('hex');
}

/**
 * Creates one ticket with its seat booking and payment.
 * @param {object} ticketDefinition - Entry from DEMO_TICKETS.
 * @param {object} ticketOwner - Passenger user.
 * @param {object} ongoingTrip - Trip the ticket belongs to.
 * @param {object[]} routeStops - Ordered stops of the trip's route.
 * @returns {Promise<object>} The created ticket.
 */
async function seedTicketWithSeatAndPayment(ticketDefinition, ticketOwner, ongoingTrip, routeStops) {
  const boardingStop = routeStops[ticketDefinition.boardingStopIndex];
  const alightingStop = routeStops[ticketDefinition.alightingStopIndex];
  const fareAmount = alightingStop.fareFromOrigin - boardingStop.fareFromOrigin;
  const isCancelled = ticketDefinition.ticketStatus === TICKET_STATUSES.CANCELLED;

  const createdTicket = await Ticket.create({
    ticketKey: ticketDefinition.ticketKey,
    userId: ticketOwner.id,
    tripId: ongoingTrip.id,
    routeId: ongoingTrip.routeId,
    boardingStopId: boardingStop.id,
    alightingStopId: alightingStop.id,
    fareAmount,
    status: ticketDefinition.ticketStatus,
    qrSignature: signDemoTicketKey(ticketDefinition.ticketKey),
    validUntil: new Date(Date.now() + TICKET_VALIDITY_MILLISECONDS),
    cancelledAt: isCancelled ? new Date() : undefined,
  });
  await SeatBooking.create({
    tripId: ongoingTrip.id,
    ticketId: createdTicket.id,
    seatNumber: ticketDefinition.seatNumber,
    status: ticketDefinition.seatStatus,
  });
  await Payment.create({
    ticketId: createdTicket.id,
    amount: fareAmount,
    method: ticketDefinition.paymentMethod,
    status: ticketDefinition.paymentStatus,
  });
  return createdTicket;
}

/**
 * Creates one passenger inquiry answered by the admin and one open driver inquiry about a bus.
 * @param {object} accounts - Output of seedAccounts().
 * @param {object} fleet - Output of seedFleet().
 * @returns {Promise<void>} Resolves when both inquiries exist.
 */
async function seedInquiries(accounts, fleet) {
  const { adminUser, driverUsers, passengerUsers } = accounts;
  const { routes, buses } = fleet;
  const [anjali] = passengerUsers;
  const [, ruwanUser] = driverUsers;

  const repliedInquiry = await Inquiry.create({
    userId: anjali.id,
    subject: 'Bus 154 did not stop at Rajagiriya',
    message: 'This morning the 7.40 bus passed the Rajagiriya stop without stopping although I signalled.',
    priority: INQUIRY_PRIORITIES.MEDIUM,
    tag: INQUIRY_TAGS.ROUTE,
    routeId: routes[0].id,
    status: INQUIRY_STATUSES.REPLIED,
  });
  await InquiryReply.create({
    inquiryId: repliedInquiry.id,
    adminId: adminUser.id,
    message: 'Thank you for reporting this. We have reminded the route 154 crew to stop at every marked stop.',
  });

  await Inquiry.create({
    userId: ruwanUser.id,
    subject: 'Rear door sensor not working on NC-5678',
    message: 'The rear door warning light stays on. Requesting a maintenance check after today\'s last trip.',
    priority: INQUIRY_PRIORITIES.LOW,
    tag: INQUIRY_TAGS.BUS_CONDITION,
    busId: buses[1].id,
  });
}

/**
 * Seeds tickets (active + cancelled) on the ongoing trip, then the inquiries.
 * @param {object} accounts - Output of seedAccounts().
 * @param {object} fleet - Output of seedFleet().
 * @returns {Promise<{activeTicket: object}>} The active ticket (used for the "ticket confirmed" notification).
 */
async function seedTickets(accounts, fleet) {
  const [anjali, kasun] = accounts.passengerUsers;
  const route154Stops = fleet.stopsByRouteNumber.get('154');
  const [activeTicketDefinition, cancelledTicketDefinition] = DEMO_TICKETS;

  const activeTicket = await seedTicketWithSeatAndPayment(activeTicketDefinition, anjali, fleet.ongoingTrip, route154Stops);
  await seedTicketWithSeatAndPayment(cancelledTicketDefinition, kasun, fleet.ongoingTrip, route154Stops);
  await seedInquiries(accounts, fleet);

  return { activeTicket };
}

module.exports = { seedTickets };
