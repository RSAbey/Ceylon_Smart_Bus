// Constants for the inquiries feature (Member 03).

/** Must match server/src/modules/inquiries/inquiry.constants.js. */
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

/** Tag values with the wording shown to the user, in the order they appear in the picker. */
export const INQUIRY_TAG_OPTIONS = Object.freeze([
  { tag: 'ticketing_payment', label: 'Ticketing or payment' },
  { tag: 'route', label: 'Route or timetable' },
  { tag: 'delay', label: 'Delay' },
  { tag: 'bus_condition', label: 'Bus condition' },
  { tag: 'driver_conduct', label: 'Driver conduct' },
  { tag: 'harassment', label: 'Harassment or safety' },
  { tag: 'app_issue', label: 'Problem with the app' },
  { tag: 'other', label: 'Something else' },
]);

export const INQUIRY_PRIORITY_OPTIONS = Object.freeze([
  { priority: INQUIRY_PRIORITIES.LOW, label: 'Low' },
  { priority: INQUIRY_PRIORITIES.MEDIUM, label: 'Medium' },
  { priority: INQUIRY_PRIORITIES.HIGH, label: 'High' },
]);

/** Tabs across the top of the inquiry list. An empty status means "show everything". */
export const INQUIRY_FILTER_TABS = Object.freeze([
  { label: 'All', status: '' },
  { label: 'Open', status: INQUIRY_STATUSES.OPEN },
  { label: 'Replied', status: INQUIRY_STATUSES.REPLIED },
  { label: 'Closed', status: INQUIRY_STATUSES.CLOSED },
]);

/** StatusBadge status + wording for each inquiry state. */
export const INQUIRY_BADGES = Object.freeze({
  [INQUIRY_STATUSES.OPEN]: { status: 'active', label: 'Open' },
  [INQUIRY_STATUSES.REPLIED]: { status: 'valid', label: 'Replied' },
  [INQUIRY_STATUSES.CLOSED]: { status: 'cancelled', label: 'Closed' },
});

export const INQUIRY_MESSAGES = Object.freeze({
  editWindowOver: 'The time to edit this inquiry has passed, but you can send a new one.',
  deleteConfirmTitle: 'Delete this inquiry?',
  deleteConfirmMessage: 'Support will no longer see it. This cannot be undone.',
});

/** Empty-state copy for the inquiry list. */
export const INQUIRIES_EMPTY = Object.freeze({
  title: 'No inquiries yet',
  message: 'Ask a question or report a problem and our support team will reply here.',
  actionLabel: 'Write an inquiry',
});

/** Shortest message the server accepts, repeated here so the field can say so before submitting. */
export const MIN_INQUIRY_MESSAGE_LENGTH = 10;
export const MAX_INQUIRY_MESSAGE_LENGTH = 1000;
