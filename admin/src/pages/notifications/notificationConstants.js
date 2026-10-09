// Reference data for the admin Notifications page.
// Must match server/src/modules/announcements/announcement.constants.js.

export const ANNOUNCEMENT_STATUSES = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

export const ANNOUNCEMENT_STATUS_BADGES = Object.freeze({
  [ANNOUNCEMENT_STATUSES.DRAFT]: { status: 'cancelled', label: 'Draft' },
  [ANNOUNCEMENT_STATUSES.PUBLISHED]: { status: 'active', label: 'Published' },
  [ANNOUNCEMENT_STATUSES.ARCHIVED]: { status: 'disrupted', label: 'Archived' },
});

export const ANNOUNCEMENT_STATUS_FILTERS = Object.freeze([
  { label: 'All', status: '' },
  { label: 'Drafts', status: ANNOUNCEMENT_STATUSES.DRAFT },
  { label: 'Published', status: ANNOUNCEMENT_STATUSES.PUBLISHED },
  { label: 'Archived', status: ANNOUNCEMENT_STATUSES.ARCHIVED },
]);

export const ANNOUNCEMENT_SEVERITIES = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
});

export const SEVERITY_OPTIONS = Object.freeze([
  { severity: ANNOUNCEMENT_SEVERITIES.INFO, label: 'Info' },
  { severity: ANNOUNCEMENT_SEVERITIES.WARNING, label: 'Warning' },
  { severity: ANNOUNCEMENT_SEVERITIES.CRITICAL, label: 'Critical' },
]);

export const SEVERITY_BADGES = Object.freeze({
  [ANNOUNCEMENT_SEVERITIES.INFO]: { status: 'onTime', label: 'Info' },
  [ANNOUNCEMENT_SEVERITIES.WARNING]: { status: 'delayed', label: 'Warning' },
  [ANNOUNCEMENT_SEVERITIES.CRITICAL]: { status: 'invalid', label: 'Critical' },
});

/** Matches the server's length rules, so a message is refused before it is sent. */
export const MAX_TITLE_LENGTH = 120;
export const MIN_MESSAGE_LENGTH = 10;
export const MAX_MESSAGE_LENGTH = 1000;
export const MESSAGE_ROW_COUNT = 5;

export const NOTIFICATION_MESSAGES = Object.freeze({
  title: 'Notifications',
  subtitle: 'Service news sent to passengers as an in-app alert',
  composeLabel: 'Write notification',
  emptyTitle: 'Nothing written yet',
  emptyMessage: 'Write one to tell passengers about service changes, diversions or disruption.',
  publishTitle: 'Send this to passengers?',
  publishLabel: 'Send now',
  deleteTitle: 'Delete this draft?',
  deleteMessage: 'This cannot be undone. A notification already sent is archived, never deleted.',
  deleteLabel: 'Delete draft',
  notSentYet: 'Not sent yet',
});
