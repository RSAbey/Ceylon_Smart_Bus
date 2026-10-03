// Wraps an async controller so any rejected promise reaches the central error handler.

/**
 * Returns an Express handler that forwards async errors to `next`.
 * @param {Function} asyncController - Controller of the form (request, response, next) => Promise.
 * @returns {Function} Express-compatible handler.
 */
function asyncHandler(asyncController) {
  return function runAsyncController(request, response, next) {
    Promise.resolve(asyncController(request, response, next)).catch(next);
  };
}

module.exports = asyncHandler;
