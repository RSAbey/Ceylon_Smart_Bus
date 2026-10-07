// Payment business logic (Member 03, FR-07). Payments are mocked: no real gateway is called, so a
// "paid" row simply records which method the passenger chose and what it cost.
const Payment = require('./payment.model');
const Ticket = require('../tickets/ticket.model');
const notificationService = require('../notifications/notification.service');
const walletService = require('./wallet.service');
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require('./payment.constants');
const { TICKET_STATUSES } = require('../tickets/ticket.constants');
const { NOTIFICATION_TYPES } = require('../notifications/notification.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/** How many transactions the admin finance page lists under the totals. */
const RECENT_TRANSACTION_LIMIT = 20;

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
 * Finance totals and the latest transactions for the admin dashboard (FR-10).
 * @returns {Promise<object>} Totals by status and method, plus recent transactions.
 */
async function getFinanceSummary() {
  const [totalsByStatus, totalsByMethod] = await Promise.all([
    Payment.aggregate([
      { $group: { _id: '$status', paymentCount: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUSES.PAID } },
      { $group: { _id: '$method', paymentCount: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]),
  ]);

  const paidTotals = totalsByStatus.find((statusTotal) => statusTotal._id === PAYMENT_STATUSES.PAID);
  const refundedTotals = totalsByStatus.find(
    (statusTotal) => statusTotal._id === PAYMENT_STATUSES.REFUNDED
  );

  const recentPayments = await Payment.find().sort({ paidAt: -1 }).limit(RECENT_TRANSACTION_LIMIT);
  const recentTicketIds = recentPayments.map((recentPayment) => recentPayment.ticketId);
  const recentTickets = await Ticket.find({ _id: { $in: recentTicketIds } })
    .select('ticketKey userId routeId')
    .populate('routeId', 'routeNumber')
    .populate('userId', 'fullName');

  return {
    collectedAmount: paidTotals?.totalAmount || 0,
    collectedCount: paidTotals?.paymentCount || 0,
    refundedAmount: refundedTotals?.totalAmount || 0,
    refundedCount: refundedTotals?.paymentCount || 0,
    byMethod: totalsByMethod.map((methodTotal) => ({
      method: methodTotal._id,
      paymentCount: methodTotal.paymentCount,
      totalAmount: methodTotal.totalAmount,
    })),
    recentTransactions: recentPayments.map((recentPayment) => {
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
        passengerName: matchingTicket?.userId?.fullName || null,
        routeNumber: matchingTicket?.routeId?.routeNumber || null,
      };
    }),
  };
}

module.exports = {
  listPaymentMethods,
  payForTicket,
  getPaymentForTicket,
  listMyPayments,
  getFinanceSummary,
};
