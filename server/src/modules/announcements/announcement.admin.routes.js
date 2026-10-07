// Admin announcement endpoints mounted at /api/admin/announcements (Member 04). Admin only.
const express = require('express');
const { body, param, query } = require('express-validator');
const announcementController = require('./announcement.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('../users/user.constants');
const { ANNOUNCEMENT_SEVERITIES, ANNOUNCEMENT_STATUSES } = require('./announcement.constants');

const announcementAdminRouter = express.Router();

const MAX_TITLE_LENGTH = 120;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 1000;

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
announcementAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

const severityMessage = `Severity must be one of: ${Object.values(ANNOUNCEMENT_SEVERITIES).join(', ')}.`;
const announcementIdRules = [
  param('announcementId').isMongoId().withMessage('Announcement not found.'),
];

announcementAdminRouter.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(Object.values(ANNOUNCEMENT_STATUSES))
      .withMessage(`Status must be one of: ${Object.values(ANNOUNCEMENT_STATUSES).join(', ')}.`),
    query('severity').optional().isIn(Object.values(ANNOUNCEMENT_SEVERITIES)).withMessage(severityMessage),
  ],
  validateRequest,
  announcementController.listAnnouncements
);

announcementAdminRouter.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Enter a title.')
      .isLength({ max: MAX_TITLE_LENGTH })
      .withMessage(`Keep the title under ${MAX_TITLE_LENGTH} characters.`),
    body('message')
      .trim()
      .isLength({ min: MIN_MESSAGE_LENGTH, max: MAX_MESSAGE_LENGTH })
      .withMessage(`Write between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters.`),
    body('severity').optional().isIn(Object.values(ANNOUNCEMENT_SEVERITIES)).withMessage(severityMessage),
    // Left empty the announcement goes to every passenger.
    body('targetRouteId').optional({ values: 'falsy' }).isMongoId().withMessage('Choose a route from the list.'),
    body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid expiry date.'),
  ],
  validateRequest,
  announcementController.createAnnouncement
);

announcementAdminRouter.patch(
  '/:announcementId/publish',
  announcementIdRules,
  validateRequest,
  announcementController.publishAnnouncement
);
announcementAdminRouter.patch(
  '/:announcementId/archive',
  announcementIdRules,
  validateRequest,
  announcementController.archiveAnnouncement
);
announcementAdminRouter.patch(
  '/:announcementId',
  [
    ...announcementIdRules,
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Enter a title.')
      .isLength({ max: MAX_TITLE_LENGTH })
      .withMessage(`Keep the title under ${MAX_TITLE_LENGTH} characters.`),
    body('message')
      .optional()
      .trim()
      .isLength({ min: MIN_MESSAGE_LENGTH, max: MAX_MESSAGE_LENGTH })
      .withMessage(`Write between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters.`),
    body('severity').optional().isIn(Object.values(ANNOUNCEMENT_SEVERITIES)).withMessage(severityMessage),
    body('targetRouteId').optional({ values: 'falsy' }).isMongoId().withMessage('Choose a route from the list.'),
    body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid expiry date.'),
  ],
  validateRequest,
  announcementController.updateAnnouncement
);
announcementAdminRouter.delete(
  '/:announcementId',
  announcementIdRules,
  validateRequest,
  announcementController.deleteAnnouncement
);

module.exports = announcementAdminRouter;
