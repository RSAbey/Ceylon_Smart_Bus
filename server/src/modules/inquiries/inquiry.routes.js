// Inquiry endpoints mounted at /api/inquiries (Member 03). Signed-in passengers and drivers.
const express = require('express');
const inquiryController = require('./inquiry.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const validateRequest = require('../../middleware/validateRequest');
const {
  createInquiryValidationRules,
  updateInquiryValidationRules,
  inquiryIdValidationRules,
  inboxFilterValidationRules,
} = require('./inquiry.validation');

const inquiryRouter = express.Router();

inquiryRouter.use(authenticateToken);

inquiryRouter.get('/', inboxFilterValidationRules, validateRequest, inquiryController.listMyInquiries);
inquiryRouter.post('/', createInquiryValidationRules, validateRequest, inquiryController.createInquiry);
inquiryRouter.get(
  '/:inquiryId',
  inquiryIdValidationRules,
  validateRequest,
  inquiryController.getInquiryDetails
);
inquiryRouter.put(
  '/:inquiryId',
  updateInquiryValidationRules,
  validateRequest,
  inquiryController.updateInquiry
);
inquiryRouter.delete(
  '/:inquiryId',
  inquiryIdValidationRules,
  validateRequest,
  inquiryController.deleteInquiry
);

module.exports = inquiryRouter;
