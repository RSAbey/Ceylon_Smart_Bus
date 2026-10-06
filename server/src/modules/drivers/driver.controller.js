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
  const { fullName, email, mobile, password, licenseNumber, nic } = request.body;
  const createdDriver = await driverService.registerDriver({
    fullName,
    email,
    mobile,
    password,
    licenseNumber,
    nic,
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
  const { search, page, pageSize } = request.query;
  const driverPage = await driverService.listDrivers({
    searchText: search,
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
  const { fullName, licenseNumber, nic, status } = request.body;
  const updatedDriver = await driverService.updateDriver(request.params.driverId, {
    fullName,
    licenseNumber,
    nic,
    status,
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

module.exports = {
  registerDriver: asyncHandler(registerDriver),
  listDrivers: asyncHandler(listDrivers),
  getDriver: asyncHandler(getDriver),
  updateDriver: asyncHandler(updateDriver),
  deleteDriver: asyncHandler(deleteDriver),
};
