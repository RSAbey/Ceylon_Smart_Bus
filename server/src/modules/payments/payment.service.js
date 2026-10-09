// Payment business logic (Member 03, FR-07). Payments are mocked: no real gateway is called, so a
// "paid" row simply records which method the passenger chose and what it cost.
const Payment = require('./payment.model');
const Ticket = require('../tickets/ticket.model');
const Route = require('../routes/route.model');
const RouteStop = require('../routes/routeStop.model');
const notificationService = require('../notifications/notification.service');
const seatService = require('../seats/seat.service');
const walletService = require('./wallet.service');
const {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  FINANCE_TREND_DAYS,
  RECENT_TRANSACTION_LIMIT,
} = require('./payment.constants');
const { TICKET_STATUSES } = require('../tickets/ticket.constants');
const { NOTIFICATION_TYPES } = require('../notifications/notification.constants');
const { startOfDaysAgo, toDayKey } = require('../../utils/dayWindow');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/** The collection the payments are joined to when takings are split by route. */
const TICKET_COLLECTION_NAME = 'tickets';

/**
 * The payment methods the app accepts, with the live wallet balance so the Payment screen can show
 * it and grey the wallet out when it is short.
 * @param {string} userId - Signed-in passenger.
 * @returns {Promise<object[]>} Each method with its label, hint and (for the wallet) balance.
 */
async function listPaymentMethods(userId) {
  const { balance } = await walletService.getWalletSummary(userId);
  return [
    {
      method: PAYMENT_METHODS.CARD,
      label: 'Credit or debit card',
      hint: 'Visa and Mastercard. Demo only, so no card details are stored.',
      requiresCardDetails: true,
    },
    {
      method: PAYMENT_METHODS.WALLET,
      label: 'Mobile wallet',
      hint: `Balance Rs. ${balance}`,
      balance,
    },
    {
      method: PAYMENT_METHODS.CASH,
      label: 'Cash to the conductor',
      hint: 'Reserve the seats now and pay on board.',
    },
  ];
}

/**
 * Loads the passenger's own ticket in a state that can still be paid for.
 * @param {string} userId - Signed-in passenger.
 * @param {string} ticketId - Ticket being paid for.
 * @returns {Promise<object>} The payable ticket.
 */
