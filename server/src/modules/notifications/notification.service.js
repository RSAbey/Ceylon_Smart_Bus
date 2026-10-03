// Notification business logic. createNotification is a shared contract used by Members 02 and 03 (CLAUDE.md section 7).
const Notification = require('./notification.model');

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

module.exports = { createNotification };
