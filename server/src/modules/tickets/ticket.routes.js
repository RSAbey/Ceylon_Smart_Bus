// Stub router mounted at /api/tickets (passenger / driver) — Member 03 adds the endpoints here.
const express = require('express');

const ticketRouter = express.Router();

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - Scope: passenger creates, views, updates and cancels tickets (FR-05, FR-06); cancelling releases the seat.
 */

module.exports = ticketRouter;
