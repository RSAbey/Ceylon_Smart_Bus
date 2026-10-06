// API calls for the signed-in user's own profile (Member 01). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

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
 * Permanently deletes the signed-in user's own account.
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function deleteMyAccount() {
  await apiClient.delete('/users/me');
}
