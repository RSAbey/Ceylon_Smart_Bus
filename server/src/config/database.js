// Opens (and reuses) the MongoDB connection; the promise is cached on `global` for Vercel serverless reuse.
const mongoose = require('mongoose');
const environment = require('./environment');

/**
 * Connects Mongoose to MongoDB once and returns the same promise on every later call.
 * Serverless functions are re-invoked many times in one warm container, so reconnecting each time would exhaust Atlas connections.
 * @returns {Promise<typeof mongoose>} The connected Mongoose instance.
 */
function connectToDatabase() {
  if (!global.ceylonSmartBusDatabaseConnection) {
    global.ceylonSmartBusDatabaseConnection = mongoose
      .connect(environment.mongodbUri)
      .catch((connectionError) => {
        // Forget the failed attempt so the next request can try again.
        global.ceylonSmartBusDatabaseConnection = null;
        throw connectionError;
      });
  }
  return global.ceylonSmartBusDatabaseConnection;
}

/**
 * Closes the Mongoose connection (used by the seed script when it finishes).
 * @returns {Promise<void>} Resolves once the connection is closed.
 */
async function disconnectFromDatabase() {
  await mongoose.disconnect();
  global.ceylonSmartBusDatabaseConnection = null;
}

module.exports = { connectToDatabase, disconnectFromDatabase };
