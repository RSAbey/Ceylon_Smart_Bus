// Demo accounts (Member 01 tables): 1 admin, 2 drivers with DriverProfile, 3 passengers. DEMO DATA ONLY.
const bcrypt = require('bcryptjs');
const User = require('../../modules/users/user.model');
const DriverProfile = require('../../modules/drivers/driverProfile.model');
const { USER_ROLES } = require('../../modules/users/user.constants');

/** Shared password of every demo account. Never reuse it for a real account. */
const DEMO_PASSWORD = 'CeylonBus@2026';
const BCRYPT_SALT_ROUNDS = 10;

const DEMO_USERS = [
  { fullName: 'Dilani Jayasekara', email: 'admin@ceylonsmartbus.lk', mobile: '0770000001', role: USER_ROLES.ADMIN },
  { fullName: 'Sunil Perera', email: 'sunil.driver@ceylonsmartbus.lk', mobile: '0771000001', role: USER_ROLES.DRIVER },
  { fullName: 'Ruwan Silva', email: 'ruwan.driver@ceylonsmartbus.lk', mobile: '0771000002', role: USER_ROLES.DRIVER },
  { fullName: 'Anjali Perera', email: 'anjali.perera@example.com', mobile: '0772000001', role: USER_ROLES.PASSENGER },
  { fullName: 'Kasun Wijesinghe', email: 'kasun.wijesinghe@example.com', mobile: '0772000002', role: USER_ROLES.PASSENGER },
  { fullName: 'Tharushi Fernando', email: 'tharushi.fernando@example.com', mobile: '0772000003', role: USER_ROLES.PASSENGER },
];

/** Licence and NIC numbers are made-up values in the official formats. */
const DEMO_DRIVER_DOCUMENTS = [
  { email: 'sunil.driver@ceylonsmartbus.lk', licenseNumber: 'B4521873', nic: '198512304567' },
  { email: 'ruwan.driver@ceylonsmartbus.lk', licenseNumber: 'B7730214', nic: '199007158812' },
];

/**
 * Inserts the demo users (password hashed with bcryptjs) and the two driver profiles.
 * @returns {Promise<{adminUser: object, driverUsers: object[], passengerUsers: object[], driverProfiles: object[]}>}
 *   Created documents for the later seed steps.
 */
async function seedAccounts() {
  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_SALT_ROUNDS);
  const createdUsers = await User.insertMany(
    DEMO_USERS.map((demoUser) => ({ ...demoUser, passwordHash: demoPasswordHash }))
  );

  const usersByEmail = new Map(createdUsers.map((createdUser) => [createdUser.email, createdUser]));
  const driverProfiles = await DriverProfile.insertMany(
    DEMO_DRIVER_DOCUMENTS.map((driverDocument) => ({
      userId: usersByEmail.get(driverDocument.email).id,
      licenseNumber: driverDocument.licenseNumber,
      nic: driverDocument.nic,
    }))
  );

  return {
    adminUser: createdUsers.find((createdUser) => createdUser.role === USER_ROLES.ADMIN),
    driverUsers: createdUsers.filter((createdUser) => createdUser.role === USER_ROLES.DRIVER),
    passengerUsers: createdUsers.filter((createdUser) => createdUser.role === USER_ROLES.PASSENGER),
    driverProfiles,
  };
}

module.exports = { seedAccounts, DEMO_PASSWORD, DEMO_USERS };
