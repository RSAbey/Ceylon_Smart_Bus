// Admin delay endpoints mounted at /api/admin/delays (Member 04). Admin only.
const express = require('express');
const delayController = require('./delay.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('../users/user.constants');
const { delayFilterValidationRules, reviewDelayValidationRules } = require('./delay.validation');

const delayAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
delayAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

delayAdminRouter.get(
  '/',
  delayFilterValidationRules,
  validateRequest,
  delayController.listAllDelayReports
);
delayAdminRouter.patch(
  '/:delayReportId',
  reviewDelayValidationRules,
  validateRequest,
  delayController.reviewDelayReport
);

module.exports = delayAdminRouter;
