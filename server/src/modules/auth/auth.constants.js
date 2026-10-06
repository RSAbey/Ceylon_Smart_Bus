// Registration and OTP rules (FR-01, NFR-07). Values here instead of magic numbers in the service.

/** Six digits, as drawn on the Verification screen. */
const OTP_DIGIT_COUNT = 6;
const OTP_SMALLEST_VALUE = 100000;
const OTP_LARGEST_VALUE = 1000000;

/** A code is valid for 5 minutes, then the TTL index deletes the row. */
const OTP_LIFETIME_MINUTES = 5;

/** Wrong guesses allowed before the code is burned (NFR-07: a 6-digit code must not be brute-forceable). */
const OTP_MAX_ATTEMPTS = 3;

/** The Verification screen counts down from 60 s before "Resend" becomes tappable. */
const OTP_RESEND_COOLDOWN_SECONDS = 60;

/** bcrypt work factor used for both passwords and OTP codes. */
const BCRYPT_SALT_ROUNDS = 10;

/** Minimum password length shown on the Sign Up screen ("Minimum 8 characters"). */
const MIN_PASSWORD_LENGTH = 8;

/** Sri Lankan mobile numbers: 10 digits starting 07, or +94 followed by 9 digits. */
const SRI_LANKA_MOBILE_PATTERN = /^(?:0\d{9}|\+94\d{9})$/;

module.exports = {
  OTP_DIGIT_COUNT,
  OTP_SMALLEST_VALUE,
  OTP_LARGEST_VALUE,
  OTP_LIFETIME_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  BCRYPT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  SRI_LANKA_MOBILE_PATTERN,
};
