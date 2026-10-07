// express-validator rules for route management (Member 02).
const { body } = require('express-validator');
const { ROUTE_STATUSES, SERVICE_TIME_PATTERN } = require('./route.constants');

const MIN_STOPS_PER_ROUTE = 2;
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

/** A route is only useful with at least a start and an end, each with a position and a fare. */
const stopListValidationRules = [
  body('stops').isArray({ min: MIN_STOPS_PER_ROUTE }).withMessage('Add at least two stops.'),
  body('stops.*.stopName').trim().notEmpty().withMessage('Every stop needs a name.'),
  body('stops.*.latitude')
    .isFloat({ min: MIN_LATITUDE, max: MAX_LATITUDE })
    .withMessage('Every stop needs a valid latitude.'),
  body('stops.*.longitude')
    .isFloat({ min: MIN_LONGITUDE, max: MAX_LONGITUDE })
    .withMessage('Every stop needs a valid longitude.'),
  body('stops.*.fareFromOrigin')
    .isFloat({ min: 0 })
    .withMessage('Every stop needs a fare from the first stop.'),
];

const createRouteValidationRules = [
  body('routeNumber').trim().notEmpty().withMessage('Enter the route number, for example 154.'),
  body('routeName').trim().notEmpty().withMessage('Enter the route name.'),
  body('origin').trim().notEmpty().withMessage('Enter the starting point.'),
  body('destination').trim().notEmpty().withMessage('Enter the destination.'),
  body('baseFare').isFloat({ min: 0 }).withMessage('Enter the base fare in rupees.'),
  body('perKmRate')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Enter the per-kilometre rate in rupees.'),
  body('serviceStartTime')
    .optional({ values: 'falsy' })
    .matches(SERVICE_TIME_PATTERN)
    .withMessage('Enter the first departure as HH:MM, for example 05:00.'),
  body('serviceEndTime')
    .optional({ values: 'falsy' })
    .matches(SERVICE_TIME_PATTERN)
    .withMessage('Enter the last departure as HH:MM, for example 22:30.'),

  body('status')
    .optional()
    .isIn(Object.values(ROUTE_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(ROUTE_STATUSES).join(', ')}.`),
  ...stopListValidationRules,
];

const updateRouteValidationRules = [
  body('routeNumber').optional().trim().notEmpty().withMessage('Enter the route number.'),
  body('routeName').optional().trim().notEmpty().withMessage('Enter the route name.'),
  body('origin').optional().trim().notEmpty().withMessage('Enter the starting point.'),
  body('destination').optional().trim().notEmpty().withMessage('Enter the destination.'),
  body('baseFare').optional().isFloat({ min: 0 }).withMessage('Enter the base fare in rupees.'),
  body('perKmRate')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Enter the per-kilometre rate in rupees.'),
  body('serviceStartTime')
    .optional({ values: 'falsy' })
    .matches(SERVICE_TIME_PATTERN)
    .withMessage('Enter the first departure as HH:MM, for example 05:00.'),
  body('serviceEndTime')
    .optional({ values: 'falsy' })
    .matches(SERVICE_TIME_PATTERN)
    .withMessage('Enter the last departure as HH:MM, for example 22:30.'),

  body('status')
    .optional()
    .isIn(Object.values(ROUTE_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(ROUTE_STATUSES).join(', ')}.`),
  body('stops').optional().isArray({ min: MIN_STOPS_PER_ROUTE }).withMessage('Add at least two stops.'),
  body('stops.*.stopName').optional().trim().notEmpty().withMessage('Every stop needs a name.'),
  body('stops.*.latitude')
    .optional()
    .isFloat({ min: MIN_LATITUDE, max: MAX_LATITUDE })
    .withMessage('Every stop needs a valid latitude.'),
  body('stops.*.longitude')
    .optional()
    .isFloat({ min: MIN_LONGITUDE, max: MAX_LONGITUDE })
    .withMessage('Every stop needs a valid longitude.'),
  body('stops.*.fareFromOrigin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Every stop needs a fare from the first stop.'),
];

module.exports = { createRouteValidationRules, updateRouteValidationRules };
