// Stub router mounted at /api/admin/announcements (admin only) — Member 04 adds the endpoints here.
const express = require('express');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const { USER_ROLES } = require('../users/user.constants');

const announcementAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
announcementAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - POST / GET / PATCH /:id / DELETE /:id  admin  announcement CRUD
 * - PATCH /:id/publish                       admin  publish (one Notification per recipient)
 */

module.exports = announcementAdminRouter;
