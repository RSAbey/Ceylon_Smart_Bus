// Catches requests to paths no router handled and forwards a 404 to the error handler.
const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../utils/httpStatus');

/**
 * Express middleware registered after every router.
 * @param {import('express').Request} request - Incoming request.
 * @param {import('express').Response} _response - Unused.
 * @param {import('express').NextFunction} next - Next middleware.
 * @returns {void}
 */
function handleNotFound(request, _response, next) {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, HTTP_STATUS.NOT_FOUND));
}

module.exports = handleNotFound;
