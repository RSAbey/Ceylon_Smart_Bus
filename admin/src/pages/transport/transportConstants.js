// Shared reference data for the Transport Data page. Must match the server constants files.

/** Must match server/src/modules/buses/bus.constants.js. */
export const BUS_STATUSES = Object.freeze({
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',
});

export const BUS_MODELS = Object.freeze([
  'Ashok Leyland Viking',
  'Ashok Leyland Lynx',
  'TATA Marcopolo',
  'TATA Starbus',
  'Lanka Ashok Leyland',
  'Other',
]);

export const BUS_STATUS_BADGES = Object.freeze({
  [BUS_STATUSES.ACTIVE]: { status: 'active', label: 'Active' },
  [BUS_STATUSES.MAINTENANCE]: { status: 'delayed', label: 'Maintenance' },
  [BUS_STATUSES.RETIRED]: { status: 'cancelled', label: 'Retired' },
});

export const BUS_STATUS_FILTERS = Object.freeze([
  { label: 'All buses', status: '' },
  { label: 'Active', status: BUS_STATUSES.ACTIVE },
  { label: 'In maintenance', status: BUS_STATUSES.MAINTENANCE },
  { label: 'Retired', status: BUS_STATUSES.RETIRED },
]);

/** Must match server/src/modules/drivers/driver.constants.js. */
export const DRIVER_DUTY_STATUSES = Object.freeze({
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  SUSPENDED: 'suspended',
});

export const LICENSE_CLASSES = Object.freeze([
  { licenseClass: 'heavy_vehicle', label: 'Heavy Vehicle (HV)' },
  { licenseClass: 'light_vehicle', label: 'Light Vehicle (LV)' },
  { licenseClass: 'dual_purpose', label: 'Dual Purpose (DP)' },
]);

export const DUTY_STATUS_BADGES = Object.freeze({
  [DRIVER_DUTY_STATUSES.ACTIVE]: { status: 'active', label: 'Active' },
  [DRIVER_DUTY_STATUSES.ON_LEAVE]: { status: 'delayed', label: 'On leave' },
  [DRIVER_DUTY_STATUSES.SUSPENDED]: { status: 'cancelled', label: 'Suspended' },
});

export const DUTY_STATUS_FILTERS = Object.freeze([
  { label: 'All drivers', dutyStatus: '' },
  { label: 'Active', dutyStatus: DRIVER_DUTY_STATUSES.ACTIVE },
  { label: 'On leave', dutyStatus: DRIVER_DUTY_STATUSES.ON_LEAVE },
  { label: 'Suspended', dutyStatus: DRIVER_DUTY_STATUSES.SUSPENDED },
]);

/** The two tabs on the Transport Data page. */
export const TRANSPORT_TABS = Object.freeze([
  { key: 'buses', label: 'Buses' },
  { key: 'drivers', label: 'Drivers' },
]);

/**
 * Finds the wording for a licence class.
 * @param {string} licenseClass - Stored licence class value.
 * @returns {string} Readable label.
 */
export function describeLicenseClass(licenseClass) {
  const matchingClass = LICENSE_CLASSES.find(
    (candidateClass) => candidateClass.licenseClass === licenseClass
  );
  return matchingClass ? matchingClass.label : 'Not recorded';
}
