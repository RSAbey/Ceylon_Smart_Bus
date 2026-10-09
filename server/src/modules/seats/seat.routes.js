// Seat endpoints mounted at /api/seats (Member 03). Passengers read the seat map; drivers manage
// the bookings on the trip they are running.
const express = require('express');
const { body, param } = require('express-validator');
const seatController = require('./seat.controller');
const bookingController = require('./booking.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('../users/user.constants');

const seatRouter = express.Router();

seatRouter.use(authenticateToken);

// Driver-only, and placed above /trip/:tripId so "bookings" is never read as a trip id.
seatRouter.get('/bookings', authorizeRoles(USER_ROLES.DRIVER), bookingController.getTripBookings);
seatRouter.patch(
  '/bookings/accepting',
  authorizeRoles(USER_ROLES.DRIVER),
  [body('isAcceptingBookings').isBoolean().withMessage('Choose whether to take bookings.')],
  validateRequest,
  bookingController.setAcceptingBookings
);

seatRouter.get(
  '/trip/:tripId',
  [param('tripId').isMongoId().withMessage('Choose a bus before picking a seat.')],
  validateRequest,
  seatController.getSeatMap
);

module.exports = seatRouter;
