// Stub router mounted at /api/home (passenger / driver) — Member 04 adds the endpoints here.
const express = require('express');

const homeRouter = express.Router();

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - GET /api/home/passenger?lat=&lng=   passenger  nearby buses, saved routes, recent activity
 * - GET /api/home/driver                 driver     assigned bus, active trip, next stop, verified count, active delay
 */

module.exports = homeRouter;
