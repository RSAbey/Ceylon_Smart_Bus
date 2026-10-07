// HTTP layer for seats: reads the request, calls seat.service, sends the envelope.
const seatService = require('./seat.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');

/**
 * GET /api/seats/trip/:tripId - the seat map for one trip.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getSeatMap(request, response) {
  const seatMap = await seatService.getSeatMap(request.params.tripId);
  sendResponse(response, 'Seat map loaded.', seatMap);
}

module.exports = {
  getSeatMap: asyncHandler(getSeatMap),
};
