// Stub router mounted at /api/delays (passenger / driver) — Member 04 adds the endpoints here.
const express = require('express');

const delayRouter = express.Router();

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - POST   /api/delays              driver  create delay report on the ongoing trip
 * - GET    /api/delays/mine         driver  history
 * - GET    /api/delays/active       driver  active delay banner
 * - PATCH  /api/delays/:id          driver  update minutes / reason
 * - PATCH  /api/delays/:id/resolve  driver  resolve ("back on time")
 * - DELETE /api/delays/:id          driver  cancel (soft delete -> cancelled)
 */

module.exports = delayRouter;
