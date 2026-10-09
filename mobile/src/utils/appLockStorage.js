// What the device remembers about the app lock (Member 01, NFR-07). The PIN itself is never stored
// here — only the server holds it, hashed. This is the two small facts the lock screen needs before
// the API can be reached: whether this account has a PIN at all, and how many wrong tries have been
// made. Both live in secure storage so they survive the app being closed and reopened.
import * as SecureStore from 'expo-secure-store';
import { APP_PIN_FLAG, SECURE_STORE_KEYS } from './constants';

const NO_FAILED_ATTEMPTS = 0;

/**
 * Whether this device knows the signed-in account has an app lock PIN.
 * @returns {Promise<boolean>} True when the lock should be shown on the next launch.
 */
export async function getIsAppPinSet() {
  const storedAnswer = await SecureStore.getItemAsync(SECURE_STORE_KEYS.isAppPinSet);
  return storedAnswer === APP_PIN_FLAG.yes;
}

/**
 * Records whether the account has a PIN, after the API has said so.
 * @param {boolean} isPinSet - True when the account has a PIN.
 * @returns {Promise<void>} Resolves once stored.
 */
export async function setIsAppPinSet(isPinSet) {
  await SecureStore.setItemAsync(
    SECURE_STORE_KEYS.isAppPinSet,
    isPinSet ? APP_PIN_FLAG.yes : APP_PIN_FLAG.no
  );
}

/**
 * How many wrong PINs have been typed since the last correct one.
 * @returns {Promise<number>} The count, 0 when nothing is stored.
 */
export async function getFailedPinAttempts() {
  const storedCount = await SecureStore.getItemAsync(SECURE_STORE_KEYS.failedPinAttempts);
  return Number(storedCount) || NO_FAILED_ATTEMPTS;
}

/**
 * Stores the running count of wrong PINs.
 * @param {number} attemptCount - Wrong tries so far.
 * @returns {Promise<void>} Resolves once stored.
 */
export async function setFailedPinAttempts(attemptCount) {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.failedPinAttempts, String(attemptCount));
}

/**
 * Starts the count again, after a correct PIN or once the lock is turned off.
 * @returns {Promise<void>} Resolves once stored.
 */
export async function resetFailedPinAttempts() {
  await setFailedPinAttempts(NO_FAILED_ATTEMPTS);
}

/**
 * Forgets everything about the lock. Called on sign-out, so the next account to sign in on this
 * phone is never judged by the previous one's lock.
 * @returns {Promise<void>} Resolves once cleared.
 */
export async function clearAppLockState() {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.isAppPinSet);
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.failedPinAttempts);
}
