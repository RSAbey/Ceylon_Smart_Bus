// API calls for the administrator's own profile (Member 01). These are the ordinary /users/me
// endpoints every signed-in account uses, plus the activity figures only an admin has.
import apiClient from '../../services/apiClient';

/**
 * Saves changes to the signed-in administrator's own details.
 * @param {object} profileChanges - Any of fullName, email, mobile.
 * @returns {Promise<object>} The updated account.
 */
export async function updateMyProfile(profileChanges) {
  const profileEnvelope = await apiClient.patch('/users/me', profileChanges);
  return profileEnvelope.data;
}

/**
 * Changes the signed-in administrator's own password.
 * @param {object} passwordChange - currentPassword and newPassword.
 * @returns {Promise<void>} Resolves once the new password is stored.
 */
export async function changeMyPassword(passwordChange) {
  await apiClient.patch('/users/me/password', passwordChange);
}

/**
 * What this administrator has done: notifications sent, replies written, inquiries still theirs.
 * @returns {Promise<object>} The three figures.
 */
export async function fetchMyActivity() {
  const activityEnvelope = await apiClient.get('/admin/users/me/activity');
  return activityEnvelope.data;
}
