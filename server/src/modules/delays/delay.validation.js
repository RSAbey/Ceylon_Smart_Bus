// express-validator rules for delay reports (Member 04).
const { body, param, query } = require('express-validator');
const {
  DELAY_REASONS,
  DELAY_REPORT_STATUSES,
  MIN_DELAY_MINUTES,
  MAX_DELAY_MINUTES,
} = require('./delay.constants');

const MAX_NOTE_LENGTH = 300;

const delayMinutesMessage = `Enter a delay between ${MIN_DELAY_MINUTES} and ${MAX_DELAY_MINUTES} minutes.`;
const reasonMessage = `Choose one of: ${Object.values(DELAY_REASONS).join(', ')}.`;

const reportDelayValidationRules = [
  body('reason').isIn(Object.values(DELAY_REASONS)).withMessage(reasonMessage),
  body('delayMinutes')
    .isInt({ min: MIN_DELAY_MINUTES, max: MAX_DELAY_MINUTES })
    .withMessage(delayMinutesMessage),
  // "Other" is meaningless on its own, so the note becomes required (PROJECT_PLAN.md 3.3).
  body('reasonNote')
    .if((_fieldValue, { req: currentRequest }) => currentRequest.body.reason === DELAY_REASONS.OTHER)
    .trim()
    .notEmpty()
    .withMessage('Describe what is holding the bus up.')
    .isLength({ max: MAX_NOTE_LENGTH })
    .withMessage(`Keep the note under ${MAX_NOTE_LENGTH} characters.`),
];

const updateDelayValidationRules = [
  param('delayReportId').isMongoId().withMessage('Delay report not found.'),
  body('reason').optional().isIn(Object.values(DELAY_REASONS)).withMessage(reasonMessage),
  body('delayMinutes')
    .optional()
    .isInt({ min: MIN_DELAY_MINUTES, max: MAX_DELAY_MINUTES })
    .withMessage(delayMinutesMessage),
  body('reasonNote')
    .optional()
    .trim()
    .isLength({ max: MAX_NOTE_LENGTH })
    .withMessage(`Keep the note under ${MAX_NOTE_LENGTH} characters.`),
];

const delayReportIdValidationRules = [
  param('delayReportId').isMongoId().withMessage('Delay report not found.'),
];

const delayFilterValidationRules = [
  query('status')
    .optional()
    .isIn(Object.values(DELAY_REPORT_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(DELAY_REPORT_STATUSES).join(', ')}.`),
  query('reason').optional().isIn(Object.values(DELAY_REASONS)).withMessage(reasonMessage),
];

const reviewDelayValidationRules = [
  param('delayReportId').isMongoId().withMessage('Delay report not found.'),
  body('adminNote')
    .optional()
    .trim()
    .isLength({ max: MAX_NOTE_LENGTH })
    .withMessage(`Keep the note under ${MAX_NOTE_LENGTH} characters.`),
  body('status')
    .optional()
    .isIn(Object.values(DELAY_REPORT_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(DELAY_REPORT_STATUSES).join(', ')}.`),
];

module.exports = {
  reportDelayValidationRules,
  updateDelayValidationRules,
  delayReportIdValidationRules,
  delayFilterValidationRules,
  reviewDelayValidationRules,
};
