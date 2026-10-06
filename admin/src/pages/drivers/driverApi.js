// API calls for admin driver management (Member 01). The page never calls apiClient directly.
import apiClient from '../../services/apiClient';

/**
 * Loads a page of drivers.
 * @param {object} [listOptions] - Query options.
 * @param {string} [listOptions.searchText] - Matches licence number or NIC.
 * @returns {Promise<{drivers: object[], totalCount: number}>} Driver page.
 */
export async function fetchDrivers({ searchText } = {}) {
  const driverEnvelope = await apiClient.get('/admin/drivers', {
    params: searchText ? { search: searchText } : undefined,
  });
  return driverEnvelope.data;
}

/**
 * Registers a new driver account and profile.
 * @param {object} driverForm - Values from the register-driver modal.
 * @returns {Promise<object>} The created driver.
 */
export async function createDriver(driverForm) {
  const createEnvelope = await apiClient.post('/admin/drivers', driverForm);
  return createEnvelope.data;
}

/**
 * Updates a driver's name, documents or account status.
 * @param {string} driverId - DriverProfile id.
 * @param {object} driverChanges - Fields to change.
 * @returns {Promise<object>} The updated driver.
 */
export async function updateDriver(driverId, driverChanges) {
  const updateEnvelope = await apiClient.patch(`/admin/drivers/${driverId}`, driverChanges);
  return updateEnvelope.data;
}

/**
 * Deletes a driver and the user account behind it.
 * @param {string} driverId - DriverProfile id.
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function deleteDriver(driverId) {
  await apiClient.delete(`/admin/drivers/${driverId}`);
}
