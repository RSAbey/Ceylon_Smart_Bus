// Stub router mounted at /api/inquiries (passenger / driver) — Member 03 adds the endpoints here.
const express = require('express');

const inquiryRouter = express.Router();

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - Scope: passenger/driver create, view, update and delete inquiries; edit/delete only within 5 minutes (server-side).
 */

module.exports = inquiryRouter;
