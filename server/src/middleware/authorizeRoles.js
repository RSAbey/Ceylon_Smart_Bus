// Allows a route only for the listed roles (passenger | driver | admin); must run after authenticateToken.
const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../utils/httpStatus');

/**
 * Builds middleware that rejects callers whose role is not in the allowed list (HTTP 403).
 * @param {...string} allowedRoles - Roles allowed to continue.
 * @returns {import('express').RequestHandler} Express middleware.
 */
function authorizeRoles(...allowedRoles) {
  return function checkCallerRole(request, _response, next) {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      next(new AppError('You do not have permission to do this.', HTTP_STATUS.FORBIDDEN));
      return;
    }
    next();
  };
}

module.exports = authorizeRoles;
