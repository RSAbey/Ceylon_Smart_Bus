// API calls for the Transport Data page: the bus fleet and the driver roster (Members 01 and 02).
import apiClient from '../../services/apiClient';

/**
 * The bus fleet.
 * @param {object} [listOptions] - Query options.
 * @param {string} [listOptions.searchText] - Matches bus code, plate, name or model.
 * @param {string} [listOptions.status] - Narrows to one BUS_STATUSES value.
 * @returns {Promise<{buses: object[], totalCount: number}>} Buses with driver and route filled in.
 */
export async function fetchBuses({ searchText, status } = {}) {
  const busEnvelope = await apiClient.get('/admin/buses', {
    params: { search: searchText || undefined, status: status || undefined },
  });
  return busEnvelope.data;
}

/**
 * Registers a bus.
 * @param {object} busForm - Plate, name, model, capacity, status, GPS id and route.
 * @returns {Promise<object>} The created bus.
 */
export async function createBus(busForm) {
  const busEnvelope = await apiClient.post('/admin/buses', busForm);
  return busEnvelope.data;
}

/**
 * Updates a bus, including retiring it.
 * @param {string} busId - Bus to change.
 * @param {object} busChanges - Fields to change.
 * @returns {Promise<object>} The updated bus.
 */
export async function updateBus(busId, busChanges) {
  const busEnvelope = await apiClient.patch(`/admin/buses/${busId}`, busChanges);
  return busEnvelope.data;
}

/**
 * Deletes a bus.
 * @param {string} busId - Bus to remove.
 * @returns {Promise<void>} Resolves once removed.
 */
export async function deleteBus(busId) {
  await apiClient.delete(`/admin/buses/${busId}`);
}

/**
 * The driver roster, each row with their bus, route and delay-report count.
 * @param {object} [listOptions] - Query options.
 * @param {string} [listOptions.searchText] - Matches licence number or NIC.
 * @param {string} [listOptions.dutyStatus] - Narrows to one DRIVER_DUTY_STATUSES value.
 * @returns {Promise<{drivers: object[], totalCount: number}>} One page of drivers.
 */
export async function fetchDrivers({ searchText, dutyStatus } = {}) {
  const driverEnvelope = await apiClient.get('/admin/drivers', {
    params: { search: searchText || undefined, dutyStatus: dutyStatus || undefined },
  });
  return driverEnvelope.data;
}

/**
 * Registers a driver account.
 * @param {object} driverForm - Name, contact, licence details and password.
 * @returns {Promise<object>} The created driver.
 */
export async function createDriver(driverForm) {
  const driverEnvelope = await apiClient.post('/admin/drivers', driverForm);
  return driverEnvelope.data;
}

/**
 * Updates a driver's details, licence class or duty status.
 * @param {string} driverId - Driver to change.
 * @param {object} driverChanges - Fields to change.
 * @returns {Promise<object>} The updated driver.
 */
export async function updateDriver(driverId, driverChanges) {
  const driverEnvelope = await apiClient.patch(`/admin/drivers/${driverId}`, driverChanges);
  return driverEnvelope.data;
}

/**
 * Deletes a driver and the account behind it.
 * @param {string} driverId - Driver to remove.
 * @returns {Promise<void>} Resolves once removed.
 */
export async function deleteDriver(driverId) {
  await apiClient.delete(`/admin/drivers/${driverId}`);
}

/**
 * The buses that can be given to a driver, with who currently holds each one.
 * @returns {Promise<object[]>} Assignable buses.
 */
export async function fetchAssignableBuses() {
  const busEnvelope = await apiClient.get('/admin/drivers/assignable-buses');
  return busEnvelope.data.buses;
}

/**
 * Assigns a bus to a driver, or clears the assignment with a null busId.
 * @param {string} driverId - Driver to assign to.
 * @param {string | null} busId - Bus to assign, or null to unassign.
 * @returns {Promise<object>} The driver after the change.
 */
export async function assignBusToDriver(driverId, busId) {
  const driverEnvelope = await apiClient.patch(`/admin/drivers/${driverId}/bus`, { busId });
  return driverEnvelope.data;
}

/**
 * Active routes, for the "assign to route" pickers.
 * @returns {Promise<object[]>} Routes with their number and endpoints.
 */
export async function fetchRoutesForPicker() {
  const routeEnvelope = await apiClient.get('/routes');
  return routeEnvelope.data.routes.map((routeResult) => routeResult.route);
}