async function getPayableTicket(userId, ticketId) {
  const matchingTicket = await Ticket.findById(ticketId);
  if (!matchingTicket) {
    throw new AppError('Ticket not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (String(matchingTicket.userId) !== String(userId)) {
    throw new AppError('You can only pay for your own tickets.', HTTP_STATUS.FORBIDDEN);
  }
  if (matchingTicket.status !== TICKET_STATUSES.ACTIVE) {
    throw new AppError(
      `A ${matchingTicket.status} ticket cannot be paid for.`,
      HTTP_STATUS.CONFLICT
    );
  }
  return matchingTicket;
}

/**
 * Records the (mock) payment for a ticket and tells the passenger it went through. The unique index
 * on ticketId is what stops a double tap paying twice.
 * @param {string} userId - Signed-in passenger.
 * @param {object} paymentDetails - ticketId and the chosen method.
 * @returns {Promise<object>} The stored payment.
 */
async function payForTicket(userId, paymentDetails) {
  const payableTicket = await getPayableTicket(userId, paymentDetails.ticketId);

  const existingPayment = await Payment.findOne({ ticketId: payableTicket.id });
  if (existingPayment?.status === PAYMENT_STATUSES.PAID) {
    throw new AppError('This ticket is already paid for.', HTTP_STATUS.CONFLICT);
  }

  // Paying from the wallet moves real balance, so it happens before the payment row is written:
  // if the balance is short this throws and no ticket is wrongly marked paid.
  if (paymentDetails.method === PAYMENT_METHODS.WALLET) {
    await walletService.spendFromWallet(userId, {
      amount: payableTicket.fareAmount,
      description: `Fare for ticket ${payableTicket.ticketKey}`,
      ticketId: payableTicket.id,
    });
  }

  // A failed or refunded attempt is replaced, so the passenger can retry with another method.
  const storedPayment = await Payment.findOneAndUpdate(
    { ticketId: payableTicket.id },
    {
      ticketId: payableTicket.id,
      amount: payableTicket.fareAmount,
      method: paymentDetails.method,
      status: PAYMENT_STATUSES.PAID,
      paidAt: new Date(),
    },
    { new: true, upsert: true }
  );

  await notificationService.createNotification({
    recipientUserIds: [userId],
    type: NOTIFICATION_TYPES.PAYMENT,
    title: 'Payment received',
    message: `Rs. ${payableTicket.fareAmount} paid for ticket ${payableTicket.ticketKey}.`,
    related: { routeId: payableTicket.routeId, tripId: payableTicket.tripId },
  });

  return storedPayment;
}

/**
 * The payment recorded against a ticket, used by the ticket screens to show "Paid".
 * @param {string} ticketId - Ticket to look up.
 * @returns {Promise<object | null>} The payment, or null when the fare is unpaid.
 */
async function getPaymentForTicket(ticketId) {
  return Payment.findOne({ ticketId });
}

/**
 * The passenger's own payment history, newest first.
 * @param {string} userId - Signed-in passenger.
 * @returns {Promise<object[]>} Payments with the ticket they belong to.
 */
async function listMyPayments(userId) {
  const myTickets = await Ticket.find({ userId }).select('_id ticketKey routeId');
  const myTicketIds = myTickets.map((myTicket) => myTicket.id);
  const payments = await Payment.find({ ticketId: { $in: myTicketIds } }).sort({ paidAt: -1 });

  return payments.map((payment) => ({
    payment,
    ticketKey: myTickets.find((myTicket) => myTicket.id === String(payment.ticketId))?.ticketKey,
  }));
}

/**
 * Takings for each of the last few days, for the trend above the transaction list.
 * @returns {Promise<Array<{day: string, total: number}>>} One entry per day, oldest first.
 */
async function buildDailyTakings() {
  const trendRows = await Payment.aggregate([
    {
      $match: {
        status: PAYMENT_STATUSES.PAID,
        paidAt: { $gte: startOfDaysAgo(FINANCE_TREND_DAYS - 1) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const takingsByDay = new Map(trendRows.map((trendRow) => [trendRow._id, trendRow.total]));
  const dailyTakings = [];
  // Days with no sales still get a bar, so a quiet day is visible rather than missing.
  for (let dayOffset = FINANCE_TREND_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const dayKey = toDayKey(startOfDaysAgo(dayOffset));
    dailyTakings.push({ day: dayKey, total: takingsByDay.get(dayKey) || 0 });
  }
  return dailyTakings;
}

/**
 * What each route is priced at and what it took in the period. Every route is listed, including one
 * that sold nothing, because the fares still have to be manageable from this page.
 * @param {object} periodFilter - Mongo filter limiting payments to the chosen period.
 * @returns {Promise<object[]>} One row per route, dearest first.
 */
async function buildRouteFareTable(periodFilter) {
  const [takingsRows, fareRows, allRoutes] = await Promise.all([
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUSES.PAID, ...periodFilter } },
      {
        $lookup: {
          from: TICKET_COLLECTION_NAME,
          localField: 'ticketId',
          foreignField: '_id',
          as: 'paidTickets',
        },
      },
      { $unwind: '$paidTickets' },
      {
        $group: {
          _id: '$paidTickets.routeId',
          collectedAmount: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
        },
      },
    ]),
    RouteStop.aggregate([
      { $group: { _id: '$routeId', stopCount: { $sum: 1 }, fullRouteFare: { $max: '$fareFromOrigin' } } },
    ]),
    Route.find().sort({ routeNumber: 1 }),
  ]);

  const takingsByRoute = new Map(takingsRows.map((takingsRow) => [String(takingsRow._id), takingsRow]));
  const faresByRoute = new Map(fareRows.map((fareRow) => [String(fareRow._id), fareRow]));

  return allRoutes.map((pricedRoute) => {
    const routeTakings = takingsByRoute.get(pricedRoute.id);
    const routeFares = faresByRoute.get(pricedRoute.id);
    return {
      routeId: pricedRoute.id,
      routeNumber: pricedRoute.routeNumber,
      routeName: pricedRoute.routeName,
      origin: pricedRoute.origin,
      destination: pricedRoute.destination,
      status: pricedRoute.status,
      baseFare: pricedRoute.baseFare,
      perKmRate: pricedRoute.perKmRate ?? null,
      // The dearest stop fare is what a passenger pays end to end, which is the real top price.
      fullRouteFare: routeFares?.fullRouteFare ?? null,
      stopCount: routeFares?.stopCount || 0,
      collectedAmount: routeTakings?.collectedAmount || 0,
      paymentCount: routeTakings?.paymentCount || 0,
    };
  });
}

/**
 * The transactions under the totals, newest first, optionally narrowed to one status.
 * @param {object} periodFilter - Mongo filter limiting payments to the chosen period.
 * @param {string} [status] - A PAYMENT_STATUSES value to narrow to.
 * @returns {Promise<object[]>} Transactions with their ticket, passenger and route.
 */
async function listRecentTransactions(periodFilter, status) {
  const recentPayments = await Payment.find({ ...periodFilter, ...(status ? { status } : {}) })
    .sort({ paidAt: -1 })
    .limit(RECENT_TRANSACTION_LIMIT);

  const recentTickets = await Ticket.find({
    _id: { $in: recentPayments.map((recentPayment) => recentPayment.ticketId) },
  })
    .select('ticketKey userId routeId status')
    .populate('routeId', 'routeNumber')
    .populate('userId', 'fullName');

  return recentPayments.map((recentPayment) => {
    const matchingTicket = recentTickets.find(
      (recentTicket) => recentTicket.id === String(recentPayment.ticketId)
    );
    return {
      id: recentPayment.id,
      amount: recentPayment.amount,
      method: recentPayment.method,
      status: recentPayment.status,
      paidAt: recentPayment.paidAt,
      ticketKey: matchingTicket?.ticketKey || null,
      ticketStatus: matchingTicket?.status || null,
      passengerName: matchingTicket?.userId?.fullName || null,
      routeNumber: matchingTicket?.routeId?.routeNumber || null,
    };
  });
}

/**
 * Everything the admin Tickets & Finance page shows (FR-10): what was taken and refunded in the
 * chosen period, how it was paid, the daily trend, what each route is priced at and earned, and the
 * latest transactions.
 * @param {object} [summaryFilters] - Page filters.
 * @param {number | null} [summaryFilters.periodDays] - Days to total over; null totals everything.
 * @param {string} [summaryFilters.status] - Narrows the transaction list to one payment status.
 * @returns {Promise<object>} The finance summary.
 */
async function getFinanceSummary({ periodDays = null, status } = {}) {
  const periodFilter = periodDays ? { paidAt: { $gte: startOfDaysAgo(periodDays - 1) } } : {};

  const [totalsByStatus, totalsByMethod, dailyTakings, byRoute, recentTransactions] =
    await Promise.all([
      Payment.aggregate([
        { $match: periodFilter },
        { $group: { _id: '$status', paymentCount: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUSES.PAID, ...periodFilter } },
        { $group: { _id: '$method', paymentCount: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),
      buildDailyTakings(),
      buildRouteFareTable(periodFilter),
      listRecentTransactions(periodFilter, status),
    ]);

  const findStatusTotal = (paymentStatus) =>
    totalsByStatus.find((statusTotal) => statusTotal._id === paymentStatus);
  const paidTotals = findStatusTotal(PAYMENT_STATUSES.PAID);
  const refundedTotals = findStatusTotal(PAYMENT_STATUSES.REFUNDED);
  const collectedAmount = paidTotals?.totalAmount || 0;
  const collectedCount = paidTotals?.paymentCount || 0;

  return {
    periodDays,
    trendDays: FINANCE_TREND_DAYS,
    collectedAmount,
    collectedCount,
    refundedAmount: refundedTotals?.totalAmount || 0,
    refundedCount: refundedTotals?.paymentCount || 0,
    failedCount: findStatusTotal(PAYMENT_STATUSES.FAILED)?.paymentCount || 0,
    // Rounded to the rupee: a fare is never charged in cents.
    averageFare: collectedCount > 0 ? Math.round(collectedAmount / collectedCount) : 0,
    byMethod: totalsByMethod.map((methodTotal) => ({
      method: methodTotal._id,
      paymentCount: methodTotal.paymentCount,
      totalAmount: methodTotal.totalAmount,
    })),
    dailyTakings,
    byRoute,
    recentTransactions,
  };
}

/**
 * Refunds a fare from the admin dashboard, which is how a complaint ends in money going back.
 * A passenger can already refund themselves by cancelling an unused ticket; this is the same
 * movement for the cases they cannot reach, such as a ticket already used on the bus.
 * @param {string} paymentId - Payment to refund.
 * @returns {Promise<object>} The refunded payment.
 */
async function refundPayment(paymentId) {
  const refundablePayment = await Payment.findById(paymentId);
  if (!refundablePayment) {
    throw new AppError('Payment not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (refundablePayment.status !== PAYMENT_STATUSES.PAID) {
    throw new AppError(
      `A ${refundablePayment.status} payment cannot be refunded.`,
      HTTP_STATUS.CONFLICT
    );
  }

  const paidTicket = await Ticket.findById(refundablePayment.ticketId);
  refundablePayment.status = PAYMENT_STATUSES.REFUNDED;
  await refundablePayment.save();

  // A ticket nobody has travelled on is cancelled too, so the seat goes back on the map. A used
  // ticket keeps its seat: that journey really happened, and the trip may still be running.
  if (paidTicket?.status === TICKET_STATUSES.ACTIVE) {
    paidTicket.status = TICKET_STATUSES.CANCELLED;
    paidTicket.cancelledAt = new Date();
    await paidTicket.save();
    await seatService.releaseSeatsForTicket(paidTicket.id);
  }

  if (paidTicket && refundablePayment.method === PAYMENT_METHODS.WALLET) {
    await walletService.refundToWallet(paidTicket.userId, {
      amount: refundablePayment.amount,
      description: `Refund for ticket ${paidTicket.ticketKey}`,
      ticketId: paidTicket.id,
    });
  }

  if (paidTicket) {
    const refundDestination =
      refundablePayment.method === PAYMENT_METHODS.WALLET
        ? 'your mobile wallet'
        : `the ${refundablePayment.method} it was paid with`;
    await notificationService.createNotification({
      recipientUserIds: [String(paidTicket.userId)],
      type: NOTIFICATION_TYPES.PAYMENT,
      title: 'Fare refunded',
      message: `Rs. ${refundablePayment.amount} for ticket ${paidTicket.ticketKey} has been refunded to ${refundDestination}.`,
      related: { routeId: paidTicket.routeId, tripId: paidTicket.tripId },
    });
  }

  return refundablePayment;
}

module.exports = {
  listPaymentMethods,
  payForTicket,
  getPaymentForTicket,
  listMyPayments,
  getFinanceSummary,
  refundPayment,
};
