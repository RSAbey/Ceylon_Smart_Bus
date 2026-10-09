// The optional app-lock PIN (Member 01, NFR-07): four digits that lock the mobile app on a phone the
// owner has chosen to stay signed in on. It is not a second password — the JWT is what the API
// trusts — so this guards the screens, not the account. The PIN is bcrypt hashed like the password,
// which is why it can be checked and changed but never read back out.
const bcrypt = require('bcryptjs');
const User = require('./user.model');
const { APP_PIN_LENGTH } = require('./user.constants');
const { BCRYPT_SALT_ROUNDS } = require('../auth/auth.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const WRONG_PIN_MESSAGE = 'That is not your PIN.';

/**
 * Loads the account with its PIN hash, which the model hides by default.
 * @param {string} userId - Signed-in user.
 * @param {boolean} [alsoNeedsPassword] - True when the caller has to check the account password too.
 * @returns {Promise<object>} The user document.
 */
async function loadAccountWithPin(userId, alsoNeedsPassword = false) {
  const fieldsToAdd = alsoNeedsPassword ? '+appPinHash +passwordHash' : '+appPinHash';
  const matchingAccount = await User.findById(userId).select(fieldsToAdd);
  if (!matchingAccount) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }
  return matchingAccount;
}

/**
 * Reads the state of the lock: this is the "view" of the PIN. The digits themselves are hashed and
 * are not returned to anybody, which is the whole point of hashing them.
 * @param {string} userId - Signed-in user.
 * @returns {Promise<{isPinSet: boolean, setAt: Date | null, pinLength: number}>} What the App lock screen shows.
 */
async function getAppPinStatus(userId) {
  const matchingAccount = await loadAccountWithPin(userId);
  return {
    isPinSet: Boolean(matchingAccount.appPinHash),
    setAt: matchingAccount.appPinSetAt || null,
    pinLength: APP_PIN_LENGTH,
  };
}

/**
 * Turns the lock on for the first time.
 * @param {string} userId - Signed-in user.
 * @param {string} pin - The digits the user chose.
 * @returns {Promise<{isPinSet: boolean, setAt: Date, pinLength: number}>} The new state of the lock.
 */
async function createAppPin(userId, pin) {
  const accountToLock = await loadAccountWithPin(userId);
  if (accountToLock.appPinHash) {
    // Creating over an existing PIN would let anyone holding an unlocked phone replace it silently.
    throw new AppError(
      'An app lock PIN is already set. Change it instead.',
      HTTP_STATUS.CONFLICT,
      [{ field: 'pin', message: 'You already have a PIN. Change it instead.' }]
    );
  }

  accountToLock.appPinHash = await bcrypt.hash(pin, BCRYPT_SALT_ROUNDS);
  accountToLock.appPinSetAt = new Date();
  await accountToLock.save();
  return {
    isPinSet: true,
    setAt: accountToLock.appPinSetAt,
    pinLength: APP_PIN_LENGTH,
  };
}

/**
 * Replaces the PIN, which needs the current one.
 * @param {string} userId - Signed-in user.
 * @param {object} pinChange - What the App lock screen collected.
 * @param {string} pinChange.currentPin - The PIN in use now.
 * @param {string} pinChange.newPin - The PIN to store.
 * @returns {Promise<{isPinSet: boolean, setAt: Date, pinLength: number}>} The new state of the lock.
 */
async function changeAppPin(userId, { currentPin, newPin }) {
  const accountToChange = await loadAccountWithPin(userId);
  if (!accountToChange.appPinHash) {
    throw new AppError('You do not have an app lock PIN yet.', HTTP_STATUS.NOT_FOUND);
  }

  const isCurrentPinCorrect = await bcrypt.compare(currentPin, accountToChange.appPinHash);
  if (!isCurrentPinCorrect) {
    // 422, never 401: a mistyped PIN must not sign the user out of a session they already hold.
    throw new AppError('That is not your current PIN.', HTTP_STATUS.UNPROCESSABLE_ENTITY, [
      { field: 'currentPin', message: 'That is not your current PIN.' },
    ]);
  }
  if (currentPin === newPin) {
    throw new AppError('Choose a PIN you are not already using.', HTTP_STATUS.CONFLICT, [
      { field: 'newPin', message: 'Choose a PIN you are not already using.' },
    ]);
  }

  accountToChange.appPinHash = await bcrypt.hash(newPin, BCRYPT_SALT_ROUNDS);
  accountToChange.appPinSetAt = new Date();
  await accountToChange.save();
  return {
    isPinSet: true,
    setAt: accountToChange.appPinSetAt,
    pinLength: APP_PIN_LENGTH,
  };
}

/**
 * Turns the lock off. The account password is asked for rather than the PIN, because switching a
 * lock off is the dangerous direction, and because it is the way back in for someone who has
 * forgotten their PIN.
 * @param {string} userId - Signed-in user.
 * @param {string} password - Their account password.
 * @returns {Promise<{isPinSet: boolean, setAt: null, pinLength: number}>} The lock, now off.
 */
async function deleteAppPin(userId, password) {
  const accountToUnlock = await loadAccountWithPin(userId, true);
  if (!accountToUnlock.appPinHash) {
    throw new AppError('You do not have an app lock PIN yet.', HTTP_STATUS.NOT_FOUND);
  }

  const isPasswordCorrect = await bcrypt.compare(password, accountToUnlock.passwordHash);
  if (!isPasswordCorrect) {
    throw new AppError('That is not your password.', HTTP_STATUS.UNPROCESSABLE_ENTITY, [
      { field: 'password', message: 'That is not your password.' },
    ]);
  }

  accountToUnlock.appPinHash = undefined;
  accountToUnlock.appPinSetAt = undefined;
  await accountToUnlock.save();
  return { isPinSet: false, setAt: null, pinLength: APP_PIN_LENGTH };
}

/**
 * Checks the PIN typed on the lock screen.
 * @param {string} userId - Signed-in user.
 * @param {string} pin - The digits typed on the keypad.
 * @returns {Promise<void>} Resolves when the PIN is right; throws otherwise.
 */
async function verifyAppPin(userId, pin) {
  const accountToUnlock = await loadAccountWithPin(userId);
  if (!accountToUnlock.appPinHash) {
    // Nothing to unlock: the lock was switched off on another device since this app last looked.
    throw new AppError('You do not have an app lock PIN yet.', HTTP_STATUS.NOT_FOUND);
  }

  const isPinCorrect = await bcrypt.compare(pin, accountToUnlock.appPinHash);
  if (!isPinCorrect) {
    // 422 again: the session is valid, the digits were wrong. A 401 would end the session itself.
    throw new AppError(WRONG_PIN_MESSAGE, HTTP_STATUS.UNPROCESSABLE_ENTITY, [
      { field: 'pin', message: WRONG_PIN_MESSAGE },
    ]);
  }
}

module.exports = {
  getAppPinStatus,
  createAppPin,
  changeAppPin,
  deleteAppPin,
  verifyAppPin,
};
