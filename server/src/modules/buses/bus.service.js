// Bus business logic (Member 02): registration and the driver / route assignments an admin manages.
const Bus = require('./bus.model');
const Trip = require('../trips/trip.model');
const DriverProfile = require('../drivers/driverProfile.model');
const Route = require('../routes/route.model');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const { BUS_STATUSES, BUS_CODE_PREFIX, BUS_CODE_DIGITS } = require('./bus.constants');
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
 * Builds the next fleet code, "BUS-014". Numbering continues from the highest code in use, so a
 * deleted bus never has its code handed to a different vehicle.
 * @returns {Promise<string>} An unused bus code.
 */
async function buildNextBusCode() {
  const highestCodedBus = await Bus.findOne({ busCode: { $exists: true } })
    .sort({ busCode: -1 })
    .select('busCode');
  const highestNumber = highestCodedBus ? Number(highestCodedBus.busCode.split('-')[1]) || 0 : 0;
  return `${BUS_CODE_PREFIX}-${String(highestNumber + 1).padStart(BUS_CODE_DIGITS, '0')}`;
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
    busCode: await buildNextBusCode(),
    plateNumber,
    busName: busDetails.busName.trim(),
    model: busDetails.model,
    capacity: busDetails.capacity,
    status: busDetails.status,
    gpsDeviceId: busDetails.gpsDeviceId ? busDetails.gpsDeviceId.trim() : undefined,
    lastServicedAt: busDetails.lastServicedAt,
    driverId: busDetails.driverId || undefined,
    routeId: busDetails.routeId || undefined,
  });
  return getBusById(createdBus.id);
}

/**
 * Lists buses for the admin dashboard.
 * @param {object} [listOptions] - Query options.
 * @param {string} [listOptions.searchText] - Matches bus code, plate number, name or model.
 * @param {string} [listOptions.status] - Narrows to one BUS_STATUSES value.
 * @returns {Promise<{buses: object[], totalCount: number}>} Buses with driver and route filled in.
 */
async function listBuses({ searchText, status } = {}) {
  const listFilter = {};
  if (status) listFilter.status = status;
  if (searchText) {
    const searchPattern = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    listFilter.$or = [
      { busCode: searchPattern },
      { plateNumber: searchPattern },
      { busName: searchPattern },
      { model: searchPattern },
    ];
  }
  const [buses, totalCount] = await Promise.all([
    Bus.find(listFilter)
      .populate({ path: 'driverId', populate: { path: 'userId' } })
      .populate('routeId')
      .sort({ busCode: 1 }),
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
  if (busChanges.model !== undefined) editableBus.model = busChanges.model;
  if (busChanges.capacity !== undefined) editableBus.capacity = busChanges.capacity;
  if (busChanges.gpsDeviceId !== undefined) {
    editableBus.gpsDeviceId = busChanges.gpsDeviceId ? busChanges.gpsDeviceId.trim() : undefined;
  }
  if (busChanges.lastServicedAt !== undefined) editableBus.lastServicedAt = busChanges.lastServicedAt;
  if (busChanges.status !== undefined) {
    await assertStatusChangeIsSafe(editableBus, busChanges.status);
    editableBus.status = busChanges.status;
    // A retired bus keeps no route or driver, or passengers would still be offered it.
    if (busChanges.status === BUS_STATUSES.RETIRED) {
      editableBus.routeId = undefined;
      editableBus.driverId = undefined;
    }
  }

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
 * Refuses to take a bus out of service while it is mid-route, because passengers are tracking it
 * and may hold tickets for that trip.
 * @param {object} bus - The bus being changed.
 * @param {string} nextStatus - The status the admin chose.
 * @returns {Promise<void>} Resolves when the change is safe.
 */
async function assertStatusChangeIsSafe(bus, nextStatus) {
  if (nextStatus === BUS_STATUSES.ACTIVE) return;
  const runningTripCount = await Trip.countDocuments({
    busId: bus.id,
    status: TRIP_STATUSES.ONGOING,
  });
  if (runningTripCount > 0) {
    throw new AppError(
      `${bus.busCode} is on a trip right now. End the trip before marking it ${nextStatus}.`,
      HTTP_STATUS.CONFLICT,
      [{ field: 'status', message: 'This bus is carrying passengers.' }]
    );
  }
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

module.exports = { getBusById, registerBus, listBuses, updateBus, deleteBus, buildNextBusCode };
