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

/** The reason cards. Each carries an icon (NFR-09) and, where the hold-up is predictable, the
 * usual number of minutes, so one tap fills in both answers while the driver is at the wheel.
 * A reason with no suggestedMinutes needs the driver to say how long, because it varies too much. */
export const DELAY_REASON_OPTIONS = Object.freeze([
  {
    reason: DELAY_REASONS.HEAVY_TRAFFIC,
    label: 'Heavy Traffic',
    iconName: 'car',
    suggestedMinutes: 10,
    tone: 'warning',
  },
  {
    reason: DELAY_REASONS.ROAD_CLOSURE,
    label: 'Road Closure',
    iconName: 'warning',
    suggestedMinutes: 15,
    tone: 'error',
  },
  {
    reason: DELAY_REASONS.MECHANICAL,
    label: 'Mechanical Issue',
    iconName: 'construct',
    suggestedMinutes: null,
    tone: 'neutral',
  },
  {
    reason: DELAY_REASONS.WEATHER,
    label: 'Weather',
    iconName: 'rainy',
    suggestedMinutes: null,
    tone: 'neutral',
  },
]);

/** "Other" is kept out of the card grid: it always needs typing, so it sits in its own field. */
export const OTHER_REASON_OPTION = Object.freeze({
  reason: DELAY_REASONS.OTHER,
  label: 'Other / Custom',
  iconName: 'ellipsis-horizontal',
});

/** One-tap delay amounts, so a driver at the wheel does not have to type (NFR-06). */
export const DELAY_PRESET_MINUTES = Object.freeze([5, 10, 15, 30, 45, 60]);

/** StatusBadge status + wording for each report state. */
export const DELAY_BADGES = Object.freeze({
  [DELAY_REPORT_STATUSES.ACTIVE]: { status: 'delayed', label: 'Active' },
  [DELAY_REPORT_STATUSES.RESOLVED]: { status: 'onTime', label: 'Resolved' },
  [DELAY_REPORT_STATUSES.CANCELLED]: { status: 'cancelled', label: 'Withdrawn' },
});

/** Wording on the delay form and the confirmation that follows it. */
export const DELAY_SCREEN_MESSAGES = Object.freeze({
  formTitle: 'Report a Delay',
  formSubtitle: 'Select a reason — duration is added automatically',
  otherPlaceholder: 'Other / Custom — enter duration',
  submit: 'Submit delay',
  footnote: 'Passengers on this route will receive an updated delay notification automatically.',
  doneTitle: 'Delay Reported',
  doneNote: 'Passengers following this route have been notified.',
  backToDashboard: 'Back to dashboard',
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
