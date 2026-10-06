// Constants for the authentication feature (Member 01). Put values here instead of magic numbers in screens.

/** Steps in the registration wizard, shown as "1 of 4" in the header. */
export const REGISTRATION_STEP_COUNT = 4;
export const REGISTRATION_STEPS = Object.freeze({
  chooseAccount: 1,
  createAccount: 2,
  verify: 3,
  done: 4,
});

/** Digits in the confirmation code; must match OTP_DIGIT_COUNT on the server. */
export const OTP_DIGIT_COUNT = 6;

/** Seconds the Verification screen counts down before "Resend" becomes tappable. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/** Shortest password the Sign Up form accepts; must match the server rule. */
export const MIN_PASSWORD_LENGTH = 8;

/** Account types on the "How will you use our platform?" screen. */
export const ACCOUNT_TYPES = Object.freeze({
  PASSENGER: 'passenger',
  DRIVER: 'driver',
});

/** Client-side validation messages (the server repeats these checks). */
export const LOGIN_MESSAGES = Object.freeze({
  identifierRequired: 'Enter your email or mobile number.',
  passwordRequired: 'Enter your password.',
});

export const REGISTER_MESSAGES = Object.freeze({
  fullNameRequired: 'Enter your full name.',
  emailRequired: 'Enter your email address.',
  emailInvalid: 'Please enter a valid email address (e.g. name@domain.com)',
  mobileRequired: 'Enter your mobile number.',
  mobileInvalid: 'Enter a Sri Lankan mobile number, for example 0771234567.',
  passwordTooShort: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  termsRequired: 'Please accept the Terms of Service and Privacy Policy.',
  otpIncomplete: `Enter all ${OTP_DIGIT_COUNT} digits.`,
});

/** Same rules the server validates with, so the user sees errors before a round trip. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SRI_LANKA_MOBILE_PATTERN = /^(?:0\d{9}|\+94\d{9})$/;
