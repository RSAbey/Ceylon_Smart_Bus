// Enum values and limits for DELAY_REPORT (Member 04). Limits come from PROJECT_PLAN.md section 3.3.

const DELAY_REASONS = Object.freeze({
  HEAVY_TRAFFIC: 'heavy_traffic',
  ROAD_CLOSURE: 'road_closure',
  MECHANICAL: 'mechanical',
  WEATHER: 'weather',
  OTHER: 'other',
});

const DELAY_REPORT_STATUSES = Object.freeze({
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
});

const MIN_DELAY_MINUTES = 1;
const MAX_DELAY_MINUTES = 180;

module.exports = { DELAY_REASONS, DELAY_REPORT_STATUSES, MIN_DELAY_MINUTES, MAX_DELAY_MINUTES };
