// Recent search business logic (Member 04): remembers the journeys a passenger looked up (FR-04 entry, NFR-05).
const RecentSearch = require('./recentSearch.model');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/** Only the latest few are useful on Home and the search screen, so older rows are trimmed away. */
const MAX_RECENT_SEARCHES_PER_USER = 10;

/**
 * Lists a passenger's recent searches, newest first.
 * @param {string} userId - Signed-in passenger.
 * @param {number} [limit] - How many to return.
 * @returns {Promise<object[]>} Recent searches.
 */
async function listRecentSearches(userId, limit = MAX_RECENT_SEARCHES_PER_USER) {
  return RecentSearch.find({ userId }).populate('routeId').sort({ searchedAt: -1 }).limit(limit);
}

/**
 * Records a journey the passenger searched for, replacing any identical earlier entry so the list
 * shows each journey once with its most recent time.
 * @param {string} userId - Signed-in passenger.
 * @param {object} searchDetails - What was searched.
 * @param {string} [searchDetails.originText] - Boarding stop typed.
 * @param {string} searchDetails.destinationText - Destination typed.
 * @param {string} [searchDetails.routeId] - Route chosen, when the search matched one.
 * @returns {Promise<object>} The stored search.
 */
async function recordRecentSearch(userId, { originText, destinationText, routeId }) {
  await RecentSearch.deleteMany({
    userId,
    originText: originText || null,
    destinationText,
  });
  const storedSearch = await RecentSearch.create({
    userId,
    originText: originText || undefined,
    destinationText,
    routeId: routeId || undefined,
    searchedAt: new Date(),
  });

  // Keep the list short so Home stays readable and the collection does not grow without limit.
  const allSearches = await RecentSearch.find({ userId }).sort({ searchedAt: -1 }).select('_id');
  const staleIds = allSearches.slice(MAX_RECENT_SEARCHES_PER_USER).map((staleSearch) => staleSearch.id);
  if (staleIds.length > 0) await RecentSearch.deleteMany({ _id: { $in: staleIds } });

  return storedSearch;
}

/**
 * Removes one recent search, refusing to touch another passenger's row.
 * @param {string} userId - Signed-in passenger.
 * @param {string} searchId - Row to remove.
 * @returns {Promise<void>} Resolves once removed.
 */
async function removeRecentSearch(userId, searchId) {
  const storedSearch = await RecentSearch.findById(searchId);
  if (!storedSearch) {
    throw new AppError('Recent search not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (String(storedSearch.userId) !== String(userId)) {
    throw new AppError('You can only remove your own searches.', HTTP_STATUS.FORBIDDEN);
  }
  await RecentSearch.findByIdAndDelete(searchId);
}

/**
 * Clears every recent search for a passenger (the "Clear all" link).
 * @param {string} userId - Signed-in passenger.
 * @returns {Promise<number>} How many rows were removed.
 */
async function clearRecentSearches(userId) {
  const removal = await RecentSearch.deleteMany({ userId });
  return removal.deletedCount;
}

module.exports = {
  listRecentSearches,
  recordRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
};
