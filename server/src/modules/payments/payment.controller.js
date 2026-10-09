// HTTP layer for payments: reads the request, calls payment.service, sends the envelope.
const paymentService = require('./payment.service');
const shiftService = require('./shift.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * GET /api/payments/methods - the accepted methods, including the live wallet balance.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listPaymentMethods(request, response) {
  const paymentMethods = await paymentService.listPaymentMethods(request.user.userId);
  sendResponse(response, 'Payment methods loaded.', { paymentMethods });
}

/**
 * GET /api/payments - the passenger's own payment history.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listMyPayments(request, response) {
  const payments = await paymentService.listMyPayments(request.user.userId);
  sendResponse(response, 'Payments loaded.', { payments });
}

/**
 * POST /api/payments - pay for a ticket with the chosen (mock) method.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function payForTicket(request, response) {
  const payment = await paymentService.payForTicket(request.user.userId, request.body);
  sendResponse(response, 'Payment successful.', payment, HTTP_STATUS.CREATED);
}

/**
 * GET /api/payments/shift - what this driver has collected today, split cash against digital.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getShiftSummary(request, response) {
  const shiftSummary = await shiftService.getShiftSummary(request.user.userId);
  sendResponse(response, 'Shift totals loaded.', shiftSummary);
}

/**
 * GET /api/admin/finance?days=&status= - takings, fares and transactions for the admin dashboard.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getFinanceSummary(request, response) {
  const financeSummary = await paymentService.getFinanceSummary({
    // No days at all means "everything ever taken", which the page offers as All time.
    periodDays: request.query.days ? Number(request.query.days) : null,
    status: request.query.status,
  });
  sendResponse(response, 'Finance summary loaded.', financeSummary);
}

/**
 * POST /api/admin/finance/payments/:paymentId/refund - refunds a fare from the dashboard.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function refundPayment(request, response) {
  const refundedPayment = await paymentService.refundPayment(request.params.paymentId);
  sendResponse(response, 'Fare refunded.', { payment: refundedPayment });
}

module.exports = {
  listPaymentMethods: asyncHandler(listPaymentMethods),
  listMyPayments: asyncHandler(listMyPayments),
  payForTicket: asyncHandler(payForTicket),
  getShiftSummary: asyncHandler(getShiftSummary),
  getFinanceSummary: asyncHandler(getFinanceSummary),
  refundPayment: asyncHandler(refundPayment),
};
