// User endpoints mounted at /api/users (Member 01). Every route needs a signed-in user.
const express = require('express');
const userController = require('./user.controller');
const {
  updateMyProfileValidationRules,
  changePasswordValidationRules,
  deleteAccountValidationRules,
  createAppPinValidationRules,
  changeAppPinValidationRules,
  deleteAppPinValidationRules,
  verifyAppPinValidationRules,
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

// The optional app-lock PIN: read, create, change, remove, and the check the lock screen makes.
userRouter.get('/me/pin', userController.getMyAppPinStatus);
userRouter.post('/me/pin', createAppPinValidationRules, validateRequest, userController.createMyAppPin);
userRouter.patch('/me/pin', changeAppPinValidationRules, validateRequest, userController.changeMyAppPin);
userRouter.delete('/me/pin', deleteAppPinValidationRules, validateRequest, userController.deleteMyAppPin);
userRouter.post(
  '/me/pin/verify',
  verifyAppPinValidationRules,
  validateRequest,
  userController.verifyMyAppPin
);

module.exports = userRouter;
