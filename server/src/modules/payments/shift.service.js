// Driver shift takings (Member 03): what this driver has collected today, split by how it was paid.
// A "shift" is every trip the driver has run since midnight, so no new table is needed for it.
const Trip = require('../trips/trip.model');
const Ticket = require('../tickets/ticket.model');
const Payment = require('./payment.model');
const RouteStop = require('../routes/routeStop.model');
const tripService = require('../trips/trip.service');
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require('./payment.constants');

/** How many transactions the shift screen lists under the totals. */
const RECENT_TRANSACTION_LIMIT = 5;

/**
 * Midnight today, the point a shift is counted from.
 * @returns {Date} Start of the current day.
 */
function startOfToday() {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  return dayStart;
}

/**
 * The driver's takings for today: totals, a cash/digital split and the latest transactions.
 * Cash is what the conductor took on board; everything else is digital.
 * @param {string} userId - Signed-in driver's user id.
 * @returns {Promise<object>} Shift summary for the Current Shift screen.
 */
async function getShiftSummary(userId) {
  const driverProfile = await tripService.getDriverProfileForUser(userId);
  const shiftStart = startOfToday();

  const todaysTrips = await Trip.find({
    driverId: driverProfile.id,
    startedAt: { $gte: shiftStart },
  }).populate(['busId', 'routeId']);
  const todaysTripIds = todaysTrips.map((todaysTrip) => todaysTrip.id);

  const todaysTickets = await Ticket.find({ tripId: { $in: todaysTripIds } });
  const todaysTicketIds = todaysTickets.map((todaysTicket) => todaysTicket.id);

  const paidPayments = await Payment.find({
    ticketId: { $in: todaysTicketIds },
    status: PAYMENT_STATUSES.PAID,
  }).sort({ paidAt: -1 });

  const cashPayments = paidPayments.filter(
    (payment) => payment.method === PAYMENT_METHODS.CASH
  );
  const digitalPayments = paidPayments.filter(
    (payment) => payment.method !== PAYMENT_METHODS.CASH
  );

  /**
   * Adds up a set of payments.
   * @param {object[]} paymentList - Payments to total.
   * @returns {number} Rupees.
   */
  const sumAmounts = (paymentList) =>
    paymentList.reduce((runningTotal, payment) => runningTotal + payment.amount, 0);

  // Only the few rows actually shown need their stop names looked up.
  const recentPayments = paidPayments.slice(0, RECENT_TRANSACTION_LIMIT);
  const recentTransactions = await Promise.all(
    recentPayments.map(async (payment) => {
      const matchingTicket = todaysTickets.find(
        (todaysTicket) => todaysTicket.id === String(payment.ticketId)
      );
      const [boardingStop, alightingStop] = await Promise.all([
        RouteStop.findById(matchingTicket?.boardingStopId).select('stopName'),
        RouteStop.findById(matchingTicket?.alightingStopId).select('stopName'),
      ]);
      return {
        id: payment.id,
        ticketKey: matchingTicket?.ticketKey || null,
        boardingStopName: boardingStop?.stopName || null,
        alightingStopName: alightingStop?.stopName || null,
        amount: payment.amount,
        method: payment.method,
        isCash: payment.method === PAYMENT_METHODS.CASH,
        paidAt: payment.paidAt,
      };
    })
  );

  const runningTrip = todaysTrips.find((todaysTrip) => !todaysTrip.endedAt);

  return {
    shiftStartedAt: todaysTrips[0]?.startedAt || null,
    bus: runningTrip?.busId || todaysTrips[0]?.busId || null,
    route: runningTrip?.routeId || todaysTrips[0]?.routeId || null,
    tripCount: todaysTrips.length,
    transactionCount: paidPayments.length,
    shiftTotal: sumAmounts(paidPayments),
    cashTotal: sumAmounts(cashPayments),
    cashCount: cashPayments.length,
    digitalTotal: sumAmounts(digitalPayments),
    digitalCount: digitalPayments.length,
    ticketCount: todaysTickets.length,
    recentTransactions,
  };
}

module.exports = { getShiftSummary };
