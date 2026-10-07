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
  message: 'Pick a bus, choose your seats and your ticket will appear here with its QR code.',
  actionLabel: 'Buy my ticket',
});

/** Label on the button that starts a booking, shown on My Tickets. */
export const BUY_TICKET_LABEL = 'Buy my ticket';

/** Size of the QR code on the ticket details screen, in points. */
export const QR_CODE_SIZE = 200;

/** Wording on the offline pill, which has two states depending on whether the API answered. */
export const OFFLINE_PILL = Object.freeze({
  online: { label: 'Offline Ticket Available', caption: 'Show this code to the conductor when boarding.' },
  offline: { label: 'Working offline', caption: 'This code works without internet.' },
});

/** Key prefix for the copy of a ticket kept on the phone so it opens with no connection (NFR-04). */
export const OFFLINE_TICKET_KEY_PREFIX = 'ceylonSmartBus.ticket.';

/** Currency prefix used on every fare in the app. */
export const CURRENCY_PREFIX = 'Rs.';
