// API calls for driver delay reports (Member 04). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/**
 * Reports a delay on the trip the driver is running.
 * @param {object} delayDetails - reason, delayMinutes and reasonNote when the reason is "other".
 * @returns {Promise<{delayReport: object, notifiedCount: number}>} The report and how many were told.
 */
export async function reportDelay(delayDetails) {
  const delayEnvelope = await apiClient.post('/delays', delayDetails);
  return delayEnvelope.data;
}

/**
 * The delay on the driver's running trip, for the dashboard banner.
 * @returns {Promise<object | null>} The active report, or null when the bus is on time.
 */
export async function fetchActiveDelay() {
  const delayEnvelope = await apiClient.get('/delays/active');
  return delayEnvelope.data.delayReport;
}

/**
 * The driver's delay history.
 * @param {string} [status] - Optional DELAY_REPORT_STATUSES value to filter by.
 * @returns {Promise<object[]>} Reports with the route they were on.
 */
export async function fetchMyDelayReports(status) {
  const delayEnvelope = await apiClient.get('/delays/mine', { params: status ? { status } : {} });
  return delayEnvelope.data.delayReports;
}

/**
 * Changes the minutes or the reason on an active report.
 * @param {string} delayReportId - Report to change.
 * @param {object} delayChanges - reason, reasonNote and/or delayMinutes.
 * @returns {Promise<{delayReport: object, notifiedCount: number}>} The updated report.
 */
export async function updateDelayReport(delayReportId, delayChanges) {
  const delayEnvelope = await apiClient.patch(`/delays/${delayReportId}`, delayChanges);
  return delayEnvelope.data;
}

/**
 * Marks a delay over ("back on time").
 * @param {string} delayReportId - Report to resolve.
 * @returns {Promise<object>} The resolved report.
 */
export async function resolveDelayReport(delayReportId) {
  const delayEnvelope = await apiClient.patch(`/delays/${delayReportId}/resolve`);
  return delayEnvelope.data;
}

/**
 * Withdraws a report filed by mistake.
 * @param {string} delayReportId - Report to cancel.
 * @returns {Promise<object>} The cancelled report.
 */
export async function cancelDelayReport(delayReportId) {
  const delayEnvelope = await apiClient.delete(`/delays/${delayReportId}`);
  return delayEnvelope.data;
}
