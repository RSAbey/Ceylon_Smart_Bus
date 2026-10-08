// API calls for the Passengers page (Member 01): the roster, one passenger's record, and blocking.
import apiClient from '../../services/apiClient';

/**
 * The passenger roster with the counts above the table.
 * @param {object} [listFilters] - List filters.
 * @param {string} [listFilters.status] - One USER_STATUSES value.
 * @param {string} [listFilters.searchText] - Matches the name, email or mobile number.
 * @returns {Promise<{passengers: object[], summary: object}>} Passengers and the summary.
 */
export async function fetchPassengers({ status, searchText } = {}) {
  const passengerEnvelope = await apiClient.get('/admin/users/passengers', {
    params: { status: status || undefined, search: searchText || undefined },
  });
  return passengerEnvelope.data;
}

/**
 * One passenger's record: totals, latest tickets and anything they are waiting to hear about.
 * @param {string} passengerId - The passenger to open.
 * @returns {Promise<object>} The passenger profile.
 */
export async function fetchPassengerProfile(passengerId) {
  const profileEnvelope = await apiClient.get(`/admin/users/passengers/${passengerId}`);
  return profileEnvelope.data;
}

/**
 * Blocks or unblocks an account. A blocked account is refused at sign-in even with a valid token.
 * @param {string} passengerId - The account to change.
 * @param {string} status - A USER_STATUSES value.
 * @returns {Promise<object>} The updated account.
 */
export async function setPassengerStatus(passengerId, status) {
  const statusEnvelope = await apiClient.patch(`/admin/users/${passengerId}/status`, { status });
  return statusEnvelope.data;
}
