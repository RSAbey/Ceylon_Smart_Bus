// `npm run seed`: wipes this app's 20 collections and recreates realistic demo data in dependency order.
const mongoose = require('mongoose');
const environment = require('../config/environment');
const { connectToDatabase, disconnectFromDatabase } = require('../config/database');
const { seedAccounts, DEMO_PASSWORD, DEMO_USERS } = require('./data/m01Accounts');
const { seedFleet } = require('./data/m02Fleet');
const { seedTickets } = require('./data/m03Tickets');
const { seedOperations } = require('./data/m04Operations');

// Loading every model registers it with Mongoose, so the reset below covers all 20 ERD tables.
require('../modules/auth/otpVerification.model');
require('../modules/tracking/busLocation.model');
require('../modules/verification/ticketVerification.model');
require('../modules/alertSubscriptions/alertSubscription.model');

const FORCE_FLAG = '--force';
const MONGO_NAMESPACE_NOT_FOUND_CODE = 26;
const SEED_FAILURE_EXIT_CODE = 1;

/**
 * Stops the seed in production unless --force is passed, so a demo reset can never wipe live data by accident.
 * @returns {void}
 */
function assertSeedAllowed() {
  const isForced = process.argv.includes(FORCE_FLAG);
  if (environment.isProduction && !isForced) {
    throw new Error('Refusing to seed while NODE_ENV=production. Re-run with --force if you are sure.');
  }
}

/**
 * Drops each of this app's collections (only those with a registered model) and rebuilds their indexes.
 * @returns {Promise<void>} Resolves when every collection is empty and indexed.
 */
async function resetAppCollections() {
  for (const registeredModel of Object.values(mongoose.models)) {
    try {
      await registeredModel.collection.drop();
    } catch (dropError) {
      // A collection that does not exist yet is fine on a fresh database.
      if (dropError.code !== MONGO_NAMESPACE_NOT_FOUND_CODE) throw dropError;
    }
    await registeredModel.createIndexes();
  }
}

/**
 * Prints the demo logins so the team can sign in straight away.
 * @returns {void}
 */
function printDemoLogins() {
  const loginLines = DEMO_USERS.map(
    (demoUser) => `  ${demoUser.role.padEnd(10)} ${demoUser.email.padEnd(34)} ${demoUser.mobile}`
  );
  process.stdout.write(
    ['', 'Demo data created. Demo logins (email or mobile):', ...loginLines, `  password   ${DEMO_PASSWORD}`, ''].join('\n')
  );
}

/**
 * Runs the full seed: accounts -> fleet -> tickets/inquiries -> operations.
 * @returns {Promise<void>} Resolves when the seed is complete.
 */
async function seedDatabase() {
  assertSeedAllowed();
  await connectToDatabase();
  await resetAppCollections();

  const accounts = await seedAccounts();
  const fleet = await seedFleet(accounts);
  await seedTickets(accounts, fleet);
  await seedOperations(accounts, fleet);

  printDemoLogins();
}

seedDatabase()
  .catch((seedError) => {
    console.error('Seed failed:', seedError.message);
    process.exitCode = SEED_FAILURE_EXIT_CODE;
  })
  .finally(disconnectFromDatabase);
