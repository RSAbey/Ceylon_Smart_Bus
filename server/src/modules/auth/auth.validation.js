// express-validator rules for the auth endpoints (server-side input validation, never trust the client).
const { body } = require('express-validator');
const { MIN_PASSWORD_LENGTH, OTP_DIGIT_COUNT, SRI_LANKA_MOBILE_PATTERN } = require('./auth.constants');

const loginValidationRules = [
  body('identifier').trim().notEmpty().withMessage('Enter your email or mobile number.'),
  body('password').notEmpty().withMessage('Enter your password.'),
];

const registerValidationRules = [
  body('fullName').trim().notEmpty().withMessage('Enter your full name.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Enter your email address.')
    .bail()
    .isEmail()
    .withMessage('Please enter a valid email address (e.g. name@domain.com)')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Enter your mobile number.')
    .bail()
    .matches(SRI_LANKA_MOBILE_PATTERN)
    .withMessage('Enter a Sri Lankan mobile number, for example 0771234567.'),
  body('password')
    .isLength({ min: MIN_PASSWORD_LENGTH })
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`),
  body('hasAcceptedTerms')
    .isBoolean()
    .withMessage('Please accept the Terms of Service and Privacy Policy.')
    .bail()
    .custom((isAccepted) => isAccepted === true)
    .withMessage('Please accept the Terms of Service and Privacy Policy.'),
];

const verifyOtpValidationRules = [
  body('userId').trim().notEmpty().withMessage('Missing registration reference.'),
  body('otpCode')
    .trim()
    .isLength({ min: OTP_DIGIT_COUNT, max: OTP_DIGIT_COUNT })
    .withMessage(`Enter the ${OTP_DIGIT_COUNT}-digit code.`)
    .bail()
    .isNumeric()
    .withMessage('The code contains digits only.'),
];

const resendOtpValidationRules = [
  body('userId').trim().notEmpty().withMessage('Missing registration reference.'),
];

module.exports = {
  loginValidationRules,
  registerValidationRules,
  verifyOtpValidationRules,
  resendOtpValidationRules,
};
