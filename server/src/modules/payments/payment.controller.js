// HTTP layer for payments: reads the request, calls payment.service, sends the envelope.
const paymentService = require('./payment.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * GET /api/payments/methods - the payment methods the app accepts.
 * @param {import('express').Request} _request - Unused.
 * @param {import('express').Response} response - Express response.
 * @returns {void} Nothing; the response is sent.
 */
function listPaymentMethods(_request, response) {
  sendResponse(response, 'Payment methods loaded.', {
    paymentMethods: paymentService.listPaymentMethods(),
  });
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
  listPaymentMethods,
  listMyPayments: asyncHandler(listMyPayments),
  payForTicket: asyncHandler(payForTicket),
  getFinanceSummary: asyncHandler(getFinanceSummary),
};
