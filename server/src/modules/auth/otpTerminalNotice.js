// Prints an issued OTP in the terminal that runs the API, for testing only (Member 01).
// There is no SMS gateway in this project, and Resend's shared sender only delivers to the address
// that owns the Resend account, so until a domain is verified the terminal is the one place a
// tester can read a code for any other address. It never prints in production, where a printed
// code would sit in the server log for anyone who can read it.
const environment = require('../../config/environment');

const NOTICE_RULE = '='.repeat(60);

/**
 * Prints one issued code where whoever started the API can read it.
 * @param {object} noticeDetails - What was issued.
 * @param {string} noticeDetails.purpose - One of OTP_PURPOSES, so a sign-up code and a reset code are told apart.
 * @param {string} noticeDetails.recipient - Who the code is for: the mobile number on sign-up, the email on a reset.
 * @param {string} noticeDetails.otpCode - The six digits.
 * @param {number} noticeDetails.lifetimeMinutes - How long the code lasts.
 * @returns {void}
 */
function printOtpForTesting({ purpose, recipient, otpCode, lifetimeMinutes }) {
  if (environment.isProduction) return;
  console.warn(
    `\n${NOTICE_RULE}\n` +
      `  OTP for testing (${purpose})\n` +
      `  for       ${recipient}\n` +
      `  code      ${otpCode}\n` +
      `  valid for ${lifetimeMinutes} minutes\n` +
      `${NOTICE_RULE}\n`
  );
}

module.exports = { printOtpForTesting };
