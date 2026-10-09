// HTTP layer for notifications: reads the request, calls notification.service, sends the envelope.
const notificationService = require('./notification.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');

/**
 * GET /api/notifications - the caller's feed, filtered by ?type= and ?isRead=, paged by ?page=.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listNotifications(request, response) {
  const feed = await notificationService.listNotifications(request.user.userId, request.query);
  sendResponse(response, 'Alerts loaded.', feed);
}

/**
 * GET /api/notifications/unread-count - the number for the bell badge.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getUnreadCount(request, response) {
  const unreadCount = await notificationService.countUnread(request.user.userId);
  sendResponse(response, 'Unread count loaded.', { unreadCount });
}

/**
 * PATCH /api/notifications/:notificationId/read - mark one alert as read.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function markAsRead(request, response) {
  const notification = await notificationService.markAsRead(
    request.user.userId,
    request.params.notificationId
  );
  sendResponse(response, 'Alert marked as read.', notification);
}

/**
 * PATCH /api/notifications/read-all - mark every unread alert as read.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function markAllAsRead(request, response) {
  const markedCount = await notificationService.markAllAsRead(request.user.userId);
  sendResponse(response, 'All alerts marked as read.', { markedCount });
}

/**
 * DELETE /api/notifications/:notificationId - dismiss one alert.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function dismissNotification(request, response) {
  await notificationService.dismissNotification(request.user.userId, request.params.notificationId);
  sendResponse(response, 'Alert dismissed.');
}

/**
 * DELETE /api/notifications - clear the alerts already read.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function clearReadNotifications(request, response) {
  const clearedCount = await notificationService.clearReadNotifications(request.user.userId);
  sendResponse(response, 'Read alerts cleared.', { clearedCount });
}

module.exports = {
  listNotifications: asyncHandler(listNotifications),
  getUnreadCount: asyncHandler(getUnreadCount),
  markAsRead: asyncHandler(markAsRead),
  markAllAsRead: asyncHandler(markAllAsRead),
  dismissNotification: asyncHandler(dismissNotification),
  clearReadNotifications: asyncHandler(clearReadNotifications),
};
