// HTTP layer for admin bus management: reads the request, calls bus.service, sends the envelope.
const busService = require('./bus.service');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * POST /api/admin/buses — register a bus, optionally assigning a driver and route.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function registerBus(request, response) {
  const createdBus = await busService.registerBus(request.body);
  sendResponse(response, 'Bus registered.', createdBus, HTTP_STATUS.CREATED);
}

/**
 * GET /api/admin/buses — list buses with their driver and route.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function listBuses(request, response) {
  const busPage = await busService.listBuses({
    searchText: request.query.search,
    status: request.query.status,
  });
  sendResponse(response, 'Buses loaded.', busPage);
}

/**
 * GET /api/admin/buses/:busId — one bus.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getBus(request, response) {
  const matchingBus = await busService.getBusById(request.params.busId);
  sendResponse(response, 'Bus loaded.', matchingBus);
}

/**
 * PATCH /api/admin/buses/:busId — edit a bus or change its driver / route assignment.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function updateBus(request, response) {
  const updatedBus = await busService.updateBus(request.params.busId, request.body);
  sendResponse(response, 'Bus updated.', updatedBus);
}

/**
 * DELETE /api/admin/buses/:busId — remove a bus.
 * @param {import('express').Request} request - Express request.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function deleteBus(request, response) {
  await busService.deleteBus(request.params.busId);
  sendResponse(response, 'Bus deleted.');
}

module.exports = {
  registerBus: asyncHandler(registerBus),
  listBuses: asyncHandler(listBuses),
  getBus: asyncHandler(getBus),
  updateBus: asyncHandler(updateBus),
  deleteBus: asyncHandler(deleteBus),
};
