// API calls for the admin dashboard, delays and announcements (Member 04).
import apiClient from '../../services/apiClient';

/**
 * The KPI figures for the Overview page.
 * @returns {Promise<object>} Counts and today's takings.
 */
export async function fetchOverview() {
  const overviewEnvelope = await apiClient.get('/admin/dashboard/overview');
  return overviewEnvelope.data;
}

/**
 * The series behind the Performance charts.
 * @returns {Promise<object>} Daily series, busiest routes and punctuality.
 */
export async function fetchPerformance() {
  const performanceEnvelope = await apiClient.get('/admin/dashboard/performance');
  return performanceEnvelope.data;
}

/**
 * The delay table.
 * @param {object} [tableFilters] - Optional status and reason filters.
 * @returns {Promise<object[]>} Reports with driver, bus and route.
 */
export async function fetchDelayReports(tableFilters = {}) {
  const delayEnvelope = await apiClient.get('/admin/delays', { params: tableFilters });
  return delayEnvelope.data.delayReports;
}

/**
 * Acknowledges, annotates or closes a delay report.
 * @param {string} delayReportId - Report to review.
 * @param {object} reviewDetails - adminNote and/or status.
 * @returns {Promise<object>} The reviewed report.
 */
export async function reviewDelayReport(delayReportId, reviewDetails) {
  const delayEnvelope = await apiClient.patch(`/admin/delays/${delayReportId}`, reviewDetails);
  return delayEnvelope.data;
}

/**
 * Every announcement, newest first.
 * @param {object} [listFilters] - Optional status and severity filters.
 * @returns {Promise<object[]>} Announcements with author and target route.
 */
export async function fetchAnnouncements(listFilters = {}) {
  const announcementEnvelope = await apiClient.get('/admin/announcements', { params: listFilters });
  return announcementEnvelope.data.announcements;
}

/**
 * Saves a new announcement as a draft.
 * @param {object} announcementDetails - title, message, severity, targetRouteId and expiresAt.
 * @returns {Promise<object>} The stored announcement.
 */
export async function createAnnouncement(announcementDetails) {
  const announcementEnvelope = await apiClient.post('/admin/announcements', announcementDetails);
  return announcementEnvelope.data;
}

/**
 * Edits a draft announcement.
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
 * Archives a published announcement.
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
 * Deletes a draft announcement.
 * @param {string} announcementId - Announcement to delete.
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function deleteAnnouncement(announcementId) {
  await apiClient.delete(`/admin/announcements/${announcementId}`);
}

/**
 * Active routes, for the announcement target picker.
 * @returns {Promise<object[]>} Routes with their number and endpoints.
 */
export async function fetchRoutesForPicker() {
  const routeEnvelope = await apiClient.get('/routes');
  return routeEnvelope.data.routes.map((routeResult) => routeResult.route);
}
