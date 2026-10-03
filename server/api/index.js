// Vercel serverless entry point: connects to MongoDB on the first request, then hands every request to Express.
const expressApplication = require('../src/app');
const { connectToDatabase } = require('../src/config/database');

/**
 * Vercel function handler. The connection promise is cached, so warm invocations do not reconnect.
 * @param {import('http').IncomingMessage} request - Incoming request.
 * @param {import('http').ServerResponse} response - Outgoing response.
 * @returns {Promise<void>} Resolves when Express has handled the request.
 */
async function handleVercelRequest(request, response) {
  await connectToDatabase();
  return expressApplication(request, response);
}

module.exports = handleVercelRequest;
