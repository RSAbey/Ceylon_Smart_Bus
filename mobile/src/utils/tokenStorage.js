// Stores the JWT in the device's secure storage (Keychain / Keystore) instead of plain AsyncStorage (NFR-07).
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from './constants';

/**
 * Reads the saved access token.
 * @returns {Promise<string | null>} The JWT, or null when nobody is signed in.
 */
export async function getAccessToken() {
  return SecureStore.getItemAsync(SECURE_STORE_KEYS.accessToken);
}

/**
 * Saves the access token after a successful sign-in.
 * @param {string} accessToken - JWT returned by POST /auth/login.
 * @returns {Promise<void>} Resolves once stored.
 */
export async function saveAccessToken(accessToken) {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.accessToken, accessToken);
}

/**
 * Removes the access token (sign-out or expired session).
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function clearAccessToken() {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.accessToken);
}
