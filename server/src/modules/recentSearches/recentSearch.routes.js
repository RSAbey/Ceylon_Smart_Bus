// Recent search endpoints mounted at /api/recent-searches (Member 04). Signed-in passengers.
const express = require('express');
const { body } = require('express-validator');
const recentSearchService = require('./recentSearch.service');
const authenticateToken = require('../../middleware/authenticateToken');
const validateRequest = require('../../middleware/validateRequest');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

const recentSearchRouter = express.Router();

recentSearchRouter.use(authenticateToken);

/**
 * GET /api/recent-searches — the passenger's recent journeys.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listRecentSearches(request, response) {
  const recentSearches = await recentSearchService.listRecentSearches(request.user.userId);
  sendResponse(response, 'Recent searches loaded.', { recentSearches });
}

/**
 * POST /api/recent-searches — remember a journey the passenger searched for.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function recordRecentSearch(request, response) {
  const { originText, destinationText, routeId } = request.body;
  const storedSearch = await recentSearchService.recordRecentSearch(request.user.userId, {
    originText,
    destinationText,
    routeId,
  });
  sendResponse(response, 'Search saved.', storedSearch, HTTP_STATUS.CREATED);
}

/**
 * DELETE /api/recent-searches/:searchId — remove one entry.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function removeRecentSearch(request, response) {
  await recentSearchService.removeRecentSearch(request.user.userId, request.params.searchId);
  sendResponse(response, 'Search removed.');
}

/**
 * DELETE /api/recent-searches — clear the whole list.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function clearRecentSearches(request, response) {
  const removedCount = await recentSearchService.clearRecentSearches(request.user.userId);
  sendResponse(response, 'Recent searches cleared.', { removedCount });
}

recentSearchRouter.get('/', asyncHandler(listRecentSearches));
recentSearchRouter.post(
  '/',
  [body('destinationText').trim().notEmpty().withMessage('A destination is required.')],
  validateRequest,
  asyncHandler(recordRecentSearch)
);
recentSearchRouter.delete('/:searchId', asyncHandler(removeRecentSearch));
recentSearchRouter.delete('/', asyncHandler(clearRecentSearches));

module.exports = recentSearchRouter;
