// express-validator rules for admin driver management (Member 01).
const { body } = require('express-validator');
const { USER_STATUSES } = require('../users/user.constants');
const { MIN_PASSWORD_LENGTH, SRI_LANKA_MOBILE_PATTERN } = require('../auth/auth.constants');

/** Sri Lankan NIC: either 9 digits plus V/X, or the newer 12-digit form. */
const NIC_PATTERN = /^(?:\d{9}[VXvx]|\d{12})$/;

const registerDriverValidationRules = [
  body('fullName').trim().notEmpty().withMessage("Enter the driver's full name."),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address (e.g. name@domain.com)')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('mobile')
    .trim()
    .matches(SRI_LANKA_MOBILE_PATTERN)
    .withMessage('Enter a Sri Lankan mobile number, for example 0771234567.'),
  body('password')
    .isLength({ min: MIN_PASSWORD_LENGTH })
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`),
  body('licenseNumber').trim().notEmpty().withMessage('Enter the driving licence number.'),
  body('nic').trim().matches(NIC_PATTERN).withMessage('Enter a valid NIC, for example 199007158812.'),
];

const updateDriverValidationRules = [
  body('fullName').optional().trim().notEmpty().withMessage("Enter the driver's full name."),
  body('licenseNumber').optional().trim().notEmpty().withMessage('Enter the driving licence number.'),
  body('nic').optional().trim().matches(NIC_PATTERN).withMessage('Enter a valid NIC, for example 199007158812.'),
  body('status')
    .optional()
    .isIn(Object.values(USER_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(USER_STATUSES).join(', ')}.`),
];

module.exports = { registerDriverValidationRules, updateDriverValidationRules };
