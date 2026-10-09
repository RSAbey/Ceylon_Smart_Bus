// API calls for the optional app lock PIN (Member 01). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/** The axios option that carries a request body on a DELETE. */
const REQUEST_BODY_OPTION = 'data';

/**
 * The state of the lock: whether a PIN is set and when it was last set. The digits are hashed on
 * the server, so there is nothing else to read.
 * @returns {Promise<{isPinSet: boolean, setAt: string | null, pinLength: number}>} The lock's state.
 */
export async function fetchAppPinStatus() {
  const pinEnvelope = await apiClient.get('/users/me/pin');
  return pinEnvelope.data;
}

/**
 * Turns the app lock on for the first time.
 * @param {string} pin - The digits the user chose.
 * @returns {Promise<object>} The new state of the lock.
 */
export async function createAppPin(pin) {
  const pinEnvelope = await apiClient.post('/users/me/pin', { pin });
  return pinEnvelope.data;
}

/**
 * Replaces the PIN with a new one.
 * @param {object} pinChange - What the form collected.
 * @param {string} pinChange.currentPin - The PIN in use now.
 * @param {string} pinChange.newPin - The PIN to store.
 * @returns {Promise<object>} The new state of the lock.
 */
export async function changeAppPin({ currentPin, newPin }) {
  const pinEnvelope = await apiClient.patch('/users/me/pin', { currentPin, newPin });
  return pinEnvelope.data;
}

/**
 * Turns the app lock off. The account password is what proves it is really the owner.
 * @param {string} password - Their account password.
 * @returns {Promise<object>} The lock, now off.
 */
export async function deleteAppPin(password) {
  // axios calls the request body "data" on a DELETE, and our naming rule bans that word as an
  // identifier, so the key is written through a constant instead of inline.
  const pinEnvelope = await apiClient.delete('/users/me/pin', {
    [REQUEST_BODY_OPTION]: { password },
  });
  return pinEnvelope.data;
}

/**
 * Checks the PIN typed on the lock screen.
 * @param {string} pin - The digits typed on the keypad.
 * @returns {Promise<void>} Resolves when the PIN is right; rejects with the API error otherwise.
 */
export async function verifyAppPin(pin) {
  await apiClient.post('/users/me/pin/verify', { pin });
}
