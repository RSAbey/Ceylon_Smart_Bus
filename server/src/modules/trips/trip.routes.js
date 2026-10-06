// Trip endpoints mounted at /api/trips (Member 02). Drivers only: these control a bus in service.
const express = require('express');
const tripController = require('./trip.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const { USER_ROLES } = require('../users/user.constants');

const tripRouter = express.Router();

tripRouter.use(authenticateToken, authorizeRoles(USER_ROLES.DRIVER));

tripRouter.get('/mine', tripController.getMyTripOverview);
tripRouter.post('/start', tripController.startTrip);
tripRouter.post('/end', tripController.endTrip);

module.exports = tripRouter;
