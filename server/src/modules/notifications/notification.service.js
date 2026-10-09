// Notification business logic (Member 04). createNotification is a shared contract used by
// Members 02 and 03 (CLAUDE.md section 7); everything else serves the passenger's Alerts screen.
const Notification = require('./notification.model');
const { NOTIFICATION_PAGE_SIZE } = require('./notification.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * Creates one notification per recipient in a single database round trip.
 * @param {object} notificationDetails - What to send and to whom.
 * @param {string[]} notificationDetails.recipientUserIds - Users who receive the notification (duplicates are ignored).
 * @param {string} notificationDetails.type - One of NOTIFICATION_TYPES.
 * @param {string} notificationDetails.title - Short title shown in bold.
 * @param {string} notificationDetails.message - Body text.
 * @param {object} [notificationDetails.related] - Optional links: { routeId, tripId, delayReportId, announcementId }.
 * @returns {Promise<number>} Number of notifications inserted.
 */
async function createNotification({ recipientUserIds, type, title, message, related = {} }) {
  // The same passenger can qualify twice (for example saved the route AND holds a ticket); notify them once.
  const uniqueRecipientUserIds = [...new Set(recipientUserIds.map(String))];
  if (uniqueRecipientUserIds.length === 0) return 0;

  const notificationDocuments = uniqueRecipientUserIds.map((recipientUserId) => ({
    userId: recipientUserId,
    type,
    title,
    message,
    routeId: related.routeId,
    tripId: related.tripId,
    delayReportId: related.delayReportId,
    announcementId: related.announcementId,
  }));

  const insertedNotifications = await Notification.insertMany(notificationDocuments);
  return insertedNotifications.length;
}

/**
 * The passenger's notification feed, newest first, optionally narrowed to one type or to unread only.
 * @param {string} userId - Signed-in user.
 * @param {object} [feedFilters] - Optional type, isRead and page.
 * @returns {Promise<{notifications: object[], unreadCount: number, hasMore: boolean}>} The feed.
 */
async function listNotifications(userId, feedFilters = {}) {
  const notificationFilter = { userId };
  if (feedFilters.type) notificationFilter.type = feedFilters.type;
  if (feedFilters.isRead !== undefined) notificationFilter.isRead = feedFilters.isRead === 'true';

  const pageNumber = Math.max(1, Number(feedFilters.page) || 1);
  const skipCount = (pageNumber - 1) * NOTIFICATION_PAGE_SIZE;

  const [notifications, matchingCount, unreadCount] = await Promise.all([
    Notification.find(notificationFilter)
      .sort({ createdAt: -1 })
      .skip(skipCount)
      // One extra row tells the screen whether another page exists without a second count query.
      .limit(NOTIFICATION_PAGE_SIZE + 1)
      .populate('routeId', 'routeNumber origin destination'),
    Notification.countDocuments(notificationFilter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  const hasMore = notifications.length > NOTIFICATION_PAGE_SIZE;
  return {
    notifications: hasMore ? notifications.slice(0, NOTIFICATION_PAGE_SIZE) : notifications,
    totalCount: matchingCount,
    unreadCount,
    hasMore,
  };
}

/**
 * How many unread notifications the user has, for the bell badge.
 * @param {string} userId - Signed-in user.
 * @returns {Promise<number>} Unread count.
 */
async function countUnread(userId) {
  return Notification.countDocuments({ userId, isRead: false });
}

/**
 * Loads one of the user's own notifications, refusing to touch anyone else's.
 * @param {string} userId - Signed-in user.
 * @param {string} notificationId - Notification to load.
 * @returns {Promise<object>} The notification document.
 */
async function getOwnNotification(userId, notificationId) {
  const matchingNotification = await Notification.findById(notificationId);
  if (!matchingNotification) {
    throw new AppError('Notification not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (String(matchingNotification.userId) !== String(userId)) {
    throw new AppError('You can only open your own notifications.', HTTP_STATUS.FORBIDDEN);
  }
  return matchingNotification;
}

/**
 * Marks one notification as read.
 * @param {string} userId - Signed-in user.
 * @param {string} notificationId - Notification to mark.
 * @returns {Promise<object>} The updated notification.
 */
async function markAsRead(userId, notificationId) {
  const matchingNotification = await getOwnNotification(userId, notificationId);
  matchingNotification.isRead = true;
  await matchingNotification.save();
  return matchingNotification;
}

/**
 * Marks every unread notification as read, for the "Mark all read" action.
 * @param {string} userId - Signed-in user.
 * @returns {Promise<number>} How many were marked.
 */
async function markAllAsRead(userId) {
  const updateOutcome = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
  return updateOutcome.modifiedCount;
}

/**
 * Dismisses one notification.
 * @param {string} userId - Signed-in user.
 * @param {string} notificationId - Notification to remove.
 * @returns {Promise<void>} Resolves once removed.
 */
async function dismissNotification(userId, notificationId) {
  await getOwnNotification(userId, notificationId);
  await Notification.findByIdAndDelete(notificationId);
}

/**
 * Clears the notifications the user has already read, leaving unread ones alone.
 * @param {string} userId - Signed-in user.
 * @returns {Promise<number>} How many were cleared.
 */
async function clearReadNotifications(userId) {
  const deleteOutcome = await Notification.deleteMany({ userId, isRead: true });
  return deleteOutcome.deletedCount;
}

module.exports = {
  createNotification,
  listNotifications,
  countUnread,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  clearReadNotifications,
};
