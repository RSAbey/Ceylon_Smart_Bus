// User business logic (Member 01): own profile read/update/delete, changing your own password,
// plus admin listing and blocking.
const bcrypt = require('bcryptjs');
const User = require('./user.model');
const { USER_ROLES } = require('./user.constants');
const { BCRYPT_SALT_ROUNDS } = require('../auth/auth.constants');
const { purgeUserAndOwnedData } = require('./accountPurge.service');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const DEFAULT_PAGE_SIZE = 20;
const FIRST_PAGE = 1;

/**
 * Loads a user's public profile.
 * @param {string} userId - Id of the user.
 * @returns {Promise<object>} The user document (passwordHash is never selected).
 */
async function getUserProfileById(userId) {
  const userProfile = await User.findById(userId);
  if (!userProfile) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }
  return userProfile;
}

/**
 * Rejects an email or mobile number already used by a different account.
 * @param {string} userId - The account being edited (excluded from the search).
 * @param {object} contactDetails - The new values.
 * @param {string} [contactDetails.email] - New email.
 * @param {string} [contactDetails.mobile] - New mobile number.
 * @returns {Promise<void>} Resolves when both are free.
 */
async function assertContactDetailsAreFreeForOthers(userId, { email, mobile }) {
  const contactFilters = [];
  if (email) contactFilters.push({ email });
  if (mobile) contactFilters.push({ mobile });
  if (contactFilters.length === 0) return;

  const conflictingAccounts = await User.find({ _id: { $ne: userId }, $or: contactFilters }).select('email mobile');
  const fieldErrors = [];
  if (email && conflictingAccounts.some((account) => account.email === email)) {
    fieldErrors.push({ field: 'email', message: 'Another account already uses this email address.' });
  }
  if (mobile && conflictingAccounts.some((account) => account.mobile === mobile)) {
    fieldErrors.push({ field: 'mobile', message: 'Another account already uses this mobile number.' });
  }
  if (fieldErrors.length > 0) {
    throw new AppError('These details belong to another account.', HTTP_STATUS.CONFLICT, fieldErrors);
  }
}

/**
 * Updates the signed-in user's own profile (Edit Profile screen).
 * @param {string} userId - Signed-in user.
 * @param {object} profileChanges - Fields the form submitted.
 * @param {string} [profileChanges.fullName] - New full name.
 * @param {string} [profileChanges.email] - New email.
 * @param {string} [profileChanges.mobile] - New mobile number.
 * @param {string} [profileChanges.avatarUrl] - New avatar URL.
 * @returns {Promise<object>} The updated profile.
 */
async function updateMyProfile(userId, profileChanges) {
  const emailAddress = profileChanges.email ? profileChanges.email.trim().toLowerCase() : undefined;
  const mobileNumber = profileChanges.mobile ? profileChanges.mobile.trim() : undefined;
  await assertContactDetailsAreFreeForOthers(userId, { email: emailAddress, mobile: mobileNumber });

  const editableProfile = await getUserProfileById(userId);
  if (profileChanges.fullName !== undefined) editableProfile.fullName = profileChanges.fullName.trim();
  if (emailAddress !== undefined) editableProfile.email = emailAddress;
  if (mobileNumber !== undefined) editableProfile.mobile = mobileNumber;
  if (profileChanges.avatarUrl !== undefined) editableProfile.avatarUrl = profileChanges.avatarUrl;

  await editableProfile.save();
  return editableProfile;
}

/**
 * Deletes the signed-in user's own account. A driver's profile row goes with it.
 * @param {string} userId - Signed-in user.
 * @param {string} password - Their current password, typed again to confirm.
 * @returns {Promise<void>} Resolves once removed.
 */
async function deleteMyAccount(userId, password) {
  const accountToDelete = await User.findById(userId).select('+passwordHash');
  if (!accountToDelete) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }
  // An admin deleting themselves would leave the dashboard unreachable.
  if (accountToDelete.role === USER_ROLES.ADMIN) {
    throw new AppError('Administrator accounts cannot be deleted from the app.', HTTP_STATUS.FORBIDDEN);
  }

  // Deleting everything is not undoable, so the password is asked for at the moment it happens —
  // a phone left unlocked on a table is not enough to wipe somebody's account.
  const isPasswordCorrect = await bcrypt.compare(password, accountToDelete.passwordHash);
  if (!isPasswordCorrect) {
    throw new AppError('That is not your password.', HTTP_STATUS.UNPROCESSABLE_ENTITY, [
      { field: 'password', message: 'That is not your password.' },
    ]);
  }

  await purgeUserAndOwnedData(userId);
}

