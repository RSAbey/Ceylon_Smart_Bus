// Alert-setting endpoints mounted at /api/alert-subscriptions (Member 04). Signed-in passengers.
const express = require('express');
const { body, param } = require('express-validator');
const alertSubscriptionController = require('./alertSubscription.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const validateRequest = require('../../middleware/validateRequest');
const { ALERT_TYPES } = require('./alertSubscription.constants');

const alertSubscriptionRouter = express.Router();

alertSubscriptionRouter.use(authenticateToken);

const subscriptionIdRules = [
  param('subscriptionId').isMongoId().withMessage('Alert setting not found.'),
];

const alertTypeRule = body('alertType')
  .optional()
  .isIn(Object.values(ALERT_TYPES))
  .withMessage(`Alert type must be one of: ${Object.values(ALERT_TYPES).join(', ')}.`);

alertSubscriptionRouter.get('/', alertSubscriptionController.listSubscriptions);
alertSubscriptionRouter.post(
  '/',
  [body('routeId').isMongoId().withMessage('Choose a route to get alerts for.'), alertTypeRule],
  validateRequest,
  alertSubscriptionController.subscribe
);
alertSubscriptionRouter.patch(
  '/:subscriptionId',
  [
    ...subscriptionIdRules,
    alertTypeRule,
    body('isActive').optional().isBoolean().withMessage('isActive must be true or false.'),
  ],
  validateRequest,
  alertSubscriptionController.updateSubscription
);
alertSubscriptionRouter.delete(
  '/:subscriptionId',
  subscriptionIdRules,
  validateRequest,
  alertSubscriptionController.unsubscribe
);

module.exports = alertSubscriptionRouter;
