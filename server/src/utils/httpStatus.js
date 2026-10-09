// Named HTTP status codes so no file uses bare numbers like 401 or 422.
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  /** The API worked but something it depends on, such as the email provider, did not. */
  BAD_GATEWAY: 502,
});

module.exports = HTTP_STATUS;
