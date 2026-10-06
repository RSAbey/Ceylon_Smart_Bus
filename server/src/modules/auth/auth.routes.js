// Auth endpoints mounted at /api/auth (Member 01). All of these are public: the caller has no token yet.
const express = require('express');
const authController = require('./auth.controller');
const {
  loginValidationRules,
  registerValidationRules,
  verifyOtpValidationRules,
  resendOtpValidationRules,
} = require('./auth.validation');
const validateRequest = require('../../middleware/validateRequest');

const authRouter = express.Router();

authRouter.post('/register', registerValidationRules, validateRequest, authController.register);
authRouter.post('/verify-otp', verifyOtpValidationRules, validateRequest, authController.verifyOtp);
authRouter.post('/resend-otp', resendOtpValidationRules, validateRequest, authController.resendOtp);
authRouter.post('/login', loginValidationRules, validateRequest, authController.login);

module.exports = authRouter;
