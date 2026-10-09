// API calls for the Notifications page (Member 04). The rows are ANNOUNCEMENT records; publishing
// one is what creates the NOTIFICATION rows passengers actually see in the app.
import apiClient from '../../services/apiClient';

/**
 * Every announcement with what it delivered, and the counts above the table.
 * @param {object} [listFilters] - List filters.
 * @param {string} [listFilters.status] - One ANNOUNCEMENT_STATUSES value.
 * @param {string} [listFilters.severity] - One ANNOUNCEMENT_SEVERITIES value.
 * @returns {Promise<object>} Announcements, status counts and the delivery totals.
 */
export async function fetchAnnouncements({ status, severity } = {}) {
  const announcementEnvelope = await apiClient.get('/admin/announcements', {
    params: { status: status || undefined, severity: severity || undefined },
  });
  return announcementEnvelope.data;
}

/**
 * How many passengers a message would reach if it were published now.
 * @param {string} [targetRouteId] - Route to target; left out it counts every active passenger.
 * @returns {Promise<number>} How many distinct passengers would be notified.
 */
export async function fetchAudienceSize(targetRouteId) {
  const audienceEnvelope = await apiClient.get('/admin/announcements/audience', {
    params: { targetRouteId: targetRouteId || undefined },
  });
  return audienceEnvelope.data.audienceCount;
}

/**
 * Saves a new announcement as a draft. Nothing reaches passengers until it is published.
 * @param {object} announcementDetails - title, message, severity, targetRouteId and expiresAt.
 * @returns {Promise<object>} The stored announcement.
 */
export async function createAnnouncement(announcementDetails) {
  const announcementEnvelope = await apiClient.post('/admin/announcements', announcementDetails);
  return announcementEnvelope.data;
}

/**
 * Edits a draft.
 * @param {string} announcementId - Announcement to change.
 * @param {object} announcementChanges - Fields to change.
 * @returns {Promise<object>} The updated announcement.
 */
export async function updateAnnouncement(announcementId, announcementChanges) {
  const announcementEnvelope = await apiClient.patch(
    `/admin/announcements/${announcementId}`,
    announcementChanges
  );
  return announcementEnvelope.data;
}

/**
 * Publishes an announcement, which is the moment passengers are notified.
 * @param {string} announcementId - Announcement to publish.
 * @returns {Promise<{announcement: object, notifiedCount: number}>} The result.
 */
export async function publishAnnouncement(announcementId) {
  const announcementEnvelope = await apiClient.patch(
    `/admin/announcements/${announcementId}/publish`
  );
  return announcementEnvelope.data;
}

/**
 * Archives an announcement so it drops off the active list. Alerts already sent are left alone.
 * @param {string} announcementId - Announcement to archive.
 * @returns {Promise<object>} The archived announcement.
 */
export async function archiveAnnouncement(announcementId) {
  const announcementEnvelope = await apiClient.patch(
    `/admin/announcements/${announcementId}/archive`
  );
  return announcementEnvelope.data;
}

/**
 * Deletes a draft. A published announcement is archived instead, never deleted.
 * @param {string} announcementId - Announcement to delete.
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function deleteAnnouncement(announcementId) {
  await apiClient.delete(`/admin/announcements/${announcementId}`);
}

/**
 * Active routes, for the target picker.
 * @returns {Promise<object[]>} Routes with their number and endpoints.
 */
export async function fetchRoutesForPicker() {
  const routeEnvelope = await apiClient.get('/routes');
  return routeEnvelope.data.routes.map((routeResult) => routeResult.route);
}
