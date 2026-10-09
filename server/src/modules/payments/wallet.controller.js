// HTTP layer for the mobile wallet: reads the request, calls wallet.service, sends the envelope.
const walletService = require('./wallet.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * GET /api/payments/wallet - the passenger's balance and recent statement.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getWallet(request, response) {
  const walletSummary = await walletService.getWalletSummary(request.user.userId);
  sendResponse(response, 'Wallet loaded.', walletSummary);
}

/**
 * POST /api/payments/wallet/topup - add money to the wallet (mock card charge).
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function topUpWallet(request, response) {
  const walletSummary = await walletService.topUpWallet(request.user.userId, request.body.amount);
  sendResponse(
    response,
    `Rs. ${request.body.amount} added to your wallet.`,
    walletSummary,
    HTTP_STATUS.CREATED
  );
}

module.exports = {
  getWallet: asyncHandler(getWallet),
  topUpWallet: asyncHandler(topUpWallet),
};
