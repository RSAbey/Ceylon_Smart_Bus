// Live tracking endpoints mounted at /api/tracking (Member 02). Drivers post, passengers read.
const express = require('express');
const trackingController = require('./tracking.controller');
const { postLocationValidationRules, nearbyValidationRules } = require('./tracking.validation');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('../users/user.constants');

const trackingRouter = express.Router();

trackingRouter.use(authenticateToken);

// Only a driver may report a bus position, and only for their own trip.
trackingRouter.post(
  '/location',
  authorizeRoles(USER_ROLES.DRIVER),
  postLocationValidationRules,
  validateRequest,
  trackingController.postBusLocation
);

trackingRouter.get('/nearby', nearbyValidationRules, validateRequest, trackingController.getNearbyBuses);
trackingRouter.get('/trips/:tripId', trackingController.getTripTracking);

module.exports = trackingRouter;
