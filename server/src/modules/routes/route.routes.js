// Passenger route endpoints mounted at /api/routes (Member 02). Signed-in passengers and drivers.
const express = require('express');
const routeController = require('./route.controller');
const authenticateToken = require('../../middleware/authenticateToken');

const routeRouter = express.Router();

routeRouter.use(authenticateToken);

routeRouter.get('/', routeController.searchRoutes);
routeRouter.get('/stop-names', routeController.listStopNames);
routeRouter.get('/:routeId', routeController.getRouteDetails);
routeRouter.get('/:routeId/stops/:stopId/connections', routeController.getStopConnections);

module.exports = routeRouter;
