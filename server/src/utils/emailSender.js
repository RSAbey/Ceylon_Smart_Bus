// Sends the transactional emails the app needs, through the Resend HTTP API.
// Resend is called with the global fetch that Node 20 provides, so the project adds no SDK for one
// POST request. Nothing here throws in development when the key is missing: the reset flow still
// returns the code in the response there, which is how the team tests without a mailbox.
const environment = require('../config/environment');
const AppError = require('./AppError');
const HTTP_STATUS = require('./httpStatus');

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
/**
 * Resend's shared sender. It works with no domain set up, but only delivers to the address that owns
 * the Resend account, so a real demo needs RESEND_FROM_EMAIL on a verified domain.
 */
const DEFAULT_FROM_ADDRESS = 'Ceylon Smart Bus <onboarding@resend.dev>';

/**
 * Whether email can actually be sent from this machine.
 * @returns {boolean} True when an API key is configured.
 */
function isEmailConfigured() {
  return Boolean(environment.resendApiKey);
}

/**
 * Sends one email.
 * @param {object} emailDetails - The message.
 * @param {string} emailDetails.toAddress - Who receives it.
 * @param {string} emailDetails.subject - Subject line.
 * @param {string} emailDetails.bodyText - Plain-text body; email clients that block HTML still read it.
 * @param {string} emailDetails.bodyHtml - HTML body.
 * @returns {Promise<boolean>} True when Resend accepted the message.
 */
async function sendEmail({ toAddress, subject, bodyText, bodyHtml }) {
  if (!isEmailConfigured()) {
    if (environment.isProduction) {
      throw new AppError('Email is not configured on this server.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return false;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${environment.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: environment.resendFromEmail || DEFAULT_FROM_ADDRESS,
      to: [toAddress],
      subject,
      text: bodyText,
      html: bodyHtml,
    }),
  });

  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    // The caller decides what to tell the user; this keeps the real reason in the server log only.
    throw new AppError(
      `The confirmation email could not be sent${failure.message ? `: ${failure.message}` : '.'}`,
      HTTP_STATUS.BAD_GATEWAY
    );
  }
  return true;
}

module.exports = { isEmailConfigured, sendEmail };
