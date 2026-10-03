// Stub router mounted at /api/admin/routes (admin only) — Member 02 adds the endpoints here.
const express = require('express');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const { USER_ROLES } = require('../users/user.constants');

const routeAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
routeAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - Scope: admin creates/edits routes with ordered stops and fares (NFR-10).
 */

module.exports = routeAdminRouter;
