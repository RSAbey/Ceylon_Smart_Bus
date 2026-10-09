// Driver business logic (Member 01). Drivers never self-register: an admin creates the account and its profile.
const bcrypt = require('bcryptjs');
const DriverProfile = require('./driverProfile.model');
const Bus = require('../buses/bus.model');
const Trip = require('../trips/trip.model');
const DelayReport = require('../delays/delayReport.model');
const { BUS_STATUSES } = require('../buses/bus.constants');
const { TRIP_STATUSES } = require('../trips/trip.constants');
const { DELAY_REPORT_STATUSES } = require('../delays/delay.constants');
const { DRIVER_DUTY_STATUSES } = require('./driver.constants');
const { USER_STATUSES } = require('../users/user.constants');
const User = require('../users/user.model');
const { USER_ROLES } = require('../users/user.constants');
const { BCRYPT_SALT_ROUNDS } = require('../auth/auth.constants');
const { purgeUserAndOwnedData } = require('../users/accountPurge.service');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const DEFAULT_PAGE_SIZE = 20;
const FIRST_PAGE = 1;

/**
 * Loads a driver profile with its linked user account.
 * @param {string} driverId - DriverProfile id.
 * @returns {Promise<object>} The populated profile.
 */
async function getDriverById(driverId) {
  const driverProfile = await DriverProfile.findById(driverId).populate('userId');
  if (!driverProfile) {
    throw new AppError('Driver not found.', HTTP_STATUS.NOT_FOUND);
  }
  return driverProfile;
}

/**
 * Rejects a licence number or NIC that another driver already holds.
 * @param {string | null} driverId - Driver being edited, or null when creating.
 * @param {object} documentNumbers - The values to check.
 * @param {string} [documentNumbers.licenseNumber] - Driving licence number.
 * @param {string} [documentNumbers.nic] - National identity card number.
 * @returns {Promise<void>} Resolves when both are free.
 */
async function assertDriverDocumentsAreFree(driverId, { licenseNumber, nic }) {
  const documentFilters = [];
  if (licenseNumber) documentFilters.push({ licenseNumber });
  if (nic) documentFilters.push({ nic });
  if (documentFilters.length === 0) return;

  const conflictFilter = { $or: documentFilters };
  if (driverId) conflictFilter._id = { $ne: driverId };

  const conflictingProfiles = await DriverProfile.find(conflictFilter).select('licenseNumber nic');
  const fieldErrors = [];
  if (licenseNumber && conflictingProfiles.some((profile) => profile.licenseNumber === licenseNumber)) {
    fieldErrors.push({ field: 'licenseNumber', message: 'Another driver already has this licence number.' });
  }
  if (nic && conflictingProfiles.some((profile) => profile.nic === nic)) {
    fieldErrors.push({ field: 'nic', message: 'Another driver already has this NIC.' });
  }
  if (fieldErrors.length > 0) {
    throw new AppError('These driver documents are already registered.', HTTP_STATUS.CONFLICT, fieldErrors);
  }
}

/**
 * Registers a driver: creates the user account (role = driver) and the DriverProfile that holds their documents.
 * @param {object} driverDetails - Values from the admin's "Register driver" form.
 * @param {string} driverDetails.fullName - Driver's full name.
 * @param {string} driverDetails.email - Email address.
 * @param {string} driverDetails.mobile - Mobile number.
 * @param {string} driverDetails.password - Initial password the admin hands over.
 * @param {string} driverDetails.licenseNumber - Driving licence number.
 * @param {string} driverDetails.nic - National identity card number.
 * @param {string} [driverDetails.licenseClass] - What the licence entitles them to drive.
 * @returns {Promise<object>} The created profile with its user populated.
 */
