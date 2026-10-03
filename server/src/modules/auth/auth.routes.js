// Auth endpoints mounted at /api/auth (Member 01). Login is public; no token is needed.
const express = require('express');
const authController = require('./auth.controller');
const { loginValidationRules } = require('./auth.validation');
const validateRequest = require('../../middleware/validateRequest');

const authRouter = express.Router();

authRouter.post('/login', loginValidationRules, validateRequest, authController.login);

/**
 * Planned scope for Member 01 (paths are chosen by the owner and documented in docs/api/m01-accounts.md):
 * - Passenger registration with email or mobile (FR-01), which creates an OTP
 * - OTP verification and resend with a 60 s countdown (mock delivery, no SMS gateway)
 */

module.exports = authRouter;
