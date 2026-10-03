// Local development entry point: connects to MongoDB, then starts listening (Vercel uses api/index.js instead).
const environment = require('./config/environment');
const { connectToDatabase } = require('./config/database');
const expressApplication = require('./app');

const STARTUP_FAILURE_EXIT_CODE = 1;

/**
 * Connects to the database first so the API never accepts requests it cannot serve.
 * @returns {Promise<void>} Resolves once the server is listening.
 */
async function startServer() {
  await connectToDatabase();
  expressApplication.listen(environment.port, () => {
    process.stdout.write(`Ceylon Smart Bus API listening on http://localhost:${environment.port}\n`);
  });
}

startServer().catch((startupError) => {
  console.error('Could not start the API:', startupError.message);
  process.exit(STARTUP_FAILURE_EXIT_CODE);
});