async function registerDriver({
  fullName,
  email,
  mobile,
  password,
  licenseNumber,
  nic,
  licenseClass,
}) {
  const emailAddress = email.trim().toLowerCase();
  const mobileNumber = mobile.trim();
  const licenceCode = licenseNumber.trim().toUpperCase();
  const nicCode = nic.trim().toUpperCase();

  await assertDriverDocumentsAreFree(null, { licenseNumber: licenceCode, nic: nicCode });

  const existingAccount = await User.findOne({ $or: [{ email: emailAddress }, { mobile: mobileNumber }] }).select(
    'email mobile'
  );
  if (existingAccount) {
    const conflictField = existingAccount.email === emailAddress ? 'email' : 'mobile';
    throw new AppError('This account already exists.', HTTP_STATUS.CONFLICT, [
      { field: conflictField, message: `An account already uses this ${conflictField}.` },
    ]);
  }

  const driverUser = await User.create({
    fullName: fullName.trim(),
    email: emailAddress,
    mobile: mobileNumber,
    passwordHash: await bcrypt.hash(password, BCRYPT_SALT_ROUNDS),
    role: USER_ROLES.DRIVER,
  });

  try {
    const createdProfile = await DriverProfile.create({
      userId: driverUser.id,
      licenseNumber: licenceCode,
      nic: nicCode,
      licenseClass,
    });
    return createdProfile.populate('userId');
  } catch (profileError) {
    // Without a profile the driver account is unusable, so do not leave a half-created driver behind.
    await User.findByIdAndDelete(driverUser.id);
    throw profileError;
  }
}

/**
 * Lists drivers for the admin dashboard, newest first.
 * @param {object} listOptions - Query-string options.
 * @param {string} [listOptions.searchText] - Matches licence number or NIC.
 * @param {string} [listOptions.dutyStatus] - Narrows to one DRIVER_DUTY_STATUSES value.
 * @param {number} [listOptions.page] - 1-based page number.
 * @param {number} [listOptions.pageSize] - Rows per page.
 * @returns {Promise<{drivers: object[], totalCount: number, page: number, pageSize: number}>} One page of drivers.
 */
