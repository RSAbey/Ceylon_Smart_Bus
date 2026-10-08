// express-validator rules for inquiries (Member 03).
const { body, param, query } = require('express-validator');
const { INQUIRY_PRIORITIES, INQUIRY_TAGS, INQUIRY_STATUSES } = require('./inquiry.constants');

const MAX_SUBJECT_LENGTH = 120;
const MAX_SEARCH_LENGTH = 60;
/** The value the inbox sends to ask for inquiries nobody has picked up. */
const UNASSIGNED_FILTER = 'unassigned';
/** A Mongo id as it arrives in a query string: 24 hexadecimal characters. */
const MONGO_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 1000;

const createInquiryValidationRules = [
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Enter a short subject.')
    .isLength({ max: MAX_SUBJECT_LENGTH })
    .withMessage(`Keep the subject under ${MAX_SUBJECT_LENGTH} characters.`),
  body('message')
    .trim()
    .isLength({ min: MIN_MESSAGE_LENGTH, max: MAX_MESSAGE_LENGTH })
    .withMessage(`Describe the issue in ${MIN_MESSAGE_LENGTH} to ${MAX_MESSAGE_LENGTH} characters.`),
  body('tag')
    .isIn(Object.values(INQUIRY_TAGS))
    .withMessage('Choose what the inquiry is about.'),
  body('priority')
    .optional()
    .isIn(Object.values(INQUIRY_PRIORITIES))
    .withMessage(`Priority must be one of: ${Object.values(INQUIRY_PRIORITIES).join(', ')}.`),
  body('routeId').optional().isMongoId().withMessage('Choose a route from the list.'),
  body('busId').optional().isMongoId().withMessage('Choose a bus from the list.'),
  body('driverId').optional().isMongoId().withMessage('Choose a driver from the list.'),
];

const updateInquiryValidationRules = [
  param('inquiryId').isMongoId().withMessage('Inquiry not found.'),
  body('subject')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Enter a short subject.')
    .isLength({ max: MAX_SUBJECT_LENGTH })
    .withMessage(`Keep the subject under ${MAX_SUBJECT_LENGTH} characters.`),
  body('message')
    .optional()
    .trim()
    .isLength({ min: MIN_MESSAGE_LENGTH, max: MAX_MESSAGE_LENGTH })
    .withMessage(`Describe the issue in ${MIN_MESSAGE_LENGTH} to ${MAX_MESSAGE_LENGTH} characters.`),
  body('tag').optional().isIn(Object.values(INQUIRY_TAGS)).withMessage('Choose what the inquiry is about.'),
  body('priority')
    .optional()
    .isIn(Object.values(INQUIRY_PRIORITIES))
    .withMessage(`Priority must be one of: ${Object.values(INQUIRY_PRIORITIES).join(', ')}.`),
];

const inquiryIdValidationRules = [
  param('inquiryId').isMongoId().withMessage('Inquiry not found.'),
];

const replyValidationRules = [
  param('inquiryId').isMongoId().withMessage('Inquiry not found.'),
  body('message')
    .trim()
    .isLength({ min: MIN_MESSAGE_LENGTH, max: MAX_MESSAGE_LENGTH })
    .withMessage(`Write a reply of ${MIN_MESSAGE_LENGTH} to ${MAX_MESSAGE_LENGTH} characters.`),
];

const inboxFilterValidationRules = [
  query('status')
    .optional({ values: 'falsy' })
    .isIn(Object.values(INQUIRY_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(INQUIRY_STATUSES).join(', ')}.`),
  query('tag')
    .optional({ values: 'falsy' })
    .isIn(Object.values(INQUIRY_TAGS))
    .withMessage('Unknown inquiry tag.'),
  query('priority')
    .optional({ values: 'falsy' })
    .isIn(Object.values(INQUIRY_PRIORITIES))
    .withMessage(`Priority must be one of: ${Object.values(INQUIRY_PRIORITIES).join(', ')}.`),
  // Either an admin's id, or the word the inbox uses for "nobody has picked this up".
  query('assigneeId')
    .optional({ values: 'falsy' })
    .custom((assigneeId) => assigneeId === UNASSIGNED_FILTER || MONGO_ID_PATTERN.test(assigneeId))
    .withMessage('Choose an administrator, or the unassigned queue.'),
  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: MAX_SEARCH_LENGTH })
    .withMessage(`Keep the search under ${MAX_SEARCH_LENGTH} characters.`),
];

const assignInquiryValidationRules = [
  param('inquiryId').isMongoId().withMessage('Inquiry not found.'),
  body('assigneeId')
    .optional({ values: 'null' })
    .isMongoId()
    .withMessage('Choose an administrator from the list.'),
];

module.exports = {
  createInquiryValidationRules,
  updateInquiryValidationRules,
  inquiryIdValidationRules,
  replyValidationRules,
  inboxFilterValidationRules,
  assignInquiryValidationRules,
};
