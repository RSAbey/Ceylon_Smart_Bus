// Admin account management mounted at /api/admin/users (admin only) — Member 01.
const express = require('express');
const userController = require('./user.controller');
const {
  setUserStatusValidationRules,
  passengerListValidationRules,
  passengerIdValidationRules,
} = require('./user.validation');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('./user.constants');

const userAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
userAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

userAdminRouter.get('/', userController.listUsers);
// Must sit above /:userId routes so "passengers" is never read as a user id.
userAdminRouter.get(
  '/passengers',
  passengerListValidationRules,
  validateRequest,
  userController.listPassengers
);
userAdminRouter.get(
  '/passengers/:userId',
  passengerIdValidationRules,
  validateRequest,
  userController.getPassenger
);
userAdminRouter.patch(
  '/:userId/status',
  setUserStatusValidationRules,
  validateRequest,
  userController.setUserStatus
);

module.exports = userAdminRouter;