async function listDrivers({
  searchText,
  dutyStatus,
  page = FIRST_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  const listFilter = {};
  if (dutyStatus) listFilter.dutyStatus = dutyStatus;
  if (searchText) {
    const safeSearchText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchPattern = new RegExp(safeSearchText, 'i');
    listFilter.$or = [{ licenseNumber: searchPattern }, { nic: searchPattern }];
  }

  const [drivers, totalCount] = await Promise.all([
    DriverProfile.find(listFilter)
      .populate('userId')
      .sort({ createdAt: -1 })
      .skip((page - FIRST_PAGE) * pageSize)
      .limit(pageSize),
    DriverProfile.countDocuments(listFilter),
  ]);

  // Each row shows the bus, the route it serves and how often this driver has reported a delay.
  const driverRows = await Promise.all(
    drivers.map(async (driverProfile) => {
      const [assignedBus, delayReportCount] = await Promise.all([
        Bus.findOne({ driverId: driverProfile.id }).populate(
          'routeId',
          'routeNumber origin destination'
        ),
        DelayReport.countDocuments({
          driverId: driverProfile.id,
          status: { $ne: DELAY_REPORT_STATUSES.CANCELLED },
        }),
      ]);
      return {
        driver: driverProfile,
        bus: assignedBus,
        route: assignedBus ? assignedBus.routeId : null,
        delayReportCount,
      };
    })
  );
  return { drivers: driverRows, totalCount, page, pageSize };
}

/**
 * Updates a driver's documents and/or the contact details on their user account.
 * @param {string} driverId - DriverProfile id.
 * @param {object} driverChanges - Fields the form submitted.
 * @returns {Promise<object>} The updated profile with its user populated.
 */
async function updateDriver(driverId, driverChanges) {
  const licenceCode = driverChanges.licenseNumber ? driverChanges.licenseNumber.trim().toUpperCase() : undefined;
  const nicCode = driverChanges.nic ? driverChanges.nic.trim().toUpperCase() : undefined;
  await assertDriverDocumentsAreFree(driverId, { licenseNumber: licenceCode, nic: nicCode });

  const driverProfile = await getDriverById(driverId);
  if (licenceCode !== undefined) driverProfile.licenseNumber = licenceCode;
  if (nicCode !== undefined) driverProfile.nic = nicCode;
  if (driverChanges.licenseClass !== undefined) {
    driverProfile.licenseClass = driverChanges.licenseClass;
  }
  if (driverChanges.dutyStatus !== undefined) {
    await assertDutyChangeIsSafe(driverProfile, driverChanges.dutyStatus);
    driverProfile.dutyStatus = driverChanges.dutyStatus;
  }
  await driverProfile.save();

  const driverUser = driverProfile.userId;
  if (driverChanges.fullName !== undefined) driverUser.fullName = driverChanges.fullName.trim();
  if (driverChanges.mobile !== undefined) driverUser.mobile = driverChanges.mobile.trim();
  if (driverChanges.email !== undefined) {
    driverUser.email = driverChanges.email.trim().toLowerCase();
  }
  if (driverChanges.status !== undefined) driverUser.status = driverChanges.status;
  // Suspending a driver must also stop them signing in, or the suspension is only on paper.
  if (driverChanges.dutyStatus === DRIVER_DUTY_STATUSES.SUSPENDED) {
    driverUser.status = USER_STATUSES.BLOCKED;
  } else if (driverChanges.dutyStatus === DRIVER_DUTY_STATUSES.ACTIVE) {
    driverUser.status = USER_STATUSES.ACTIVE;
  }
  await driverUser.save();

  return driverProfile;
}

/**
 * Refuses to take a driver off duty while they are mid-route, because passengers are tracking that
 * bus and the trip would be left running with nobody responsible for it.
 * @param {object} driverProfile - The driver being changed.
 * @param {string} nextDutyStatus - The duty status the admin chose.
 * @returns {Promise<void>} Resolves when the change is safe.
 */
async function assertDutyChangeIsSafe(driverProfile, nextDutyStatus) {
  if (nextDutyStatus === DRIVER_DUTY_STATUSES.ACTIVE) return;
  const runningTripCount = await Trip.countDocuments({
    driverId: driverProfile.id,
    status: TRIP_STATUSES.ONGOING,
  });
  if (runningTripCount > 0) {
    throw new AppError(
      'This driver is on a trip right now. The trip must end before they go off duty.',
      HTTP_STATUS.CONFLICT,
      [{ field: 'dutyStatus', message: 'This driver is carrying passengers.' }]
    );
  }
}

/**
 * The buses an admin can offer when assigning one to a driver: everything still in service, with
 * the route it serves and whether another driver already has it.
 * @returns {Promise<object[]>} Assignable buses.
 */
async function listAssignableBuses() {
  const buses = await Bus.find({ status: { $ne: BUS_STATUSES.RETIRED } })
    .populate('routeId', 'routeNumber origin destination')
    .populate({ path: 'driverId', populate: { path: 'userId', select: 'fullName' } })
    .sort({ busCode: 1 });

  return buses.map((candidateBus) => ({
    id: candidateBus.id,
    busCode: candidateBus.busCode,
    plateNumber: candidateBus.plateNumber,
    capacity: candidateBus.capacity,
    status: candidateBus.status,
    route: candidateBus.routeId || null,
    currentDriverName: candidateBus.driverId ? candidateBus.driverId.userId.fullName : null,
  }));
}

/**
 * Assigns a bus to a driver, or clears the assignment when busId is null. A bus carries one driver,
 * so taking a bus from another driver moves it; the dialog warns about that before confirming.
 * @param {string} driverId - DriverProfile id.
 * @param {string | null} busId - Bus to assign, or null to unassign.
 * @returns {Promise<object>} The driver profile after the change.
 */
async function assignBusToDriver(driverId, busId) {
  const driverProfile = await getDriverById(driverId);

  // Whatever happens, this driver ends up on at most one bus.
  await Bus.updateMany({ driverId: driverProfile.id }, { $unset: { driverId: '' } });
  if (!busId) return getDriverById(driverId);

  const chosenBus = await Bus.findById(busId);
  if (!chosenBus) {
    throw new AppError('Bus not found.', HTTP_STATUS.NOT_FOUND, [
      { field: 'busId', message: 'Choose a bus from the list.' },
    ]);
  }
  if (chosenBus.status === BUS_STATUSES.RETIRED) {
    throw new AppError('That bus is retired and cannot be assigned.', HTTP_STATUS.CONFLICT, [
      { field: 'busId', message: 'Choose a bus that is still in service.' },
    ]);
  }
  chosenBus.driverId = driverProfile.id;
  await chosenBus.save();
  return getDriverById(driverId);
}

/**
 * Deletes a driver: both the profile and the user account behind it.
 * @param {string} driverId - DriverProfile id.
 * @returns {Promise<void>} Resolves once removed.
 */
async function deleteDriver(driverId) {
  const driverProfile = await getDriverById(driverId);
  // The same clean-up the driver would get by deleting their own account: the bus goes back to the
  // pool and nothing is left pointing at an account that no longer exists.
  await purgeUserAndOwnedData(driverProfile.userId.id);
}

module.exports = {
  getDriverById,
  registerDriver,
  listDrivers,
  updateDriver,
  deleteDriver,
  listAssignableBuses,
  assignBusToDriver,
};
