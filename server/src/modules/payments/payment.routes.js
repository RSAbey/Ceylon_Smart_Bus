// Payment and wallet endpoints mounted at /api/payments (Member 03). Signed-in passengers.
// The wallet lives here rather than in its own module so the shared route registry needs no edit.
const express = require('express');
const paymentController = require('./payment.controller');
const walletController = require('./wallet.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { payForTicketValidationRules, topUpValidationRules } = require('./payment.validation');
const { USER_ROLES } = require('../users/user.constants');

const paymentRouter = express.Router();

paymentRouter.use(authenticateToken);

paymentRouter.get('/methods', paymentController.listPaymentMethods);
// Driver-only: the takings for the shift they are working.
paymentRouter.get('/shift', authorizeRoles(USER_ROLES.DRIVER), paymentController.getShiftSummary);
paymentRouter.get('/wallet', walletController.getWallet);
paymentRouter.post('/wallet/topup', topUpValidationRules, validateRequest, walletController.topUpWallet);
paymentRouter.get('/', paymentController.listMyPayments);
paymentRouter.post('/', payForTicketValidationRules, validateRequest, paymentController.payForTicket);

module.exports = paymentRouter;
