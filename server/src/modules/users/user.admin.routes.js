// Admin account management mounted at /api/admin/users (admin only) — Member 01.
const express = require('express');
const userController = require('./user.controller');
const { setUserStatusValidationRules } = require('./user.validation');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('./user.constants');

const userAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
userAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

userAdminRouter.get('/', userController.listUsers);
userAdminRouter.patch(
  '/:userId/status',
  setUserStatusValidationRules,
  validateRequest,
  userController.setUserStatus
);

module.exports = userAdminRouter;
