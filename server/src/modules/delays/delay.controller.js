// HTTP layer for delay reports: reads the request, calls delay.service, sends the envelope.
const delayService = require('./delay.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * POST /api/delays - report a delay on the trip the driver is running.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function reportDelay(request, response) {
  const { delayReport, notifiedCount } = await delayService.reportDelay(
    request.user.userId,
    request.body
  );
  sendResponse(
    response,
    `Delay reported. ${notifiedCount} passengers were told.`,
    { delayReport, notifiedCount },
    HTTP_STATUS.CREATED
  );
}

/**
 * GET /api/delays/active - the delay on the driver's running trip, for the dashboard banner.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getActiveDelay(request, response) {
  const delayReport = await delayService.getActiveDelayForDriver(request.user.userId);
  sendResponse(response, 'Active delay loaded.', { delayReport });
}

/**
 * GET /api/delays/mine - the driver's delay history.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listMyDelayReports(request, response) {
  const delayReports = await delayService.listMyDelayReports(
    request.user.userId,
    request.query.status
  );
  sendResponse(response, 'Delay history loaded.', { delayReports });
}

/**
 * PATCH /api/delays/:delayReportId - change the minutes or the reason on an active report.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function updateDelayReport(request, response) {
  const { delayReport, notifiedCount } = await delayService.updateDelayReport(
    request.user.userId,
    request.params.delayReportId,
    request.body
  );
  sendResponse(response, 'Delay updated. Passengers were told again.', {
    delayReport,
    notifiedCount,
  });
}

/**
 * PATCH /api/delays/:delayReportId/resolve - mark the hold-up over.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function resolveDelayReport(request, response) {
  const delayReport = await delayService.resolveDelayReport(
    request.user.userId,
    request.params.delayReportId
  );
  sendResponse(response, 'Marked as back on time.', delayReport);
}

/**
 * DELETE /api/delays/:delayReportId - withdraw a report filed by mistake.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function cancelDelayReport(request, response) {
  const delayReport = await delayService.cancelDelayReport(
    request.user.userId,
    request.params.delayReportId
  );
  sendResponse(response, 'Delay report withdrawn.', delayReport);
}

/**
 * GET /api/admin/delays - the admin delay table.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listAllDelayReports(request, response) {
  const delayReports = await delayService.listAllDelayReports(request.query);
  sendResponse(response, 'Delay reports loaded.', { delayReports });
}

/**
 * PATCH /api/admin/delays/:delayReportId - acknowledge, annotate or close a report.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function reviewDelayReport(request, response) {
  const delayReport = await delayService.reviewDelayReport(
    request.user.userId,
    request.params.delayReportId,
    request.body
  );
  sendResponse(response, 'Delay report updated.', delayReport);
}

module.exports = {
  reportDelay: asyncHandler(reportDelay),
  getActiveDelay: asyncHandler(getActiveDelay),
  listMyDelayReports: asyncHandler(listMyDelayReports),
  updateDelayReport: asyncHandler(updateDelayReport),
  resolveDelayReport: asyncHandler(resolveDelayReport),
  cancelDelayReport: asyncHandler(cancelDelayReport),
  listAllDelayReports: asyncHandler(listAllDelayReports),
  reviewDelayReport: asyncHandler(reviewDelayReport),
};
