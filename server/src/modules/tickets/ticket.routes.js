// Ticket endpoints mounted at /api/tickets (Member 03). Signed-in passengers manage their own tickets.
const express = require('express');
const ticketController = require('./ticket.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const validateRequest = require('../../middleware/validateRequest');
const {
  createTicketValidationRules,
  updateTicketValidationRules,
  ticketIdValidationRules,
  listTicketsValidationRules,
} = require('./ticket.validation');

const ticketRouter = express.Router();

ticketRouter.use(authenticateToken);

ticketRouter.get('/', listTicketsValidationRules, validateRequest, ticketController.listMyTickets);
ticketRouter.post('/', createTicketValidationRules, validateRequest, ticketController.createTicket);
ticketRouter.get(
  '/:ticketId',
  ticketIdValidationRules,
  validateRequest,
  ticketController.getTicketDetails
);
ticketRouter.put(
  '/:ticketId',
  updateTicketValidationRules,
  validateRequest,
  ticketController.updateTicket
);
ticketRouter.delete(
  '/:ticketId',
  ticketIdValidationRules,
  validateRequest,
  ticketController.cancelTicket
);

module.exports = ticketRouter;
