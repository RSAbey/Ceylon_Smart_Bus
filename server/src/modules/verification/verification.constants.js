// Enum values for TICKET_VERIFICATION (Member 03).

const VERIFICATION_METHODS = Object.freeze({
  QR: 'qr',
  TICKET_KEY: 'ticketKey',
});

const VERIFICATION_RESULTS = Object.freeze({
  VALID: 'valid',
  INVALID: 'invalid',
});

module.exports = { VERIFICATION_METHODS, VERIFICATION_RESULTS };
