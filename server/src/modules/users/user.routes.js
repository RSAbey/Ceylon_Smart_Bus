// User endpoints mounted at /api/users (Member 01). Every route needs a signed-in user.
const express = require('express');
const userController = require('./user.controller');
const {
  updateMyProfileValidationRules,
  changePasswordValidationRules,
  deleteAccountValidationRules,
} = require('./user.validation');
const authenticateToken = require('../../middleware/authenticateToken');
const validateRequest = require('../../middleware/validateRequest');

const userRouter = express.Router();

userRouter.use(authenticateToken);

userRouter.get('/me', userController.getMyProfile);
userRouter.patch('/me', updateMyProfileValidationRules, validateRequest, userController.updateMyProfile);
userRouter.patch(
  '/me/password',
  changePasswordValidationRules,
  validateRequest,
  userController.changeMyPassword
);
userRouter.delete(
  '/me',
  deleteAccountValidationRules,
  validateRequest,
  userController.deleteMyAccount
);

module.exports = userRouter;
