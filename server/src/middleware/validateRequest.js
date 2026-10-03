// Turns express-validator failures into a 422 response with a field-by-field `errors` list.
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../utils/httpStatus');

/**
 * Express middleware placed after the validation chains of a route.
 * @param {import('express').Request} request - Incoming request.
 * @param {import('express').Response} _response - Unused.
 * @param {import('express').NextFunction} next - Next middleware.
 * @returns {void}
 */
function validateRequest(request, _response, next) {
  const validationErrors = validationResult(request);
  if (validationErrors.isEmpty()) {
    next();
    return;
  }

  const fieldErrors = validationErrors.array().map((validationError) => ({
    field: validationError.path,
    message: validationError.msg,
  }));
  next(new AppError('Some fields are invalid.', HTTP_STATUS.UNPROCESSABLE_ENTITY, fieldErrors));
}

module.exports = validateRequest;
