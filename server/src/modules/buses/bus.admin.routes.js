// Admin bus management mounted at /api/admin/buses (admin only) — Member 02.
const express = require('express');
const busController = require('./bus.controller');
const { registerBusValidationRules, updateBusValidationRules } = require('./bus.validation');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('../users/user.constants');

const busAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
busAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

busAdminRouter.post('/', registerBusValidationRules, validateRequest, busController.registerBus);
busAdminRouter.get('/', busController.listBuses);
busAdminRouter.get('/:busId', busController.getBus);
busAdminRouter.patch('/:busId', updateBusValidationRules, validateRequest, busController.updateBus);
busAdminRouter.delete('/:busId', busController.deleteBus);

module.exports = busAdminRouter;
