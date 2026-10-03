// Trip business logic. getOngoingTripForDriver is a shared contract used by Members 03 and 04.
const Trip = require('./trip.model');
const { TRIP_STATUSES } = require('./trip.constants');

/**
 * Finds the trip a driver is running right now (a partial unique index guarantees at most one).
 * @param {string} driverId - DriverProfile id (not the User id).
 * @returns {Promise<object | null>} The ongoing Trip document, or null when the driver is not on a trip.
 */
async function getOngoingTripForDriver(driverId) {
  return Trip.findOne({ driverId, status: TRIP_STATUSES.ONGOING });
}

module.exports = { getOngoingTripForDriver };
