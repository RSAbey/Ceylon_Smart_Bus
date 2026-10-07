// Admin dashboard endpoints mounted at /api/admin/dashboard (Member 04). Admin only.
const express = require('express');
const dashboardService = require('./dashboard.service');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const { USER_ROLES } = require('../users/user.constants');

const dashboardAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
dashboardAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

/**
 * GET /api/admin/dashboard/overview - the KPI cards.
 * @param {import('express').Request} _request - Unused.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getOverview(_request, response) {
  const overview = await dashboardService.getOverview();
  sendResponse(response, 'Overview loaded.', overview);
}

/**
 * GET /api/admin/dashboard/performance - the chart series.
 * @param {import('express').Request} _request - Unused.
 * @param {import('express').Response} response - Express response.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getPerformance(_request, response) {
  const performance = await dashboardService.getPerformance();
  sendResponse(response, 'Performance loaded.', performance);
}

dashboardAdminRouter.get('/overview', asyncHandler(getOverview));
dashboardAdminRouter.get('/performance', asyncHandler(getPerformance));

module.exports = dashboardAdminRouter;
