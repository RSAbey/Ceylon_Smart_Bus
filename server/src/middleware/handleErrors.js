// Central error handler: maps known errors to the failure envelope { success: false, message, errors }.
const mongoose = require('mongoose');
const environment = require('../config/environment');
const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../utils/httpStatus');

const MONGO_DUPLICATE_KEY_CODE = 11000;
const JWT_ERROR_NAMES = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'];
const BODY_PARSE_ERROR_TYPE = 'entity.parse.failed';

/**
 * Converts any thrown error into an AppError with the right status code and message.
 * @param {Error} thrownError - Error raised anywhere in the request pipeline.
 * @returns {AppError} Normalised error.
 */
function normaliseError(thrownError) {
  if (thrownError instanceof AppError) return thrownError;

  if (thrownError instanceof mongoose.Error.ValidationError) {
    const fieldErrors = Object.values(thrownError.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }));
    return new AppError('Some fields are invalid.', HTTP_STATUS.UNPROCESSABLE_ENTITY, fieldErrors);
  }
  if (thrownError instanceof mongoose.Error.CastError) {
    return new AppError(`Invalid value for ${thrownError.path}.`, HTTP_STATUS.BAD_REQUEST);
  }
  if (thrownError.code === MONGO_DUPLICATE_KEY_CODE) {
    const duplicateFieldNames = Object.keys(thrownError.keyValue || {});
    const fieldErrors = duplicateFieldNames.map((fieldName) => ({
      field: fieldName,
      message: `This ${fieldName} is already in use.`,
    }));
    return new AppError('A record with the same details already exists.', HTTP_STATUS.CONFLICT, fieldErrors);
  }
  if (JWT_ERROR_NAMES.includes(thrownError.name)) {
    return new AppError('Your session has expired. Please sign in again.', HTTP_STATUS.UNAUTHORIZED);
  }
  if (thrownError.type === BODY_PARSE_ERROR_TYPE) {
    return new AppError('The request body is not valid JSON.', HTTP_STATUS.BAD_REQUEST);
  }
  return new AppError('Something went wrong on our side.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

/**
 * Express error middleware (four parameters) registered last in app.js.
 * @param {Error} thrownError - Error passed to next().
 * @param {import('express').Request} _request - Unused.
 * @param {import('express').Response} response - Express response.
 * @param {import('express').NextFunction} _next - Unused, but Express needs four parameters to detect an error handler.
 * @returns {void}
 */
function handleErrors(thrownError, _request, response, _next) {
  const normalisedError = normaliseError(thrownError);
  const isServerFault = normalisedError.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR;

  if (isServerFault) {
    console.error(thrownError);
  }

  const failureBody = {
    success: false,
    message: normalisedError.message,
    errors: normalisedError.errors,
  };
  // Stack traces help during development but must never reach clients in production.
  if (isServerFault && !environment.isProduction) {
    failureBody.stack = thrownError.stack;
  }
  response.status(normalisedError.statusCode).json(failureBody);
}

module.exports = handleErrors;
