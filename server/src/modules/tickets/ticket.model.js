// TICKET table: a passenger's digital ticket for one trip between two stops.
const { Schema, model } = require('mongoose');
const { TICKET_STATUSES } = require('./ticket.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const ticketSchema = new Schema(
  {
    /** ticketKey: human-readable key the driver can type when QR scanning fails; unique. */
    ticketKey: { type: String, required: true, trim: true, uppercase: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
    boardingStopId: { type: Schema.Types.ObjectId, ref: 'RouteStop', required: true },
    alightingStopId: { type: Schema.Types.ObjectId, ref: 'RouteStop', required: true },
    fareAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(TICKET_STATUSES), default: TICKET_STATUSES.ACTIVE },
    /** qrSignature: server signature inside the QR so a ticket cannot be forged or reused (NFR-07). */
    qrSignature: { type: String, required: true },
    /** validUntil: the ticket stays viewable offline until at least this time (NFR-04). */
    validUntil: { type: Date, required: true },
    cancelledAt: { type: Date },
  },
  { timestamps: true, toJSON: buildToJsonOptions() }
);

module.exports = model('Ticket', ticketSchema);
