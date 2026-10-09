// Stores the JWT in the device's secure storage (Keychain / Keystore) instead of plain AsyncStorage (NFR-07).
import * as SecureStore from 'expo-secure-store';
import { REMEMBER_SESSION_FLAG, SECURE_STORE_KEYS } from './constants';

/**
 * Reads the saved access token.
 * @returns {Promise<string | null>} The JWT, or null when nobody is signed in.
 */
export async function getAccessToken() {
  return SecureStore.getItemAsync(SECURE_STORE_KEYS.accessToken);
}

/**
 * Saves the access token after a successful sign-in.
 * The token is always stored so API calls can use it; `shouldRemember` decides whether the next
 * app launch restores the session or asks the user to sign in again (the "Remember me" tick box).
 * @param {string} accessToken - JWT returned by POST /auth/login.
 * @param {boolean} [shouldRemember] - Whether to stay signed in after the app closes.
 * @returns {Promise<void>} Resolves once stored.
 */
export async function saveAccessToken(accessToken, shouldRemember = true) {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.accessToken, accessToken);
  await SecureStore.setItemAsync(
    SECURE_STORE_KEYS.shouldRememberSession,
    shouldRemember ? REMEMBER_SESSION_FLAG.yes : REMEMBER_SESSION_FLAG.no
  );
}

/**
 * Tells whether the stored session should be restored when the app starts.
 * @returns {Promise<boolean>} True when the user ticked Remember me.
 */
export async function getShouldRememberSession() {
  const storedFlag = await SecureStore.getItemAsync(SECURE_STORE_KEYS.shouldRememberSession);
  // Sessions created before this setting existed stay remembered.
  return storedFlag !== REMEMBER_SESSION_FLAG.no;
}

/**
 * Removes the access token (sign-out or expired session).
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function clearAccessToken() {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.accessToken);
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.shouldRememberSession);
}
