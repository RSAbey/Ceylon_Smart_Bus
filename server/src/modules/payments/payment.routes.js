// Payment endpoints mounted at /api/payments (Member 03). Signed-in passengers paying their own fares.
const express = require('express');
const { body } = require('express-validator');
const paymentController = require('./payment.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const validateRequest = require('../../middleware/validateRequest');
const { PAYMENT_METHODS } = require('./payment.constants');

const paymentRouter = express.Router();

paymentRouter.use(authenticateToken);

paymentRouter.get('/methods', paymentController.listPaymentMethods);
paymentRouter.get('/', paymentController.listMyPayments);
paymentRouter.post(
  '/',
  [
    body('ticketId').isMongoId().withMessage('Choose the ticket you are paying for.'),
    body('method')
      .isIn(Object.values(PAYMENT_METHODS))
      .withMessage('Choose a payment method from the list.'),
  ],
  validateRequest,
  paymentController.payForTicket
);

module.exports = paymentRouter;
