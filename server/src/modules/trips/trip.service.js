// Trip business logic (Member 02): a driver starting and ending a run on their assigned bus.
// getOngoingTripForDriver is a shared contract used by Members 03 and 04.
const Trip = require('./trip.model');
const Bus = require('../buses/bus.model');
const DriverProfile = require('../drivers/driverProfile.model');
const RouteStop = require('../routes/routeStop.model');
const ticketService = require('../tickets/ticket.service');
const { TRIP_STATUSES } = require('./trip.constants');
const { BUS_STATUSES } = require('../buses/bus.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * Finds the trip a driver is running right now (a partial unique index guarantees at most one).
 * @param {string} driverId - DriverProfile id (not the User id).
 * @returns {Promise<object | null>} The ongoing Trip document, or null when the driver is not on a trip.
 */
async function getOngoingTripForDriver(driverId) {
  return Trip.findOne({ driverId, status: TRIP_STATUSES.ONGOING });
}

/**
 * Translates a signed-in driver's user id into their DriverProfile.
 * @param {string} userId - Signed-in user.
 * @returns {Promise<object>} The driver profile.
 */
async function getDriverProfileForUser(userId) {
  const driverProfile = await DriverProfile.findOne({ userId });
  if (!driverProfile) {
    throw new AppError('No driver profile is linked to your account.', HTTP_STATUS.FORBIDDEN);
  }
  return driverProfile;
}

/**
 * The bus assigned to a driver, with its route.
 * @param {string} driverId - DriverProfile id.
 * @returns {Promise<object | null>} The assigned bus, or null when none is assigned.
 */
async function getAssignedBus(driverId) {
  return Bus.findOne({ driverId }).populate('routeId');
}

/**
 * Starts a trip on the driver's assigned bus and route.
 * @param {string} userId - Signed-in driver's user id.
 * @returns {Promise<object>} The new trip, populated with bus and route.
 */
async function startTrip(userId) {
  const driverProfile = await getDriverProfileForUser(userId);

  const alreadyRunning = await getOngoingTripForDriver(driverProfile.id);
  if (alreadyRunning) {
    throw new AppError('You already have a trip running. End it before starting another.', HTTP_STATUS.CONFLICT);
  }

  const assignedBus = await getAssignedBus(driverProfile.id);
  if (!assignedBus) {
    throw new AppError('No bus is assigned to you yet. Ask an administrator.', HTTP_STATUS.CONFLICT);
  }
  if (!assignedBus.routeId) {
    throw new AppError('Your bus has no route assigned yet. Ask an administrator.', HTTP_STATUS.CONFLICT);
  }
  if (assignedBus.status === BUS_STATUSES.MAINTENANCE) {
    throw new AppError('Your bus is marked as under maintenance.', HTTP_STATUS.CONFLICT);
  }

  const startedTrip = await Trip.create({
    busId: assignedBus.id,
    routeId: assignedBus.routeId.id,
    driverId: driverProfile.id,
    startedAt: new Date(),
  });
  return startedTrip.populate(['busId', 'routeId']);
}

/**
 * Ends the driver's ongoing trip.
 * @param {string} userId - Signed-in driver's user id.
 * @param {string} [endStatus] - TRIP_STATUSES.COMPLETED (default) or CANCELLED.
 * @returns {Promise<object>} The finished trip.
 */
async function endTrip(userId, endStatus = TRIP_STATUSES.COMPLETED) {
  const driverProfile = await getDriverProfileForUser(userId);
  const runningTrip = await getOngoingTripForDriver(driverProfile.id);
  if (!runningTrip) {
    throw new AppError('You do not have a trip running.', HTTP_STATUS.NOT_FOUND);
  }
  runningTrip.status = endStatus;
  runningTrip.endedAt = new Date();
  await runningTrip.save();
  return runningTrip;
}

/**
 * Everything the driver's Trip screen needs: assigned bus, route, ordered stops and the running trip.
 * @param {string} userId - Signed-in driver's user id.
 * @returns {Promise<object>} Trip screen details.
 */
async function getDriverTripOverview(userId) {
  const driverProfile = await getDriverProfileForUser(userId);
  const assignedBus = await getAssignedBus(driverProfile.id);
  const runningTrip = await getOngoingTripForDriver(driverProfile.id);
  const stops = assignedBus?.routeId
    ? await RouteStop.find({ routeId: assignedBus.routeId.id }).sort({ stopSequence: 1 })
    : [];

  // How many passengers are aboard on a ticket, shown on the driver's Live screen.
  const passengerCount = runningTrip
    ? (await ticketService.getActiveTicketHolderIds(runningTrip.id)).length
    : 0;

  return {
    driverId: driverProfile.id,
    bus: assignedBus,
    route: assignedBus?.routeId || null,
    stops,
    trip: runningTrip,
    isTripRunning: Boolean(runningTrip),
    isAcceptingBookings: runningTrip ? runningTrip.isAcceptingBookings : null,
    passengerCount,
  };
}

/**
 * The driver's own record, for the Profile screen: who they are, the documents an administrator
 * registered them with, the bus they drive, and how many runs they have completed.
 * Only facts the data model already holds are returned; nothing is estimated.
 * @param {string} userId - Signed-in driver's user id.
 * @returns {Promise<object>} Driver profile summary.
 */
async function getDriverProfileSummary(userId) {
  const driverProfile = await DriverProfile.findOne({ userId }).populate(
    'userId',
    'fullName email mobile role status createdAt'
  );
  if (!driverProfile) {
    throw new AppError('No driver profile is linked to your account.', HTTP_STATUS.FORBIDDEN);
  }

  const [assignedBus, completedTripCount, ongoingTrip] = await Promise.all([
    Bus.findOne({ driverId: driverProfile.id }).populate('routeId', 'routeNumber origin destination'),
    Trip.countDocuments({ driverId: driverProfile.id, status: TRIP_STATUSES.COMPLETED }),
    getOngoingTripForDriver(driverProfile.id),
  ]);

  return {
    driverId: driverProfile.id,
    account: driverProfile.userId,
    licenseNumber: driverProfile.licenseNumber,
    nic: driverProfile.nic,
    registeredAt: driverProfile.createdAt,
    bus: assignedBus,
    route: assignedBus?.routeId || null,
    completedTripCount,
    isTripRunning: Boolean(ongoingTrip),
  };
}

module.exports = {
  getOngoingTripForDriver,
  getDriverProfileForUser,
  startTrip,
  endTrip,
  getDriverTripOverview,
  getDriverProfileSummary,
};
