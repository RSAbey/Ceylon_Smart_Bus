// Enum values and reference data for DRIVER_PROFILE (Member 01).

/** Sri Lankan licence classes a bus driver can hold. */
const LICENSE_CLASSES = Object.freeze({
  HEAVY_VEHICLE: 'heavy_vehicle',
  LIGHT_VEHICLE: 'light_vehicle',
  DUAL_PURPOSE: 'dual_purpose',
});

const LICENSE_CLASS_LABELS = Object.freeze({
  [LICENSE_CLASSES.HEAVY_VEHICLE]: 'Heavy Vehicle (HV)',
  [LICENSE_CLASSES.LIGHT_VEHICLE]: 'Light Vehicle (LV)',
  [LICENSE_CLASSES.DUAL_PURPOSE]: 'Dual Purpose (DP)',
});

/**
 * dutyStatus is whether a driver is available to drive, which is separate from whether their
 * account works. A driver on leave can still sign in; a suspended driver cannot (the service
 * blocks the USER account too).
 */
const DRIVER_DUTY_STATUSES = Object.freeze({
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  SUSPENDED: 'suspended',
});

module.exports = { LICENSE_CLASSES, LICENSE_CLASS_LABELS, DRIVER_DUTY_STATUSES };
