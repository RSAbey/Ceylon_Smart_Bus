// Saved-route endpoints mounted at /api/saved-routes (Member 02). Signed-in passengers.
const express = require('express');
const { body } = require('express-validator');
const savedRouteController = require('./savedRoute.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const validateRequest = require('../../middleware/validateRequest');

const savedRouteRouter = express.Router();

savedRouteRouter.use(authenticateToken);

savedRouteRouter.get('/', savedRouteController.listSavedRoutes);
savedRouteRouter.post(
  '/',
  [body('routeId').isMongoId().withMessage('Choose a route to save.')],
  validateRequest,
  savedRouteController.saveRoute
);
savedRouteRouter.delete('/:savedRouteId', savedRouteController.removeSavedRoute);

module.exports = savedRouteRouter;
