// Constants for the admin area of the mobile app. The enum values must match the server's own
// constants files exactly, because the API validates against them: announcement.constants.js,
// inquiry.constants.js, route.constants.js, bus.constants.js and driver.constants.js.

/** The five tabs of the admin navigation bar, in the order they are drawn. */
export const ADMIN_TAB_ICONS = Object.freeze({
  notifications: 'megaphone-outline',
  inquiries: 'chatbubbles-outline',
  routes: 'git-branch-outline',
  transport: 'bus-outline',
  account: 'person-circle-outline',
});

/** ANNOUNCEMENT.severity. */
export const ANNOUNCEMENT_SEVERITIES = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
});

/** ANNOUNCEMENT.status. A draft reaches nobody until it is published. */
export const ANNOUNCEMENT_STATUSES = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

export const SEVERITY_LABELS = Object.freeze({
  [ANNOUNCEMENT_SEVERITIES.INFO]: 'Information',
  [ANNOUNCEMENT_SEVERITIES.WARNING]: 'Warning',
  [ANNOUNCEMENT_SEVERITIES.CRITICAL]: 'Critical',
});

/** Which StatusBadge tone each severity and status uses. */
export const SEVERITY_TONES = Object.freeze({
  [ANNOUNCEMENT_SEVERITIES.INFO]: 'information',
  [ANNOUNCEMENT_SEVERITIES.WARNING]: 'warning',
  [ANNOUNCEMENT_SEVERITIES.CRITICAL]: 'error',
});

export const ANNOUNCEMENT_STATUS_TONES = Object.freeze({
  [ANNOUNCEMENT_STATUSES.DRAFT]: 'neutral',
  [ANNOUNCEMENT_STATUSES.PUBLISHED]: 'success',
  [ANNOUNCEMENT_STATUSES.ARCHIVED]: 'neutral',
});

/** INQUIRY.status, .priority and .tag. */
export const INQUIRY_STATUSES = Object.freeze({
  OPEN: 'open',
  REPLIED: 'replied',
  CLOSED: 'closed',
});

export const INQUIRY_STATUS_TONES = Object.freeze({
  [INQUIRY_STATUSES.OPEN]: 'warning',
  [INQUIRY_STATUSES.REPLIED]: 'information',
  [INQUIRY_STATUSES.CLOSED]: 'success',
});

export const INQUIRY_PRIORITY_TONES = Object.freeze({
  high: 'error',
  medium: 'warning',
  low: 'neutral',
});

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

/** ROUTE.status. */
export const ROUTE_STATUSES = Object.freeze({
  ACTIVE: 'active',
  DRAFT: 'draft',
  SUSPENDED: 'suspended',
});

export const ROUTE_STATUS_TONES = Object.freeze({
  [ROUTE_STATUSES.ACTIVE]: 'success',
  [ROUTE_STATUSES.DRAFT]: 'neutral',
  [ROUTE_STATUSES.SUSPENDED]: 'error',
});

/** BUS.status. */
export const BUS_STATUSES = Object.freeze({
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',
});

export const BUS_STATUS_TONES = Object.freeze({
  [BUS_STATUSES.ACTIVE]: 'success',
  [BUS_STATUSES.MAINTENANCE]: 'warning',
  [BUS_STATUSES.RETIRED]: 'neutral',
});

/** The bus models this operator runs, from bus.constants.js. */
export const BUS_MODELS = Object.freeze([
  'Ashok Leyland Viking',
  'Ashok Leyland Lynx',
  'TATA Marcopolo',
  'TATA Starbus',
  'Lanka Ashok Leyland',
  'Other',
]);

/** DRIVER_PROFILE.licenseClass and .dutyStatus. */
export const LICENSE_CLASS_LABELS = Object.freeze({
  heavy_vehicle: 'Heavy Vehicle (HV)',
  light_vehicle: 'Light Vehicle (LV)',
  dual_purpose: 'Dual Purpose (DP)',
});

export const DRIVER_DUTY_STATUSES = Object.freeze({
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  SUSPENDED: 'suspended',
});

export const DUTY_STATUS_LABELS = Object.freeze({
  [DRIVER_DUTY_STATUSES.ACTIVE]: 'On duty',
  [DRIVER_DUTY_STATUSES.ON_LEAVE]: 'On leave',
  [DRIVER_DUTY_STATUSES.SUSPENDED]: 'Suspended',
});

export const DUTY_STATUS_TONES = Object.freeze({
  [DRIVER_DUTY_STATUSES.ACTIVE]: 'success',
  [DRIVER_DUTY_STATUSES.ON_LEAVE]: 'warning',
  [DRIVER_DUTY_STATUSES.SUSPENDED]: 'error',
});

/** Dates are typed, not picked: the project adds no date-picker library for four fields. */
export const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_INPUT_HINT = 'YYYY-MM-DD';

/** Sri Lankan plates such as NB-1234; letters then four digits, hyphen optional. The same pattern
 *  bus.validation.js enforces, so a bad plate is caught on the form instead of by the server. */
export const PLATE_NUMBER_PATTERN = /^[A-Za-z]{2,3}-?\d{4}$/;

/** "HH:MM" on a 24-hour clock, matching SERVICE_TIME_PATTERN on the server. */
export const SERVICE_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Wording shared by the admin screens. */
export const ADMIN_MESSAGES = Object.freeze({
  searchPlaceholder: 'Search...',
  allFilterLabel: 'All',
  loadFailed: 'Could not load this list.',
  requiredField: 'This cannot be empty.',
  invalidDate: `Enter the date as ${DATE_INPUT_HINT}.`,
  invalidTime: 'Enter the time as HH:MM on a 24-hour clock.',
  deleteTitle: 'Delete this record?',
  deleteConfirmLabel: 'Delete',
});
