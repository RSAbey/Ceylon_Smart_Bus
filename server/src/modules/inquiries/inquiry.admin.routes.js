// Stub router mounted at /api/admin/inquiries (admin only) — Member 03 adds the endpoints here.
const express = require('express');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const { USER_ROLES } = require('../users/user.constants');

const inquiryAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
inquiryAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - Scope: admin inquiry inbox, reply (creates an inquiry_reply notification) and close.
 */

module.exports = inquiryAdminRouter;
