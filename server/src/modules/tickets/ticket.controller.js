// HTTP layer for tickets: reads the request, calls ticket.service, sends the envelope.
const ticketService = require('./ticket.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * GET /api/tickets - the signed-in passenger's tickets, optionally filtered by ?status=.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listMyTickets(request, response) {
  const tickets = await ticketService.listMyTickets(request.user.userId, request.query.status);
  sendResponse(response, 'Tickets loaded.', { tickets });
}

/**
 * GET /api/tickets/available-buses - the buses a passenger can buy a ticket on right now.
 * @param {import('express').Request} _request - Unused.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listBookableTrips(_request, response) {
  const bookableTrips = await ticketService.listBookableTrips();
  sendResponse(response, 'Buses loaded.', { bookableTrips });
}

/**
 * GET /api/tickets/:ticketId - one ticket with its stops, seat and payment.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getTicketDetails(request, response) {
  const ticketView = await ticketService.getTicketDetails(
    request.user.userId,
    request.params.ticketId
  );
  sendResponse(response, 'Ticket loaded.', ticketView);
}

/**
 * POST /api/tickets - buy a ticket for a running bus.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function createTicket(request, response) {
  const ticketView = await ticketService.createTicket(request.user.userId, request.body);
  sendResponse(response, 'Ticket booked. Pay to activate it.', ticketView, HTTP_STATUS.CREATED);
}

/**
 * PUT /api/tickets/:ticketId - change the stops or the seat on an active ticket.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function updateTicket(request, response) {
  const ticketView = await ticketService.updateTicket(
    request.user.userId,
    request.params.ticketId,
    request.body
  );
  sendResponse(response, 'Ticket updated.', ticketView);
}

/**
 * DELETE /api/tickets/:ticketId - cancel a ticket, releasing its seat and refunding the fare.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function cancelTicket(request, response) {
  const ticketView = await ticketService.cancelTicket(request.user.userId, request.params.ticketId);
  sendResponse(response, 'Ticket cancelled.', ticketView);
}

module.exports = {
  listMyTickets: asyncHandler(listMyTickets),
  listBookableTrips: asyncHandler(listBookableTrips),
  getTicketDetails: asyncHandler(getTicketDetails),
  createTicket: asyncHandler(createTicket),
  updateTicket: asyncHandler(updateTicket),
  cancelTicket: asyncHandler(cancelTicket),
};
