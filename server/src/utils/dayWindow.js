// Day boundaries shared by the admin charts. The Performance series and the Finance trend both
// group by whole days, so they have to agree on where a day starts and how a day is labelled.

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Midnight at the start of the day this many days ago, used as the lower bound of a chart window.
 * @param {number} daysAgo - How many days back to start.
 * @returns {Date} Start of that day.
 */
function startOfDaysAgo(daysAgo) {
  const startDate = new Date(Date.now() - daysAgo * MILLISECONDS_PER_DAY);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
}

/**
 * Formats a date as YYYY-MM-DD, the key the charts group by.
 * @param {Date} dayDate - The day to label.
 * @returns {string} ISO date without the time.
 */
function toDayKey(dayDate) {
  return dayDate.toISOString().slice(0, 10);
}

module.exports = { MILLISECONDS_PER_DAY, startOfDaysAgo, toDayKey };
