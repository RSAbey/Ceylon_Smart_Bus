// Enum values for INQUIRY (Member 03).

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

module.exports = { INQUIRY_PRIORITIES, INQUIRY_TAGS, INQUIRY_STATUSES };
