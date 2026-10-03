// Stub router mounted at /api/tracking (passenger / driver) — Member 02 adds the endpoints here.
const express = require('express');

const trackingRouter = express.Router();

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - Scope: driver posts GPS every 5 s; passenger polls latest bus position + ETA (FR-02, FR-03, NFR-01).
 * - ETA must add delayService.getActiveDelayMinutes(tripId) to stops ahead of the bus (FR-08).
 */

module.exports = trackingRouter;
