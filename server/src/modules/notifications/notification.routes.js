// Notification endpoints mounted at /api/notifications (Member 04). Signed-in passengers and drivers.
const express = require('express');
const { param, query } = require('express-validator');
const notificationController = require('./notification.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const validateRequest = require('../../middleware/validateRequest');
const { NOTIFICATION_TYPES } = require('./notification.constants');

const notificationRouter = express.Router();

notificationRouter.use(authenticateToken);

const notificationIdRules = [
  param('notificationId').isMongoId().withMessage('Alert not found.'),
];

notificationRouter.get(
  '/',
  [
    query('type')
      .optional()
      .isIn(Object.values(NOTIFICATION_TYPES))
      .withMessage('Unknown alert type.'),
    query('isRead').optional().isBoolean().withMessage('isRead must be true or false.'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be 1 or more.'),
  ],
  validateRequest,
  notificationController.listNotifications
);
notificationRouter.get('/unread-count', notificationController.getUnreadCount);
// Must sit above /:notificationId/read so "read-all" is not read as an id.
notificationRouter.patch('/read-all', notificationController.markAllAsRead);
notificationRouter.patch(
  '/:notificationId/read',
  notificationIdRules,
  validateRequest,
  notificationController.markAsRead
);
notificationRouter.delete('/', notificationController.clearReadNotifications);
notificationRouter.delete(
  '/:notificationId',
  notificationIdRules,
  validateRequest,
  notificationController.dismissNotification
);

module.exports = notificationRouter;
