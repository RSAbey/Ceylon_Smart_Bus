// Seat endpoints mounted at /api/seats (Member 03). Signed-in passengers choosing a seat.
const express = require('express');
const { param } = require('express-validator');
const seatController = require('./seat.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const validateRequest = require('../../middleware/validateRequest');

const seatRouter = express.Router();

seatRouter.use(authenticateToken);

seatRouter.get(
  '/trip/:tripId',
  [param('tripId').isMongoId().withMessage('Choose a bus before picking a seat.')],
  validateRequest,
  seatController.getSeatMap
);

module.exports = seatRouter;
