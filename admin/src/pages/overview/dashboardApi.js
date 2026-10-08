// API calls for the admin Overview, Performance and Delays pages (Member 04).
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
