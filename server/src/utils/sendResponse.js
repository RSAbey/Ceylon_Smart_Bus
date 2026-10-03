// Sends the standard success envelope { success: true, message, data } used by every endpoint.
const HTTP_STATUS = require('./httpStatus');

/**
 * Writes a JSON success response in the agreed API envelope.
 * Positional arguments keep callers free of a `data:` key (a banned generic name outside this file).
 * @param {import('express').Response} response - Express response object.
 * @param {string} message - Short human-readable message.
 * @param {*} [responsePayload] - Payload returned to the client as `data`.
 * @param {number} [statusCode] - HTTP status code (default 200).
 * @returns {import('express').Response} The Express response, for chaining.
 */
function sendResponse(response, message, responsePayload = null, statusCode = HTTP_STATUS.OK) {
  return response.status(statusCode).json({ success: true, message, data: responsePayload });
}

module.exports = sendResponse;