/**
 * Lists accounts for the admin dashboard, newest first, with optional role/status/search filters.
 * @param {object} listOptions - Query-string options.
 * @param {string} [listOptions.role] - Filter by role.
 * @param {string} [listOptions.status] - Filter by status.
 * @param {string} [listOptions.searchText] - Matches name, email or mobile.
 * @param {number} [listOptions.page] - 1-based page number.
 * @param {number} [listOptions.pageSize] - Rows per page.
 * @returns {Promise<{users: object[], totalCount: number, page: number, pageSize: number}>} One page of accounts.
 */
async function listUsersForAdmin({ role, status, searchText, page = FIRST_PAGE, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const listFilter = {};
  if (role) listFilter.role = role;
  if (status) listFilter.status = status;
  if (searchText) {
    // Escape the input so a user typing "." or "*" cannot build their own regular expression.
    const safeSearchText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchPattern = new RegExp(safeSearchText, 'i');
    listFilter.$or = [{ fullName: searchPattern }, { email: searchPattern }, { mobile: searchPattern }];
  }

  const [users, totalCount] = await Promise.all([
    User.find(listFilter)
      .sort({ createdAt: -1 })
      .skip((page - FIRST_PAGE) * pageSize)
      .limit(pageSize),
    User.countDocuments(listFilter),
  ]);
  return { users, totalCount, page, pageSize };
}

/**
 * Blocks or unblocks an account from the admin dashboard.
 * @param {string} userId - Account to change.
 * @param {string} newStatus - One of USER_STATUSES.
 * @param {string} requestingAdminId - The admin performing the change.
 * @returns {Promise<object>} The updated account.
 */
async function setUserStatus(userId, newStatus, requestingAdminId) {
  // Blocking yourself would immediately lock you out of the dashboard.
  if (String(userId) === String(requestingAdminId)) {
    throw new AppError('You cannot change the status of your own account.', HTTP_STATUS.FORBIDDEN);
  }
  const accountToChange = await getUserProfileById(userId);
  accountToChange.status = newStatus;
  await accountToChange.save();
  return accountToChange;
}

/**
 * Changes the signed-in user's own password (NFR-07). The current password has to be given and is
 * checked against the stored hash, so a left-open session cannot be used to lock the owner out.
 * @param {string} userId - Signed-in user.
 * @param {object} passwordChange - The current and the new password.
 * @param {string} passwordChange.currentPassword - What they sign in with now.
 * @param {string} passwordChange.newPassword - What they want instead.
 * @returns {Promise<void>} Resolves once the new password is stored.
 */
async function changeMyPassword(userId, { currentPassword, newPassword }) {
  // passwordHash is select:false on the model, so it has to be asked for explicitly.
  const accountToChange = await User.findById(userId).select('+passwordHash');
  if (!accountToChange) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const isCurrentPasswordCorrect = await bcrypt.compare(
    currentPassword,
    accountToChange.passwordHash
  );
  if (!isCurrentPasswordCorrect) {
    // 422 rather than 401: the caller IS signed in, they have just mistyped. A 401 would log the
    // dashboard out from under them for a typo.
    throw new AppError('That is not your current password.', HTTP_STATUS.UNPROCESSABLE_ENTITY, [
      { field: 'currentPassword', message: 'That is not your current password.' },
    ]);
  }
  if (currentPassword === newPassword) {
    throw new AppError('Choose a password you are not already using.', HTTP_STATUS.CONFLICT, [
      { field: 'newPassword', message: 'Choose a password you are not already using.' },
    ]);
  }

  accountToChange.passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await accountToChange.save();
}

module.exports = {
  getUserProfileById,
  changeMyPassword,
  updateMyProfile,
  deleteMyAccount,
  listUsersForAdmin,
  setUserStatus,
};
