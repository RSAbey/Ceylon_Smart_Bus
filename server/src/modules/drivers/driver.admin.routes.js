// Admin driver management mounted at /api/admin/drivers (admin only) — Member 01.
// Drivers are created here, never by self-registration (PROJECT_PLAN.md deviation 4).
const express = require('express');
const driverController = require('./driver.controller');
const { registerDriverValidationRules, updateDriverValidationRules } = require('./driver.validation');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('../users/user.constants');

const driverAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
driverAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

driverAdminRouter.post('/', registerDriverValidationRules, validateRequest, driverController.registerDriver);
driverAdminRouter.get('/', driverController.listDrivers);
driverAdminRouter.get('/:driverId', driverController.getDriver);
driverAdminRouter.patch(
  '/:driverId',
  updateDriverValidationRules,
  validateRequest,
  driverController.updateDriver
);
driverAdminRouter.delete('/:driverId', driverController.deleteDriver);

module.exports = driverAdminRouter;
