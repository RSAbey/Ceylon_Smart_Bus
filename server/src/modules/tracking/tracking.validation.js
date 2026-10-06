// express-validator rules for live tracking (Member 02).
const { body, query } = require('express-validator');

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;
const MAX_REALISTIC_SPEED_KMH = 150;

const postLocationValidationRules = [
  body('tripId').isMongoId().withMessage('A running trip is required.'),
  body('latitude')
    .isFloat({ min: MIN_LATITUDE, max: MAX_LATITUDE })
    .withMessage('A valid latitude is required.'),
  body('longitude')
    .isFloat({ min: MIN_LONGITUDE, max: MAX_LONGITUDE })
    .withMessage('A valid longitude is required.'),
  body('speedKmh')
    .optional()
    .isFloat({ min: 0, max: MAX_REALISTIC_SPEED_KMH })
    .withMessage('Speed looks wrong.'),
];

const nearbyValidationRules = [
  query('lat').isFloat({ min: MIN_LATITUDE, max: MAX_LATITUDE }).withMessage('A valid latitude is required.'),
  query('lng')
    .isFloat({ min: MIN_LONGITUDE, max: MAX_LONGITUDE })
    .withMessage('A valid longitude is required.'),
  query('radiusKm').optional().isFloat({ min: 0 }).withMessage('Radius must be a positive number.'),
];

module.exports = { postLocationValidationRules, nearbyValidationRules };
