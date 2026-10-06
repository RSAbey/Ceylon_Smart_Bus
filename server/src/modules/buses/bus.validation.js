// express-validator rules for admin bus management (Member 02).
const { body } = require('express-validator');
const { BUS_STATUSES } = require('./bus.constants');

const MIN_BUS_CAPACITY = 1;
const MAX_BUS_CAPACITY = 100;

/** Sri Lankan plates such as NB-1234 or ND-4321; letters then digits, hyphen optional. */
const PLATE_NUMBER_PATTERN = /^[A-Za-z]{2,3}-?\d{4}$/;

const registerBusValidationRules = [
  body('plateNumber')
    .trim()
    .matches(PLATE_NUMBER_PATTERN)
    .withMessage('Enter a plate number such as NB-1234.'),
  body('busName').trim().notEmpty().withMessage('Enter a name for the bus.'),
  body('capacity')
    .isInt({ min: MIN_BUS_CAPACITY, max: MAX_BUS_CAPACITY })
    .withMessage(`Capacity must be between ${MIN_BUS_CAPACITY} and ${MAX_BUS_CAPACITY} seats.`),
  body('status')
    .optional()
    .isIn(Object.values(BUS_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(BUS_STATUSES).join(', ')}.`),
  body('driverId').optional({ nullable: true }).isMongoId().withMessage('Choose a registered driver.'),
  body('routeId').optional({ nullable: true }).isMongoId().withMessage('Choose an existing route.'),
];

const updateBusValidationRules = [
  body('plateNumber')
    .optional()
    .trim()
    .matches(PLATE_NUMBER_PATTERN)
    .withMessage('Enter a plate number such as NB-1234.'),
  body('busName').optional().trim().notEmpty().withMessage('Enter a name for the bus.'),
  body('capacity')
    .optional()
    .isInt({ min: MIN_BUS_CAPACITY, max: MAX_BUS_CAPACITY })
    .withMessage(`Capacity must be between ${MIN_BUS_CAPACITY} and ${MAX_BUS_CAPACITY} seats.`),
  body('status')
    .optional()
    .isIn(Object.values(BUS_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(BUS_STATUSES).join(', ')}.`),
  body('driverId').optional({ nullable: true }).isMongoId().withMessage('Choose a registered driver.'),
  body('routeId').optional({ nullable: true }).isMongoId().withMessage('Choose an existing route.'),
];

module.exports = { registerBusValidationRules, updateBusValidationRules };
