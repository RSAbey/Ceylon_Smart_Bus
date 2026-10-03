// express-validator rules for the auth endpoints (server-side input validation).
const { body } = require('express-validator');

const loginValidationRules = [
  body('identifier').trim().notEmpty().withMessage('Enter your email or mobile number.'),
  body('password').notEmpty().withMessage('Enter your password.'),
];

module.exports = { loginValidationRules };
