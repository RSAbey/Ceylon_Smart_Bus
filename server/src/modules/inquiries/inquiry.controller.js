// HTTP layer for inquiries: reads the request, calls inquiry.service, sends the envelope.
const inquiryService = require('./inquiry.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * GET /api/inquiries - the author's own inquiries, optionally filtered by ?status=.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listMyInquiries(request, response) {
  const inquiries = await inquiryService.listMyInquiries(request.user.userId, request.query.status);
  sendResponse(response, 'Inquiries loaded.', { inquiries });
}

/**
 * GET /api/inquiries/:inquiryId - one inquiry with the admin replies.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getInquiryDetails(request, response) {
  const inquiryView = await inquiryService.getInquiryDetails(
    request.user.userId,
    request.params.inquiryId
  );
  sendResponse(response, 'Inquiry loaded.', inquiryView);
}

/**
 * POST /api/inquiries - raise a new inquiry.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function createInquiry(request, response) {
  const inquiry = await inquiryService.createInquiry(request.user.userId, request.body);
  sendResponse(response, 'Inquiry sent. We will reply soon.', inquiry, HTTP_STATUS.CREATED);
}

/**
 * PUT /api/inquiries/:inquiryId - correct an inquiry inside the edit window.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function updateInquiry(request, response) {
  const inquiry = await inquiryService.updateInquiry(
    request.user.userId,
    request.params.inquiryId,
    request.body
  );
  sendResponse(response, 'Inquiry updated.', inquiry);
}

/**
 * DELETE /api/inquiries/:inquiryId - withdraw an inquiry inside the edit window.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function deleteInquiry(request, response) {
  await inquiryService.deleteInquiry(request.user.userId, request.params.inquiryId);
  sendResponse(response, 'Inquiry deleted.');
}

/**
 * GET /api/admin/inquiries - the admin inbox.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listAllInquiries(request, response) {
  const inquiries = await inquiryService.listAllInquiries(request.query);
  sendResponse(response, 'Inquiry inbox loaded.', { inquiries });
}

/**
 * GET /api/admin/inquiries/:inquiryId - one inquiry with its replies, for the admin panel.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getInquiryForAdmin(request, response) {
  const inquiryView = await inquiryService.getInquiryForAdmin(request.params.inquiryId);
  sendResponse(response, 'Inquiry loaded.', inquiryView);
}

/**
 * POST /api/admin/inquiries/:inquiryId/replies - answer an inquiry and notify its author.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function replyToInquiry(request, response) {
  const reply = await inquiryService.replyToInquiry(
    request.user.userId,
    request.params.inquiryId,
    request.body.message
  );
  sendResponse(response, 'Reply sent to the passenger.', reply, HTTP_STATUS.CREATED);
}

/**
 * PATCH /api/admin/inquiries/:inquiryId/close - close a dealt-with inquiry.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function closeInquiry(request, response) {
  const inquiry = await inquiryService.closeInquiry(request.params.inquiryId);
  sendResponse(response, 'Inquiry closed.', inquiry);
}

module.exports = {
  listMyInquiries: asyncHandler(listMyInquiries),
  getInquiryDetails: asyncHandler(getInquiryDetails),
  createInquiry: asyncHandler(createInquiry),
  updateInquiry: asyncHandler(updateInquiry),
  deleteInquiry: asyncHandler(deleteInquiry),
  listAllInquiries: asyncHandler(listAllInquiries),
  getInquiryForAdmin: asyncHandler(getInquiryForAdmin),
  replyToInquiry: asyncHandler(replyToInquiry),
  closeInquiry: asyncHandler(closeInquiry),
};
