// Enum values for NOTIFICATION (Member 04).

const NOTIFICATION_TYPES = Object.freeze({
  BUS_APPROACHING: 'bus_approaching',
  DELAY: 'delay',
  TICKET: 'ticket',
  PAYMENT: 'payment',
  ANNOUNCEMENT: 'announcement',
  INQUIRY_REPLY: 'inquiry_reply',
});

/** Rows per page in the Alerts feed, so a long history never arrives in one response. */
const NOTIFICATION_PAGE_SIZE = 20;

module.exports = { NOTIFICATION_TYPES, NOTIFICATION_PAGE_SIZE };
