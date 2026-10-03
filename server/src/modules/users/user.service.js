// User business logic (Member 01).
const User = require('./user.model');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

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

module.exports = { getUserProfileById };
