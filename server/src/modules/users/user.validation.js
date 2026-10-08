// express-validator rules for the user endpoints (Member 01).
const { body, param, query } = require('express-validator');
const { USER_STATUSES } = require('./user.constants');
const { SRI_LANKA_MOBILE_PATTERN } = require('../auth/auth.constants');

const updateMyProfileValidationRules = [
  body('fullName').optional().trim().notEmpty().withMessage('Enter your full name.'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address (e.g. name@domain.com)')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('mobile')
    .optional()
    .trim()
    .matches(SRI_LANKA_MOBILE_PATTERN)
    .withMessage('Enter a Sri Lankan mobile number, for example 0771234567.'),
  body('avatarUrl').optional().trim().isURL().withMessage('Enter a valid image address.'),
];

const setUserStatusValidationRules = [
  body('status')
    .isIn(Object.values(USER_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(USER_STATUSES).join(', ')}.`),
];

const MAX_SEARCH_LENGTH = 60;

const passengerListValidationRules = [
  query('status')
    .optional({ values: 'falsy' })
    .isIn(Object.values(USER_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(USER_STATUSES).join(', ')}.`),
  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: MAX_SEARCH_LENGTH })
    .withMessage(`Keep the search under ${MAX_SEARCH_LENGTH} characters.`),
];

const passengerIdValidationRules = [
  param('userId').isMongoId().withMessage('Passenger not found.'),
];

module.exports = {
  updateMyProfileValidationRules,
  setUserStatusValidationRules,
  passengerListValidationRules,
  passengerIdValidationRules,
};
