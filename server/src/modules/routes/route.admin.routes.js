// Admin route management mounted at /api/admin/routes (admin only) — Member 02, NFR-10.
const express = require('express');
const routeController = require('./route.controller');
const { createRouteValidationRules, updateRouteValidationRules } = require('./route.validation');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('../users/user.constants');

const routeAdminRouter = express.Router();

// Every admin endpoint needs a signed-in admin, so the guard is applied once for the whole router.
routeAdminRouter.use(authenticateToken, authorizeRoles(USER_ROLES.ADMIN));

routeAdminRouter.get('/', routeController.searchRoutes);
routeAdminRouter.get('/:routeId', routeController.getRouteDetails);
routeAdminRouter.post('/', createRouteValidationRules, validateRequest, routeController.createRoute);
routeAdminRouter.patch('/:routeId', updateRouteValidationRules, validateRequest, routeController.updateRoute);
routeAdminRouter.delete('/:routeId', routeController.deleteRoute);

module.exports = routeAdminRouter;
