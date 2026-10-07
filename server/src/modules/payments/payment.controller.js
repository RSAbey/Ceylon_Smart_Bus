// HTTP layer for payments: reads the request, calls payment.service, sends the envelope.
const paymentService = require('./payment.service');
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
 * GET /api/admin/finance - finance totals and recent transactions for the admin dashboard.
 * @param {import('express').Request} _request - Unused.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getFinanceSummary(_request, response) {
  const financeSummary = await paymentService.getFinanceSummary();
  sendResponse(response, 'Finance summary loaded.', financeSummary);
}

module.exports = {
  listPaymentMethods: asyncHandler(listPaymentMethods),
  listMyPayments: asyncHandler(listMyPayments),
  payForTicket: asyncHandler(payForTicket),
  getFinanceSummary: asyncHandler(getFinanceSummary),
};
