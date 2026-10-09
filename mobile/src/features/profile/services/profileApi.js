// API calls for the signed-in user's own profile (Member 01). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/** The axios option that carries a request body on a DELETE. */
const REQUEST_BODY_OPTION = 'data';

/**
 * Loads the signed-in user's profile.
 * @returns {Promise<object>} The user profile.
 */
export async function fetchMyProfile() {
  const profileEnvelope = await apiClient.get('/users/me');
  return profileEnvelope.data;
}

/**
 * Saves changes from the Edit Profile screen.
 * @param {object} profileChanges - Fields to update (fullName, email, mobile).
 * @returns {Promise<object>} The updated profile.
 */
export async function updateMyProfile(profileChanges) {
  const updateEnvelope = await apiClient.patch('/users/me', profileChanges);
  return updateEnvelope.data;
}

/**
 * Changes the signed-in user's own password.
 * @param {object} passwordChange - What the screen collected.
 * @param {string} passwordChange.currentPassword - The password they sign in with now.
 * @param {string} passwordChange.newPassword - The password to store.
 * @returns {Promise<void>} Resolves once the new password is stored.
 */
export async function changeMyPassword({ currentPassword, newPassword }) {
  await apiClient.patch('/users/me/password', { currentPassword, newPassword });
}

/**
 * Permanently deletes the signed-in user's own account and everything it owns.
 * @param {string} password - Their password, typed again to confirm.
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function deleteMyAccount(password) {
  // axios calls the request body "data" on a DELETE, and our naming rule bans that word as an
  // identifier, so the key is written through a constant instead of inline.
  await apiClient.delete('/users/me', { [REQUEST_BODY_OPTION]: { password } });
}

/**
 * The signed-in driver's own record: account, licence, assigned bus and completed trips.
 * @returns {Promise<object>} Driver profile summary.
 */
export async function fetchDriverProfile() {
  const profileEnvelope = await apiClient.get('/trips/driver-profile');
  return profileEnvelope.data;
}
