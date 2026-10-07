// Delay endpoints mounted at /api/delays (Member 04). Drivers only: a delay is reported from the bus.
const express = require('express');
const delayController = require('./delay.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('../users/user.constants');
const {
  reportDelayValidationRules,
  updateDelayValidationRules,
  delayReportIdValidationRules,
  delayFilterValidationRules,
} = require('./delay.validation');

const delayRouter = express.Router();

delayRouter.use(authenticateToken, authorizeRoles(USER_ROLES.DRIVER));

delayRouter.post('/', reportDelayValidationRules, validateRequest, delayController.reportDelay);
delayRouter.get('/active', delayController.getActiveDelay);
delayRouter.get(
  '/mine',
  delayFilterValidationRules,
  validateRequest,
  delayController.listMyDelayReports
);
delayRouter.patch(
  '/:delayReportId/resolve',
  delayReportIdValidationRules,
  validateRequest,
  delayController.resolveDelayReport
);
delayRouter.patch(
  '/:delayReportId',
  updateDelayValidationRules,
  validateRequest,
  delayController.updateDelayReport
);
delayRouter.delete(
  '/:delayReportId',
  delayReportIdValidationRules,
  validateRequest,
  delayController.cancelDelayReport
);

module.exports = delayRouter;
