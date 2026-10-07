// HTTP layer for the driver's trip bookings: reads the request, calls booking.service, sends the envelope.
const bookingService = require('./booking.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');

/**
 * GET /api/seats/bookings - who has reserved a seat on the trip the driver is running.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getTripBookings(request, response) {
  const bookingOverview = await bookingService.getTripBookings(request.user.userId);
  sendResponse(response, 'Bookings loaded.', bookingOverview);
}

/**
 * PATCH /api/seats/bookings/accepting - open or close the trip to new reservations.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function setAcceptingBookings(request, response) {
  const bookingOverview = await bookingService.setAcceptingBookings(
    request.user.userId,
    request.body.isAcceptingBookings
  );
  sendResponse(
    response,
    request.body.isAcceptingBookings
      ? 'This bus is taking seat reservations again.'
      : 'This bus is now walk-on only.',
    bookingOverview
  );
}

module.exports = {
  getTripBookings: asyncHandler(getTripBookings),
  setAcceptingBookings: asyncHandler(setAcceptingBookings),
};
