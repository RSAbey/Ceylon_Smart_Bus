// Verification endpoints mounted at /api/verification (Member 03). Drivers only: these check a
// passenger's ticket on board and mark it used.
const express = require('express');
const { body } = require('express-validator');
const verificationController = require('./verification.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/authorizeRoles');
const validateRequest = require('../../middleware/validateRequest');
const { USER_ROLES } = require('../users/user.constants');

const verificationRouter = express.Router();

verificationRouter.use(authenticateToken, authorizeRoles(USER_ROLES.DRIVER));

verificationRouter.get('/mine', verificationController.listMyVerifications);
verificationRouter.post(
  '/',
  [
    body('ticketKey').trim().notEmpty().withMessage('Scan a QR code or type the ticket code.'),
    // Present only for a scan; typing the code by hand is the documented fallback (NFR-06).
    body('qrSignature').optional().trim().notEmpty().withMessage('That QR code is not readable.'),
  ],
  validateRequest,
  verificationController.verifyTicket
);

module.exports = verificationRouter;
