// TICKET_VERIFICATION table: each check of a ticket by a driver (QR scan or typed ticket key).
const { Schema, model } = require('mongoose');
const { VERIFICATION_METHODS, VERIFICATION_RESULTS } = require('./verification.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const ticketVerificationSchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'DriverProfile', required: true },
    method: { type: String, enum: Object.values(VERIFICATION_METHODS), required: true },
    /** result: invalid attempts are stored too, so the transaction report shows every check. */
    result: { type: String, enum: Object.values(VERIFICATION_RESULTS), required: true },
    verifiedAt: { type: Date, default: Date.now },
  },
  { toJSON: buildToJsonOptions() }
);

module.exports = model('TicketVerification', ticketVerificationSchema);
