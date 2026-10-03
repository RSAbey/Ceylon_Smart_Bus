// Delay business logic. getActiveDelayMinutes is a shared contract used by Member 02's ETA calculation.
const DelayReport = require('./delayReport.model');
const { DELAY_REPORT_STATUSES } = require('./delay.constants');

const NO_DELAY_MINUTES = 0;

/**
 * Returns how many minutes the trip is currently delayed by, so the ETA of stops ahead can be increased (FR-08).
 * @param {string} tripId - Trip to check.
 * @returns {Promise<number>} Minutes of the active delay report, or 0 when there is none.
 */
async function getActiveDelayMinutes(tripId) {
  const activeDelayReport = await DelayReport.findOne({
    tripId,
    status: DELAY_REPORT_STATUSES.ACTIVE,
  }).select('delayMinutes');
  return activeDelayReport ? activeDelayReport.delayMinutes : NO_DELAY_MINUTES;
}

module.exports = { getActiveDelayMinutes };
