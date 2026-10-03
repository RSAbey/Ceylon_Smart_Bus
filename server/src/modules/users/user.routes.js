// User endpoints mounted at /api/users (Member 01). Every route needs a signed-in user.
const express = require('express');
const userController = require('./user.controller');
const authenticateToken = require('../../middleware/authenticateToken');

const userRouter = express.Router();

userRouter.get('/me', authenticateToken, userController.getMyProfile);

/**
 * Planned scope for Member 01 (documented in docs/api/m01-accounts.md when built):
 * - View/edit own profile (R/U) and delete own account (D)
 */

module.exports = userRouter;
