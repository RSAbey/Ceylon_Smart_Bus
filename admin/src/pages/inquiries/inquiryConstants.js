// Reference data for the admin inquiry inbox.
// Must match server/src/modules/inquiries/inquiry.constants.js.

export const INQUIRY_STATUSES = Object.freeze({
  OPEN: 'open',
  REPLIED: 'replied',
  CLOSED: 'closed',
});

export const INQUIRY_PRIORITIES = Object.freeze({
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
});

export const INQUIRY_STATUS_BADGES = Object.freeze({
  [INQUIRY_STATUSES.OPEN]: { status: 'active', label: 'Open' },
  [INQUIRY_STATUSES.REPLIED]: { status: 'valid', label: 'Replied' },
  [INQUIRY_STATUSES.CLOSED]: { status: 'cancelled', label: 'Closed' },
});

export const INQUIRY_PRIORITY_BADGES = Object.freeze({
  [INQUIRY_PRIORITIES.HIGH]: { status: 'disrupted', label: 'High' },
  [INQUIRY_PRIORITIES.MEDIUM]: { status: 'delayed', label: 'Medium' },
  [INQUIRY_PRIORITIES.LOW]: { status: 'active', label: 'Low' },
});

export const INQUIRY_STATUS_FILTERS = Object.freeze([
  { label: 'All', status: '' },
  { label: 'Open', status: INQUIRY_STATUSES.OPEN },
  { label: 'Replied', status: INQUIRY_STATUSES.REPLIED },
  { label: 'Closed', status: INQUIRY_STATUSES.CLOSED },
]);

export const INQUIRY_TAG_LABELS = Object.freeze({
  ticketing_payment: 'Ticketing & payment',
  route: 'Route',
  delay: 'Delay',
  harassment: 'Harassment',
  bus_condition: 'Bus condition',
  driver_conduct: 'Driver conduct',
  app_issue: 'App issue',
  other: 'Other',
});

/** The value the inbox sends to ask for inquiries nobody has picked up. */
export const UNASSIGNED_FILTER = 'unassigned';

/** Matches the server's reply length rules, so a reply is refused before it is sent. */
export const MIN_REPLY_LENGTH = 10;
export const MAX_REPLY_LENGTH = 1000;
export const REPLY_ROW_COUNT = 5;

const HOURS_PER_DAY = 24;

export const INQUIRY_MESSAGES = Object.freeze({
  title: 'Inquiries',
  subtitle: 'Questions and complaints from passengers and drivers',
  emptyTitle: 'No inquiries match',
  emptyMessage: 'Clear the filters to see the whole inbox.',
  conversationHeading: 'Conversation',
  replyLabel: 'Send reply',
  replyPlaceholder: 'Answer the passenger in plain language.',
  closeLabel: 'Close inquiry',
  reopenLabel: 'Reopen',
  assigneeLabel: 'Assigned to',
  unassignedLabel: 'Nobody yet',
  closedNotice: 'This inquiry is closed. Reopen it to reply again.',
});

/**
 * How long an inquiry has been waiting, in words.
 * @param {number} waitingHours - Whole hours since it was raised.
 * @returns {string} For example "3 days" or "7 hours".
 */
export function describeWait(waitingHours) {
  if (waitingHours < 1) return 'under an hour';
  if (waitingHours < HOURS_PER_DAY) {
    return `${waitingHours} ${waitingHours === 1 ? 'hour' : 'hours'}`;
  }
  const waitingDays = Math.floor(waitingHours / HOURS_PER_DAY);
  return `${waitingDays} ${waitingDays === 1 ? 'day' : 'days'}`;
}
