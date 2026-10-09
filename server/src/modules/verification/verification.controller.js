// HTTP layer for ticket verification: reads the request, calls verification.service, sends the envelope.
const verificationService = require('./verification.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');

/**
 * POST /api/verification - check a ticket by scanned QR code or typed ticket key.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function verifyTicket(request, response) {
  const verification = await verificationService.verifyTicket(request.user.userId, request.body);
  sendResponse(response, verification.reason, verification);
}

/**
 * GET /api/verification/mine - the driver's recent ticket checks.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listMyVerifications(request, response) {
  const verifications = await verificationService.listMyVerifications(request.user.userId);
  sendResponse(response, 'Recent checks loaded.', { verifications });
}

module.exports = {
  verifyTicket: asyncHandler(verifyTicket),
  listMyVerifications: asyncHandler(listMyVerifications),
};
