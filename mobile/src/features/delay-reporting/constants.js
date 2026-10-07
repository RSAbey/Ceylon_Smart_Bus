// Constants for the driver delay-reporting feature (Member 04).

/** Must match server/src/modules/delays/delay.constants.js. */
export const DELAY_REASONS = Object.freeze({
  HEAVY_TRAFFIC: 'heavy_traffic',
  ROAD_CLOSURE: 'road_closure',
  MECHANICAL: 'mechanical',
  WEATHER: 'weather',
  OTHER: 'other',
});

export const DELAY_REPORT_STATUSES = Object.freeze({
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
});

export const MIN_DELAY_MINUTES = 1;
export const MAX_DELAY_MINUTES = 180;

/** The reason buttons, each with an icon so the driver can pick one without reading (NFR-09). */
export const DELAY_REASON_OPTIONS = Object.freeze([
  { reason: DELAY_REASONS.HEAVY_TRAFFIC, label: 'Heavy traffic', iconName: 'car' },
  { reason: DELAY_REASONS.ROAD_CLOSURE, label: 'Road closure', iconName: 'warning' },
  { reason: DELAY_REASONS.MECHANICAL, label: 'Mechanical', iconName: 'construct' },
  { reason: DELAY_REASONS.WEATHER, label: 'Bad weather', iconName: 'rainy' },
  { reason: DELAY_REASONS.OTHER, label: 'Other', iconName: 'ellipsis-horizontal' },
]);

/** One-tap delay amounts, so a driver at the wheel does not have to type (NFR-06). */
export const DELAY_PRESET_MINUTES = Object.freeze([5, 10, 15, 30, 45, 60]);

/** StatusBadge status + wording for each report state. */
export const DELAY_BADGES = Object.freeze({
  [DELAY_REPORT_STATUSES.ACTIVE]: { status: 'delayed', label: 'Active' },
  [DELAY_REPORT_STATUSES.RESOLVED]: { status: 'onTime', label: 'Resolved' },
  [DELAY_REPORT_STATUSES.CANCELLED]: { status: 'cancelled', label: 'Withdrawn' },
});

export const DELAY_MESSAGES = Object.freeze({
  noTrip: 'Start your trip before reporting a delay, so passengers know which bus is late.',
  chooseReason: 'What is holding the bus up?',
  chooseMinutes: 'How late are you?',
  noteRequired: 'Describe what is holding the bus up.',
  resolveTitle: 'Back on time?',
  resolveMessage: 'Passengers following this route will be told the hold-up is over.',
  cancelTitle: 'Withdraw this report?',
  cancelMessage: 'Use this when the delay was reported by mistake.',
});

/** Empty-state copy for the driver's delay history. */
export const DELAY_HISTORY_EMPTY = Object.freeze({
  title: 'No delays reported',
  message: 'Delays you report appear here so you can see what you told passengers.',
});
