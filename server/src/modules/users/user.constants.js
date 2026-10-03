// Enum values for USER, DRIVER_PROFILE and OTP_VERIFICATION (Member 01 tables).

const USER_ROLES = Object.freeze({
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  ADMIN: 'admin',
});

const USER_STATUSES = Object.freeze({
  ACTIVE: 'active',
  BLOCKED: 'blocked',
});

/** OTP_VERIFICATION.purpose lives here because Member 01 owns both tables and auth/ has no constants file. */
const OTP_PURPOSES = Object.freeze({
  REGISTER: 'register',
  RESET: 'reset',
});

module.exports = { USER_ROLES, USER_STATUSES, OTP_PURPOSES };
