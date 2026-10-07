// Admin finance endpoints mounted at /api/admin/finance (Member 03). Admin only.
const express = require('express');
const paymentController = require('./payment.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const { USER_ROLES } = require('../users/user.constants');

const paymentAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
paymentAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

paymentAdminRouter.get('/', paymentController.getFinanceSummary);

module.exports = paymentAdminRouter;
