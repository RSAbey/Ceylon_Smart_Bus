// Stub router mounted at /api/notifications (passenger / driver) — Member 04 adds the endpoints here.
const express = require('express');

const notificationRouter = express.Router();

/**
 * Planned endpoints (document each one in docs/api when it is built):
 * - GET    /api/notifications               passenger  list (filter type, isRead, paging)
 * - GET    /api/notifications/unread-count  passenger  unread badge
 * - PATCH  /api/notifications/:id/read      passenger  mark one as read
 * - PATCH  /api/notifications/read-all      passenger  mark all as read
 * - DELETE /api/notifications/:id           passenger  dismiss one
 * - DELETE /api/notifications               passenger  clear read notifications
 */

module.exports = notificationRouter;
