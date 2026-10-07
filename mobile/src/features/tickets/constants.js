// Constants for the tickets feature (Member 03). Put values here instead of magic strings in screens.

/** Must match server/src/modules/tickets/ticket.constants.js. */
export const TICKET_STATUSES = Object.freeze({
  ACTIVE: 'active',
  USED: 'used',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
});

/** Tabs across the top of My Tickets. An empty status means "show everything". */
export const TICKET_FILTER_TABS = Object.freeze([
  { label: 'All', status: '' },
  { label: 'Active', status: TICKET_STATUSES.ACTIVE },
  { label: 'Used', status: TICKET_STATUSES.USED },
  { label: 'Cancelled', status: TICKET_STATUSES.CANCELLED },
]);

/** StatusBadge status + wording for each ticket state, so colour is never the only signal. */
export const TICKET_BADGES = Object.freeze({
  [TICKET_STATUSES.ACTIVE]: { status: 'active', label: 'Active' },
  [TICKET_STATUSES.USED]: { status: 'valid', label: 'Used' },
  [TICKET_STATUSES.CANCELLED]: { status: 'cancelled', label: 'Cancelled' },
  [TICKET_STATUSES.EXPIRED]: { status: 'invalid', label: 'Expired' },
});

export const UNPAID_BADGE = Object.freeze({ status: 'delayed', label: 'Payment pending' });

/** Empty-state copy for My Tickets. */
export const TICKETS_EMPTY = Object.freeze({
  title: 'No tickets yet',
  message: 'Find a route, pick a seat and your ticket will appear here with its QR code.',
  actionLabel: 'Find a route',
});

/** Size of the QR code on the ticket details screen, in points. */
export const QR_CODE_SIZE = 200;

/** Currency prefix used on every fare in the app. */
export const CURRENCY_PREFIX = 'Rs.';
