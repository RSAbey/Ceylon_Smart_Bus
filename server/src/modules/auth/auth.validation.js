// express-validator rules for the auth endpoints (server-side input validation, never trust the client).
const { body } = require('express-validator');
const {
  MIN_PASSWORD_LENGTH,
  OTP_DIGIT_COUNT,
  PASSWORD_SYMBOL_PATTERN,
  PASSWORD_UPPERCASE_PATTERN,
  SRI_LANKA_MOBILE_PATTERN,
} = require('./auth.constants');

/**
 * The three checks the strength meter draws, in the order it draws them.
 * @param {string} fieldName - Which body field holds the password.
 * @returns {Array} express-validator chains.
 */
function buildPasswordRules(fieldName) {
  return [
    body(fieldName)
      .isLength({ min: MIN_PASSWORD_LENGTH })
      .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      .bail()
      .matches(PASSWORD_UPPERCASE_PATTERN)
      .withMessage('Password must include a capital letter.')
      .bail()
      .matches(PASSWORD_SYMBOL_PATTERN)
      .withMessage('Password must include a symbol, for example @ or !.'),
  ];
}

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
  ...buildPasswordRules('password'),
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

const forgotPasswordValidationRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Enter your email address.')
    .bail()
    .isEmail()
    .withMessage('Please enter a valid email address (e.g. name@domain.com)')
    .normalizeEmail({ gmail_remove_dots: false }),
];

const resetPasswordValidationRules = [
  ...forgotPasswordValidationRules,
  body('otpCode')
    .trim()
    .isLength({ min: OTP_DIGIT_COUNT, max: OTP_DIGIT_COUNT })
    .withMessage(`Enter the ${OTP_DIGIT_COUNT}-digit code.`)
    .bail()
    .isNumeric()
    .withMessage('The code is six digits.'),
  ...buildPasswordRules('newPassword'),
];

module.exports = {
  buildPasswordRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
  loginValidationRules,
  registerValidationRules,
  verifyOtpValidationRules,
  resendOtpValidationRules,
};
