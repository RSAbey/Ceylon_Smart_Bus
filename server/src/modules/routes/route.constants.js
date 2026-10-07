// Enum values and schedule rules for ROUTE (Member 02).

const ROUTE_STATUSES = Object.freeze({
  /** active: passengers can search it, and buses may run on it. */
  ACTIVE: 'active',
  /** draft: being prepared by an admin; invisible to passengers until activated. */
  DRAFT: 'draft',
  /** suspended: withdrawn from service, kept for history and reporting. */
  SUSPENDED: 'suspended',
});

/** Service times are stored as "HH:MM" on a 24-hour clock, which sorts and compares as text. */
const SERVICE_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** How many days back the admin route table counts delay reports over. */
const DELAY_WINDOW_DAYS = 7;

module.exports = { ROUTE_STATUSES, SERVICE_TIME_PATTERN, DELAY_WINDOW_DAYS };
