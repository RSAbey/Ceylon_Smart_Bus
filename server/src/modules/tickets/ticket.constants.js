// Enum values and booking rules for TICKET (Member 03).

const TICKET_STATUSES = Object.freeze({
  ACTIVE: 'active',
  USED: 'used',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
});

/** A ticket stays viewable (and verifiable) for this long after it is bought, so NFR-04 holds offline. */
const TICKET_VALID_HOURS = 24;

/** Prefix + random part of ticketKey, the code a driver can type when the QR will not scan (NFR-06). */
const TICKET_KEY_PREFIX = 'CSB';
const TICKET_KEY_DIGITS = 6;

/** Tickets can only be edited or cancelled while they are still unused and unpaid or paid-but-unverified. */
const EDITABLE_TICKET_STATUSES = Object.freeze([TICKET_STATUSES.ACTIVE]);

module.exports = {
  TICKET_STATUSES,
  TICKET_VALID_HOURS,
  TICKET_KEY_PREFIX,
  TICKET_KEY_DIGITS,
  EDITABLE_TICKET_STATUSES,
};
