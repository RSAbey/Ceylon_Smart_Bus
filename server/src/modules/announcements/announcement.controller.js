// HTTP layer for announcements: reads the request, calls announcement.service, sends the envelope.
const announcementService = require('./announcement.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * GET /api/admin/announcements - every announcement, newest first.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listAnnouncements(request, response) {
  const announcementList = await announcementService.listAnnouncements(request.query);
  sendResponse(response, 'Announcements loaded.', announcementList);
}

/**
 * GET /api/admin/announcements/audience?targetRouteId= - how many passengers a message would reach.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getAudienceSize(request, response) {
  const audienceCount = await announcementService.countAudience(request.query.targetRouteId);
  sendResponse(response, 'Audience counted.', { audienceCount });
}

/**
 * POST /api/admin/announcements - write a new announcement as a draft.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function createAnnouncement(request, response) {
  const announcement = await announcementService.createAnnouncement(
    request.user.userId,
    request.body
  );
  sendResponse(response, 'Draft saved.', announcement, HTTP_STATUS.CREATED);
}

/**
 * PATCH /api/admin/announcements/:announcementId - edit a draft.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function updateAnnouncement(request, response) {
  const announcement = await announcementService.updateAnnouncement(
    request.params.announcementId,
    request.body
  );
  sendResponse(response, 'Announcement updated.', announcement);
}

/**
 * PATCH /api/admin/announcements/:announcementId/publish - send it to passengers.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function publishAnnouncement(request, response) {
  const { announcement, notifiedCount } = await announcementService.publishAnnouncement(
    request.params.announcementId
  );
  sendResponse(response, `Published to ${notifiedCount} passengers.`, {
    announcement,
    notifiedCount,
  });
}

/**
 * PATCH /api/admin/announcements/:announcementId/archive - retire a published announcement.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function archiveAnnouncement(request, response) {
  const announcement = await announcementService.archiveAnnouncement(
    request.params.announcementId
  );
  sendResponse(response, 'Announcement archived.', announcement);
}

/**
 * DELETE /api/admin/announcements/:announcementId - delete a draft.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function deleteAnnouncement(request, response) {
  await announcementService.deleteAnnouncement(request.params.announcementId);
  sendResponse(response, 'Draft deleted.');
}

module.exports = {
  listAnnouncements: asyncHandler(listAnnouncements),
  getAudienceSize: asyncHandler(getAudienceSize),
  createAnnouncement: asyncHandler(createAnnouncement),
  updateAnnouncement: asyncHandler(updateAnnouncement),
  publishAnnouncement: asyncHandler(publishAnnouncement),
  archiveAnnouncement: asyncHandler(archiveAnnouncement),
  deleteAnnouncement: asyncHandler(deleteAnnouncement),
};
