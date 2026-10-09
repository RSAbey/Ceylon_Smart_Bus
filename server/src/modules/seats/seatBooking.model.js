// SEAT_BOOKING table: the seat held by a ticket on a trip.
const { Schema, model } = require('mongoose');
const { SEAT_BOOKING_STATUSES } = require('./seat.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const seatBookingSchema = new Schema(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    /** ticketId: a ticket reserves one or more seats (a family books 4C and 4D on one ticket). */
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    seatNumber: { type: String, required: true, trim: true, uppercase: true },
    /** status: cancelling a ticket sets "released" so the seat can be booked again. */
    status: {
      type: String,
      enum: Object.values(SEAT_BOOKING_STATUSES),
      default: SEAT_BOOKING_STATUSES.BOOKED,
    },
    bookedAt: { type: Date, default: Date.now },
  },
  { toJSON: buildToJsonOptions() }
);

/** A seat can be booked once per trip — only "booked" rows count, so released seats can be re-booked. */
seatBookingSchema.index(
  { tripId: 1, seatNumber: 1 },
  { unique: true, partialFilterExpression: { status: SEAT_BOOKING_STATUSES.BOOKED } }
);

/** Looking up the seats a ticket holds happens on every ticket screen. */
seatBookingSchema.index({ ticketId: 1 });

module.exports = model('SeatBooking', seatBookingSchema);
