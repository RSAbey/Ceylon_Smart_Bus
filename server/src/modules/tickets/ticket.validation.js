// express-validator rules for ticket booking and editing (Member 03).
const { body, param, query } = require('express-validator');
const { TICKET_STATUSES } = require('./ticket.constants');

const createTicketValidationRules = [
  body('tripId').isMongoId().withMessage('Choose the bus you are travelling on.'),
  body('boardingStopId').isMongoId().withMessage('Choose where you will get on.'),
  body('alightingStopId').isMongoId().withMessage('Choose where you will get off.'),
  body('seatNumbers').isArray({ min: 1 }).withMessage('Choose at least one seat.'),
  body('seatNumbers.*').trim().notEmpty().withMessage('Choose seats from the seat map.'),
];

/** Every field is optional on an edit, but at least one must change for the request to mean anything. */
const updateTicketValidationRules = [
  param('ticketId').isMongoId().withMessage('Ticket not found.'),
  body('boardingStopId').optional().isMongoId().withMessage('Choose where you will get on.'),
  body('alightingStopId').optional().isMongoId().withMessage('Choose where you will get off.'),
  body('seatNumbers').optional().isArray({ min: 1 }).withMessage('Choose at least one seat.'),
  body('seatNumbers.*').optional().trim().notEmpty().withMessage('Choose seats from the seat map.'),
];

const ticketIdValidationRules = [param('ticketId').isMongoId().withMessage('Ticket not found.')];

const listTicketsValidationRules = [
  query('status')
    .optional()
    .isIn(Object.values(TICKET_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(TICKET_STATUSES).join(', ')}.`),
];

module.exports = {
  createTicketValidationRules,
  updateTicketValidationRules,
  ticketIdValidationRules,
  listTicketsValidationRules,
};
