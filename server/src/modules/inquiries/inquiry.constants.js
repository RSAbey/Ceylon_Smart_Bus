// Enum values and the edit window for INQUIRY (Member 03).

const INQUIRY_PRIORITIES = Object.freeze({
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
});

const INQUIRY_TAGS = Object.freeze({
  TICKETING_PAYMENT: 'ticketing_payment',
  ROUTE: 'route',
  DELAY: 'delay',
  HARASSMENT: 'harassment',
  BUS_CONDITION: 'bus_condition',
  DRIVER_CONDUCT: 'driver_conduct',
  APP_ISSUE: 'app_issue',
  OTHER: 'other',
});

const INQUIRY_STATUSES = Object.freeze({
  OPEN: 'open',
  REPLIED: 'replied',
  CLOSED: 'closed',
});

/** An author may correct or withdraw their own inquiry for this long after sending it. */
const INQUIRY_EDIT_WINDOW_MINUTES = 5;

module.exports = {
  INQUIRY_PRIORITIES,
  INQUIRY_TAGS,
  INQUIRY_STATUSES,
  INQUIRY_EDIT_WINDOW_MINUTES,
};
