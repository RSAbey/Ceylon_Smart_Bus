// HTTP layer for alert settings: reads the request, calls alertSubscription.service, sends the envelope.
const alertSubscriptionService = require('./alertSubscription.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * GET /api/alert-subscriptions - the passenger's alert settings.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listSubscriptions(request, response) {
  const subscriptions = await alertSubscriptionService.listSubscriptions(request.user.userId);
  sendResponse(response, 'Alert settings loaded.', { subscriptions });
}

/**
 * POST /api/alert-subscriptions - turn alerts on for a route.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function subscribe(request, response) {
  const subscription = await alertSubscriptionService.subscribe(request.user.userId, request.body);
  sendResponse(response, 'Alerts turned on for this route.', subscription, HTTP_STATUS.CREATED);
}

/**
 * PATCH /api/alert-subscriptions/:subscriptionId - change the type, or pause and resume.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function updateSubscription(request, response) {
  const subscription = await alertSubscriptionService.updateSubscription(
    request.user.userId,
    request.params.subscriptionId,
    request.body
  );
  sendResponse(response, 'Alert setting updated.', subscription);
}

/**
 * DELETE /api/alert-subscriptions/:subscriptionId - stop alerts for a route.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function unsubscribe(request, response) {
  await alertSubscriptionService.unsubscribe(request.user.userId, request.params.subscriptionId);
  sendResponse(response, 'Alerts turned off for this route.');
}

module.exports = {
  listSubscriptions: asyncHandler(listSubscriptions),
  subscribe: asyncHandler(subscribe),
  updateSubscription: asyncHandler(updateSubscription),
  unsubscribe: asyncHandler(unsubscribe),
};
