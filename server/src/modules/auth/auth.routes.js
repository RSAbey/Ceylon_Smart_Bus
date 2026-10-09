// Auth endpoints mounted at /api/auth (Member 01). All of these are public: the caller has no token yet.
const express = require('express');
const authController = require('./auth.controller');
const {
  loginValidationRules,
  registerValidationRules,
  verifyOtpValidationRules,
  resendOtpValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
} = require('./auth.validation');
const validateRequest = require('../../middleware/validateRequest');

const authRouter = express.Router();

authRouter.post('/register', registerValidationRules, validateRequest, authController.register);
authRouter.post('/verify-otp', verifyOtpValidationRules, validateRequest, authController.verifyOtp);
authRouter.post('/resend-otp', resendOtpValidationRules, validateRequest, authController.resendOtp);
authRouter.post('/login', loginValidationRules, validateRequest, authController.login);
authRouter.post(
  '/forgot-password',
  forgotPasswordValidationRules,
  validateRequest,
  authController.forgotPassword
);
authRouter.post(
  '/reset-password',
  resetPasswordValidationRules,
  validateRequest,
  authController.resetPassword
);

module.exports = authRouter;
