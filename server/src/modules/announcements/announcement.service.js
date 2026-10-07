// Announcement business logic (Member 04): an admin writes a message, then publishes it, which is
// the moment every targeted passenger gets a notification.
const Announcement = require('./announcement.model');
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
 * Every announcement for the admin list, newest first.
 * @param {object} [listFilters] - Optional status and severity filters.
 * @returns {Promise<object[]>} Announcements with their author and target route.
 */
async function listAnnouncements(listFilters = {}) {
  const announcementFilter = {};
  ['status', 'severity'].forEach((filterName) => {
    if (listFilters[filterName]) announcementFilter[filterName] = listFilters[filterName];
  });

  return Announcement.find(announcementFilter)
    .sort({ createdAt: -1 })
    .populate('adminId', 'fullName')
    .populate('targetRouteId', 'routeNumber origin destination');
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
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
};
