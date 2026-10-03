// Error class for expected failures (bad input, not found, forbidden) that carries an HTTP status code.
class AppError extends Error {
  /**
   * Creates an error that handleErrors turns into the standard failure envelope.
   * @param {string} message - Human-readable message shown to the client.
   * @param {number} statusCode - HTTP status code to send.
   * @param {Array<{field?: string, message: string}>} [errors] - Optional field-level details.
   */
  constructor(message, statusCode, errors = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

module.exports = AppError;
