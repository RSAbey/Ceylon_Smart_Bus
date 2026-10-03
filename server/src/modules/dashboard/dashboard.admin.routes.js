// Stub router mounted at /api/admin/dashboard (admin only) — Member 04 adds the endpoints here.
const express = require('express');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const { USER_ROLES } = require('../users/user.constants');

const dashboardAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
dashboardAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - GET /api/admin/dashboard/overview     admin  KPI cards
 * - GET /api/admin/dashboard/performance  admin  chart series
 */

module.exports = dashboardAdminRouter;
