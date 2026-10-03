// PAYMENT table: the (mock) payment for a ticket; read by the admin finance page.
const { Schema, model } = require('mongoose');
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require('./payment.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const paymentSchema = new Schema(
  {
    /** ticketId: one payment per ticket. */
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    status: { type: String, enum: Object.values(PAYMENT_STATUSES), default: PAYMENT_STATUSES.PAID },
    paidAt: { type: Date, default: Date.now },
  },
  { toJSON: buildToJsonOptions() }
);

module.exports = model('Payment', paymentSchema);
