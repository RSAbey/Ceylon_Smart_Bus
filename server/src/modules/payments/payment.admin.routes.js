// Stub router mounted at /api/admin/finance (admin only) — Member 03 adds the endpoints here.
const express = require('express');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const { USER_ROLES } = require('../users/user.constants');

const paymentAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
paymentAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - Scope: finance monitor / transaction report for the admin dashboard (FR-10).
 */

module.exports = paymentAdminRouter;
