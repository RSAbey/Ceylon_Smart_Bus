// express-validator rules for the user endpoints (Member 01).
const { body } = require('express-validator');
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

module.exports = { updateMyProfileValidationRules, setUserStatusValidationRules };
