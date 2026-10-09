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

/** How many digits the optional app-lock PIN has. mobile/src/utils/constants.js keeps the same number. */
const APP_PIN_LENGTH = 4;

/** Exactly APP_PIN_LENGTH digits and nothing else, so the pattern cannot drift from the length. */
const APP_PIN_PATTERN = new RegExp(`^\\d{${APP_PIN_LENGTH}}$`);

module.exports = { USER_ROLES, USER_STATUSES, OTP_PURPOSES, APP_PIN_LENGTH, APP_PIN_PATTERN };
