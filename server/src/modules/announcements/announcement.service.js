// Announcement business logic (Member 04): an admin writes a message, then publishes it, which is
// the moment every targeted passenger gets a notification.
const Announcement = require('./announcement.model');
const Notification = require('../notifications/notification.model');
const Route = require('../routes/route.model');
const User = require('../users/user.model');
const notificationService = require('../notifications/notification.service');
const savedRouteService = require('../savedRoutes/savedRoute.service');
const alertSubscriptionService = require('../alertSubscriptions/alertSubscription.service');
const { ANNOUNCEMENT_STATUSES } = require('./announcement.constants');
const { ALERT_TYPES } = require('../alertSubscriptions/alertSubscription.constants');
const { NOTIFICATION_TYPES } = require('../notifications/notification.constants');
const { USER_ROLES, USER_STATUSES } = require('../users/user.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * Who an announcement reaches. With no target route it goes to every active passenger; with one it
 * goes to the passengers who saved that route or subscribed to its alerts.
 * @param {object} announcement - The announcement being published.
 * @returns {Promise<string[]>} Distinct user ids as strings.
 */
async function findAudience(announcement) {
  if (!announcement.targetRouteId) {
    const activePassengers = await User.find({
      role: USER_ROLES.PASSENGER,
      status: USER_STATUSES.ACTIVE,
    }).select('_id');
    return activePassengers.map((activePassenger) => String(activePassenger.id));
  }

  const [savedRouteUserIds, subscriberUserIds] = await Promise.all([
    savedRouteService.getUserIdsBySavedRoute(announcement.targetRouteId),
    alertSubscriptionService.getSubscriberUserIds(announcement.targetRouteId, ALERT_TYPES.DELAY),
  ]);
  return [...savedRouteUserIds, ...subscriberUserIds];
}

/**
 * How many passengers an announcement would reach if it were published now. The composer shows this
 * before anything is sent, so "all passengers" is a number rather than a guess.
 * @param {string | null} targetRouteId - Route to target, or null for every active passenger.
 * @returns {Promise<number>} How many distinct passengers would be notified.
 */
async function countAudience(targetRouteId) {
  const recipientUserIds = await findAudience({ targetRouteId: targetRouteId || null });
  return new Set(recipientUserIds.map(String)).size;
}

/**
 * How many alerts a published announcement actually produced, and how many have been read. Counted
 * from the NOTIFICATION rows it created, so the figure is what passengers really received.
 * @param {string[]} announcementIds - Announcements being listed.
 * @returns {Promise<Map<string, {deliveredCount: number, readCount: number}>>} Figures by id.
 */
async function loadDeliveryFigures(announcementIds) {
  const deliveryRows = await Notification.aggregate([
    { $match: { announcementId: { $in: announcementIds } } },
    {
      $group: {
        _id: '$announcementId',
        deliveredCount: { $sum: 1 },
        readCount: { $sum: { $cond: ['$isRead', 1, 0] } },
      },
    },
  ]);
  return new Map(deliveryRows.map((deliveryRow) => [String(deliveryRow._id), deliveryRow]));
}

/**
 * Every announcement for the admin list, newest first, with what each one delivered.
 * @param {object} [listFilters] - Optional status and severity filters.
 * @returns {Promise<object>} Announcements with their delivery figures and the counts above them.
 */
async function listAnnouncements(listFilters = {}) {
  const announcementFilter = {};
  ['status', 'severity'].forEach((filterName) => {
    if (listFilters[filterName]) announcementFilter[filterName] = listFilters[filterName];
  });

  const announcements = await Announcement.find(announcementFilter)
    .sort({ createdAt: -1 })
    .populate('adminId', 'fullName')
    .populate('targetRouteId', 'routeNumber origin destination');

  const deliveryFigures = await loadDeliveryFigures(
    announcements.map((announcement) => announcement._id)
  );

  const [draftCount, publishedCount, archivedCount, deliveredTotal, readTotal] = await Promise.all([
    Announcement.countDocuments({ status: ANNOUNCEMENT_STATUSES.DRAFT }),
    Announcement.countDocuments({ status: ANNOUNCEMENT_STATUSES.PUBLISHED }),
    Announcement.countDocuments({ status: ANNOUNCEMENT_STATUSES.ARCHIVED }),
    Notification.countDocuments({ type: NOTIFICATION_TYPES.ANNOUNCEMENT }),
    Notification.countDocuments({ type: NOTIFICATION_TYPES.ANNOUNCEMENT, isRead: true }),
  ]);

  return {
    announcements: announcements.map((announcement) => {
      const delivery = deliveryFigures.get(announcement.id);
      return {
        announcement,
        deliveredCount: delivery?.deliveredCount || 0,
        readCount: delivery?.readCount || 0,
      };
    }),
    statusCounts: {
      draft: draftCount,
      published: publishedCount,
      archived: archivedCount,
      total: draftCount + publishedCount + archivedCount,
    },
    deliveredTotal,
    readTotal,
  };
}

/**
 * Writes a new announcement. It starts as a draft, so nothing reaches passengers until it is published.
 * @param {string} adminUserId - Signed-in admin.
 * @param {object} announcementDetails - title, message, severity, targetRouteId and expiresAt.
 * @returns {Promise<object>} The stored announcement.
 */
async function createAnnouncement(adminUserId, announcementDetails) {
  if (announcementDetails.targetRouteId) {
    const targetRoute = await Route.findById(announcementDetails.targetRouteId);
    if (!targetRoute) {
      throw new AppError('Route not found.', HTTP_STATUS.NOT_FOUND, [
        { field: 'targetRouteId', message: 'Choose a route from the list.' },
      ]);
    }
  }

  return Announcement.create({
    adminId: adminUserId,
    title: announcementDetails.title.trim(),
    message: announcementDetails.message.trim(),
    severity: announcementDetails.severity,
    targetRouteId: announcementDetails.targetRouteId || null,
    expiresAt: announcementDetails.expiresAt,
  });
}

/**
 * Loads an announcement or fails clearly.
 * @param {string} announcementId - Announcement to load.
 * @returns {Promise<object>} The announcement document.
 */
async function getAnnouncement(announcementId) {
  const matchingAnnouncement = await Announcement.findById(announcementId);
  if (!matchingAnnouncement) {
    throw new AppError('Announcement not found.', HTTP_STATUS.NOT_FOUND);
  }
  return matchingAnnouncement;
}

/**
 * Edits an announcement. A published one is frozen, because its notifications have already gone out
 * and editing the text would make them disagree with what passengers were told.
 * @param {string} announcementId - Announcement to change.
 * @param {object} announcementChanges - Any of title, message, severity, targetRouteId, expiresAt.
 * @returns {Promise<object>} The updated announcement.
 */
async function updateAnnouncement(announcementId, announcementChanges) {
  const editableAnnouncement = await getAnnouncement(announcementId);
  if (editableAnnouncement.status === ANNOUNCEMENT_STATUSES.PUBLISHED) {
    throw new AppError(
      'This announcement has already been sent to passengers and can no longer be edited.',
      HTTP_STATUS.CONFLICT
    );
  }

  ['title', 'message'].forEach((fieldName) => {
    if (announcementChanges[fieldName] !== undefined) {
      editableAnnouncement[fieldName] = announcementChanges[fieldName].trim();
    }
  });
  if (announcementChanges.severity !== undefined) {
    editableAnnouncement.severity = announcementChanges.severity;
  }
  if (announcementChanges.targetRouteId !== undefined) {
    editableAnnouncement.targetRouteId = announcementChanges.targetRouteId || null;
  }
  if (announcementChanges.expiresAt !== undefined) {
    editableAnnouncement.expiresAt = announcementChanges.expiresAt;
  }
  await editableAnnouncement.save();
  return editableAnnouncement;
}

/**
 * Publishes an announcement: this is the step that creates one notification per recipient.
 * @param {string} announcementId - Announcement to publish.
 * @returns {Promise<{announcement: object, notifiedCount: number}>} The result.
 */
async function publishAnnouncement(announcementId) {
  const publishableAnnouncement = await getAnnouncement(announcementId);
  if (publishableAnnouncement.status === ANNOUNCEMENT_STATUSES.PUBLISHED) {
    throw new AppError('This announcement is already published.', HTTP_STATUS.CONFLICT);
  }

  publishableAnnouncement.status = ANNOUNCEMENT_STATUSES.PUBLISHED;
  publishableAnnouncement.publishedAt = new Date();
  await publishableAnnouncement.save();

  const recipientUserIds = await findAudience(publishableAnnouncement);
  const notifiedCount = await notificationService.createNotification({
    recipientUserIds,
    type: NOTIFICATION_TYPES.ANNOUNCEMENT,
    title: publishableAnnouncement.title,
    message: publishableAnnouncement.message,
    related: {
      announcementId: publishableAnnouncement.id,
      routeId: publishableAnnouncement.targetRouteId || undefined,
    },
  });

  return { announcement: publishableAnnouncement, notifiedCount };
}

/**
 * Archives an announcement so it drops off the active list. Notifications already sent are left
 * alone, because a passenger's own feed is theirs.
 * @param {string} announcementId - Announcement to archive.
 * @returns {Promise<object>} The archived announcement.
 */
async function archiveAnnouncement(announcementId) {
  const archivableAnnouncement = await getAnnouncement(announcementId);
  archivableAnnouncement.status = ANNOUNCEMENT_STATUSES.ARCHIVED;
  await archivableAnnouncement.save();
  return archivableAnnouncement;
}

/**
 * Deletes a draft. A published announcement is archived instead, never deleted, so the record of
 * what was broadcast survives.
 * @param {string} announcementId - Announcement to delete.
 * @returns {Promise<void>} Resolves once handled.
 */
async function deleteAnnouncement(announcementId) {
  const deletableAnnouncement = await getAnnouncement(announcementId);
  if (deletableAnnouncement.status === ANNOUNCEMENT_STATUSES.PUBLISHED) {
    throw new AppError(
      'A published announcement cannot be deleted. Archive it instead.',
      HTTP_STATUS.CONFLICT
    );
  }
  await Announcement.findByIdAndDelete(announcementId);
}

module.exports = {
  listAnnouncements,
  countAudience,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
};
