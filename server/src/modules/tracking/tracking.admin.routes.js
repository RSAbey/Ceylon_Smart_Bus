// Admin live fleet mounted at /api/admin/fleet (admin only) — Member 02.
const express = require('express');
const trackingController = require('./tracking.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const { USER_ROLES } = require('../users/user.constants');

const trackingAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
trackingAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

trackingAdminRouter.get('/', trackingController.getFleetPositions);

module.exports = trackingAdminRouter;
