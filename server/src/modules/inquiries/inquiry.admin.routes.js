// Admin inquiry endpoints mounted at /api/admin/inquiries (Member 03). Admin only.
const express = require('express');
const inquiryController = require('./inquiry.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('../users/user.constants');
const {
  inquiryIdValidationRules,
  replyValidationRules,
  inboxFilterValidationRules,
  assignInquiryValidationRules,
} = require('./inquiry.validation');

const inquiryAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
inquiryAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

inquiryAdminRouter.get(
  '/',
  inboxFilterValidationRules,
  validateRequest,
  inquiryController.listAllInquiries
);
inquiryAdminRouter.get(
  '/:inquiryId',
  inquiryIdValidationRules,
  validateRequest,
  inquiryController.getInquiryForAdmin
);
inquiryAdminRouter.post(
  '/:inquiryId/replies',
  replyValidationRules,
  validateRequest,
  inquiryController.replyToInquiry
);
inquiryAdminRouter.patch(
  '/:inquiryId/close',
  inquiryIdValidationRules,
  validateRequest,
  inquiryController.closeInquiry
);
inquiryAdminRouter.patch(
  '/:inquiryId/reopen',
  inquiryIdValidationRules,
  validateRequest,
  inquiryController.reopenInquiry
);
inquiryAdminRouter.patch(
  '/:inquiryId/assignee',
  assignInquiryValidationRules,
  validateRequest,
  inquiryController.assignInquiry
);

module.exports = inquiryAdminRouter;
