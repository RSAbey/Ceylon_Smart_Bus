// Constants for the alerts feature (Member 04).

/** Must match server/src/modules/notifications/notification.constants.js. */
export const NOTIFICATION_TYPES = Object.freeze({
  BUS_APPROACHING: 'bus_approaching',
  DELAY: 'delay',
  TICKET: 'ticket',
  PAYMENT: 'payment',
  ANNOUNCEMENT: 'announcement',
  INQUIRY_REPLY: 'inquiry_reply',
});

/** Icon and wording for each alert type, so the row is never colour alone (NFR-09). */
export const NOTIFICATION_STYLES = Object.freeze({
  [NOTIFICATION_TYPES.BUS_APPROACHING]: { iconName: 'bus', label: 'Bus approaching' },
  [NOTIFICATION_TYPES.DELAY]: { iconName: 'time', label: 'Delay' },
  [NOTIFICATION_TYPES.TICKET]: { iconName: 'ticket', label: 'Ticket' },
  [NOTIFICATION_TYPES.PAYMENT]: { iconName: 'card', label: 'Payment' },
  [NOTIFICATION_TYPES.ANNOUNCEMENT]: { iconName: 'megaphone', label: 'Announcement' },
  [NOTIFICATION_TYPES.INQUIRY_REPLY]: { iconName: 'chatbubble-ellipses', label: 'Support reply' },
});

/** Tabs across the top of Alerts. An empty type means "show everything". */
export const ALERT_FILTER_TABS = Object.freeze([
  { label: 'All', type: '' },
  { label: 'Delays', type: NOTIFICATION_TYPES.DELAY },
  { label: 'Tickets', type: NOTIFICATION_TYPES.TICKET },
  { label: 'News', type: NOTIFICATION_TYPES.ANNOUNCEMENT },
]);

/** Must match server/src/modules/alertSubscriptions/alertSubscription.constants.js. */
export const ALERT_TYPES = Object.freeze({
  APPROACHING: 'approaching',
  DELAY: 'delay',
  BOTH: 'both',
});

/** The three choices on the Alert Settings screen, with what each one actually does. */
export const ALERT_TYPE_OPTIONS = Object.freeze([
  {
    alertType: ALERT_TYPES.APPROACHING,
    label: 'Bus approaching only',
    hint: 'Told when a bus on this route is close to you.',
  },
  {
    alertType: ALERT_TYPES.DELAY,
    label: 'Delays only',
    hint: 'Told when a driver reports this route running late.',
  },
  {
    alertType: ALERT_TYPES.BOTH,
    label: 'Both',
    hint: 'Told about approaching buses and about delays.',
  },
]);

export const ALERTS_EMPTY = Object.freeze({
  title: 'No alerts yet',
  message: 'Delays, ticket updates and service news will appear here.',
  actionLabel: 'Choose alert settings',
});

export const ALERT_SETTINGS_EMPTY = Object.freeze({
  title: 'No routes followed yet',
  message: 'Follow a route to be told when its buses are late or approaching your stop.',
  actionLabel: 'Browse routes',
});

export const ALERT_MESSAGES = Object.freeze({
  markAllRead: 'Mark all read',
  clearRead: 'Clear read alerts',
  clearConfirmTitle: 'Clear alerts you have read?',
  clearConfirmMessage: 'Unread alerts are kept. This cannot be undone.',
  pausedLabel: 'Paused',
});
