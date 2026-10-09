// HTTP layer for admin driver management: reads the request, calls driver.service, sends the envelope.
const driverService = require('./driver.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * POST /api/admin/drivers — registers a driver account and its licence/NIC profile.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function registerDriver(request, response) {
  const { fullName, email, mobile, password, licenseNumber, nic, licenseClass } = request.body;
  const createdDriver = await driverService.registerDriver({
    fullName,
    email,
    mobile,
    password,
    licenseNumber,
    nic,
    licenseClass,
  });
  sendResponse(response, 'Driver registered.', createdDriver, HTTP_STATUS.CREATED);
}

/**
 * GET /api/admin/drivers — paged driver list.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listDrivers(request, response) {
  const { search, dutyStatus, page, pageSize } = request.query;
  const driverPage = await driverService.listDrivers({
    searchText: search,
    dutyStatus,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });
  sendResponse(response, 'Drivers loaded.', driverPage);
}

/**
 * GET /api/admin/drivers/:driverId — one driver with their account details.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getDriver(request, response) {
  const driverProfile = await driverService.getDriverById(request.params.driverId);
  sendResponse(response, 'Driver loaded.', driverProfile);
}

/**
 * PATCH /api/admin/drivers/:driverId — edits documents, name or account status.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function updateDriver(request, response) {
  const { fullName, licenseNumber, nic, status, licenseClass, dutyStatus, mobile, email } =
    request.body;
  const updatedDriver = await driverService.updateDriver(request.params.driverId, {
    fullName,
    licenseNumber,
    nic,
    status,
    licenseClass,
    dutyStatus,
    mobile,
    email,
  });
  sendResponse(response, 'Driver updated.', updatedDriver);
}

/**
 * DELETE /api/admin/drivers/:driverId — removes the driver and their account.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function deleteDriver(request, response) {
  await driverService.deleteDriver(request.params.driverId);
  sendResponse(response, 'Driver deleted.');
}

/**
 * GET /api/admin/drivers/assignable-buses - buses an admin can give to a driver.
 * @param {import('express').Request} _request - Unused.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listAssignableBuses(_request, response) {
  const buses = await driverService.listAssignableBuses();
  sendResponse(response, 'Assignable buses loaded.', { buses });
}

/**
 * PATCH /api/admin/drivers/:driverId/bus - assign a bus, or clear it with a null busId.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function assignBus(request, response) {
  const driverProfile = await driverService.assignBusToDriver(
    request.params.driverId,
    request.body.busId || null
  );
  sendResponse(
    response,
    request.body.busId ? 'Bus assigned to the driver.' : 'Bus assignment cleared.',
    driverProfile
  );
}

module.exports = {
  registerDriver: asyncHandler(registerDriver),
  listAssignableBuses: asyncHandler(listAssignableBuses),
  assignBus: asyncHandler(assignBus),
  listDrivers: asyncHandler(listDrivers),
  getDriver: asyncHandler(getDriver),
  updateDriver: asyncHandler(updateDriver),
  deleteDriver: asyncHandler(deleteDriver),
};
