// Builds the Express application: security headers, CORS, JSON parsing, health check, routers and error handling.
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const environment = require('./config/environment');
const registerRoutes = require('./routeRegistry');
const handleNotFound = require('./middleware/handleNotFound');
const handleErrors = require('./middleware/handleErrors');
const sendResponse = require('./utils/sendResponse');

const JSON_BODY_LIMIT = '1mb';
const DEVELOPMENT_LOG_FORMAT = 'dev';

/**
 * CORS origin check: admin browsers must be on the allow-list; requests without an Origin header are allowed
 * because the React Native app (and tools such as Postman) do not send one.
 * @param {string | undefined} requestOrigin - Value of the Origin header.
 * @param {Function} reportOriginDecision - cors callback (error, isAllowed).
 * @returns {void}
 */
function checkRequestOrigin(requestOrigin, reportOriginDecision) {
  const isOriginAllowed = !requestOrigin || environment.clientOrigins.includes(requestOrigin);
  reportOriginDecision(null, isOriginAllowed);
}

/**
 * GET /api/health — lets Vercel, the team and the examiner check the API is up.
 * @param {import('express').Request} _request - Unused.
 * @param {import('express').Response} response - Express response.
 * @returns {void}
 */
function reportHealth(_request, response) {
  sendResponse(response, 'Ceylon Smart Bus API is running.', {
    status: 'ok',
    time: new Date().toISOString(),
  });
}

const expressApplication = express();

expressApplication.use(helmet());
expressApplication.use(cors({ origin: checkRequestOrigin }));
expressApplication.use(express.json({ limit: JSON_BODY_LIMIT }));
if (!environment.isProduction) {
  expressApplication.use(morgan(DEVELOPMENT_LOG_FORMAT));
}

expressApplication.get('/api/health', reportHealth);
registerRoutes(expressApplication);

expressApplication.use(handleNotFound);
expressApplication.use(handleErrors);

module.exports = expressApplication;
