// Bus business logic (Member 02): registration and the driver / route assignments an admin manages.
const Bus = require('./bus.model');
const Trip = require('../trips/trip.model');
const DriverProfile = require('../drivers/driverProfile.model');
const Route = require('../routes/route.model');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * Loads a bus with its driver and route filled in.
 * @param {string} busId - Bus to load.
 * @returns {Promise<object>} The populated bus.
 */
async function getBusById(busId) {
  const matchingBus = await Bus.findById(busId)
    .populate({ path: 'driverId', populate: { path: 'userId' } })
    .populate('routeId');
  if (!matchingBus) {
    throw new AppError('Bus not found.', HTTP_STATUS.NOT_FOUND);
  }
  return matchingBus;
}

/**
 * Checks that a driver exists and is not already assigned to a different bus.
 * The ERD enforces one bus per driver with a unique index; this gives a readable message first.
 * @param {string | null} driverId - DriverProfile id, or null to clear the assignment.
 * @param {string | null} busId - Bus being edited, excluded from the clash search.
 * @returns {Promise<void>} Resolves when the driver may be assigned.
 */
async function assertDriverIsAssignable(driverId, busId) {
  if (!driverId) return;
  const driverProfile = await DriverProfile.findById(driverId);
  if (!driverProfile) {
    throw new AppError('Driver not found.', HTTP_STATUS.NOT_FOUND, [
      { field: 'driverId', message: 'Choose a registered driver.' },
    ]);
  }
  const clashFilter = { driverId };
  if (busId) clashFilter._id = { $ne: busId };
  const busWithSameDriver = await Bus.findOne(clashFilter);
  if (busWithSameDriver) {
    throw new AppError('That driver already has a bus.', HTTP_STATUS.CONFLICT, [
      { field: 'driverId', message: `This driver is already assigned to ${busWithSameDriver.plateNumber}.` },
    ]);
  }
}

/**
 * Checks that a route exists before assigning a bus to it.
 * @param {string | null} routeId - Route id, or null to clear.
 * @returns {Promise<void>} Resolves when the route may be assigned.
 */
async function assertRouteExists(routeId) {
  if (!routeId) return;
  const matchingRoute = await Route.findById(routeId);
  if (!matchingRoute) {
    throw new AppError('Route not found.', HTTP_STATUS.NOT_FOUND, [
      { field: 'routeId', message: 'Choose an existing route.' },
    ]);
  }
}

/**
 * Registers a bus (admin only).
 * @param {object} busDetails - Plate, name, capacity, status and optional driver/route assignment.
 * @returns {Promise<object>} The created bus, populated.
 */
async function registerBus(busDetails) {
  const plateNumber = busDetails.plateNumber.trim().toUpperCase();
  const existingBus = await Bus.findOne({ plateNumber });
  if (existingBus) {
    throw new AppError('This bus is already registered.', HTTP_STATUS.CONFLICT, [
      { field: 'plateNumber', message: 'Another bus already uses this plate number.' },
    ]);
  }
  await assertDriverIsAssignable(busDetails.driverId, null);
  await assertRouteExists(busDetails.routeId);

  const createdBus = await Bus.create({
    plateNumber,
    busName: busDetails.busName.trim(),
    capacity: busDetails.capacity,
    status: busDetails.status,
    driverId: busDetails.driverId || undefined,
    routeId: busDetails.routeId || undefined,
  });
  return getBusById(createdBus.id);
}

/**
 * Lists buses for the admin dashboard.
 * @param {object} [listOptions] - Query options.
 * @param {string} [listOptions.searchText] - Matches plate number or bus name.
 * @returns {Promise<{buses: object[], totalCount: number}>} Buses with driver and route filled in.
 */
async function listBuses({ searchText } = {}) {
  const listFilter = {};
  if (searchText) {
    const searchPattern = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    listFilter.$or = [{ plateNumber: searchPattern }, { busName: searchPattern }];
  }
  const [buses, totalCount] = await Promise.all([
    Bus.find(listFilter)
      .populate({ path: 'driverId', populate: { path: 'userId' } })
      .populate('routeId')
      .sort({ plateNumber: 1 }),
    Bus.countDocuments(listFilter),
  ]);
  return { buses, totalCount };
}

/**
 * Updates a bus, including reassigning its driver or route (admin only).
 * @param {string} busId - Bus to update.
 * @param {object} busChanges - Fields to change; `driverId`/`routeId` of null clear the assignment.
 * @returns {Promise<object>} The updated bus, populated.
 */
async function updateBus(busId, busChanges) {
  const editableBus = await Bus.findById(busId);
  if (!editableBus) {
    throw new AppError('Bus not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (busChanges.plateNumber) {
    const plateNumber = busChanges.plateNumber.trim().toUpperCase();
    if (plateNumber !== editableBus.plateNumber) {
      const clashingBus = await Bus.findOne({ plateNumber });
      if (clashingBus) {
        throw new AppError('This plate number is taken.', HTTP_STATUS.CONFLICT, [
          { field: 'plateNumber', message: 'Another bus already uses this plate number.' },
        ]);
      }
      editableBus.plateNumber = plateNumber;
    }
  }
  if (busChanges.busName !== undefined) editableBus.busName = busChanges.busName.trim();
  if (busChanges.capacity !== undefined) editableBus.capacity = busChanges.capacity;
  if (busChanges.status !== undefined) editableBus.status = busChanges.status;

  if (busChanges.driverId !== undefined) {
    await assertDriverIsAssignable(busChanges.driverId, busId);
    editableBus.driverId = busChanges.driverId || undefined;
  }
  if (busChanges.routeId !== undefined) {
    await assertRouteExists(busChanges.routeId);
    editableBus.routeId = busChanges.routeId || undefined;
  }
  await editableBus.save();
  return getBusById(busId);
}

/**
 * Deletes a bus (admin only), unless it is currently running a trip.
 * @param {string} busId - Bus to delete.
 * @returns {Promise<void>} Resolves once removed.
 */
async function deleteBus(busId) {
  const runningTripCount = await Trip.countDocuments({ busId, status: TRIP_STATUSES.ONGOING });
  if (runningTripCount > 0) {
    throw new AppError(
      'This bus is on a trip right now. End the trip before deleting the bus.',
      HTTP_STATUS.CONFLICT
    );
  }
  await Bus.findByIdAndDelete(busId);
}

module.exports = { getBusById, registerBus, listBuses, updateBus, deleteBus };
