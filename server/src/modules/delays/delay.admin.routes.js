// Stub router mounted at /api/admin/delays (admin only) — Member 04 adds the endpoints here.
const express = require('express');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const { USER_ROLES } = require('../users/user.constants');

const delayAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
delayAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - GET   /api/admin/delays      admin  delay table
 * - PATCH /api/admin/delays/:id  admin  acknowledge / admin note / resolve
 */

module.exports = delayAdminRouter;
