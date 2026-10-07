// ROUTE table: a bus route such as "154 Malabe - Pettah" with its base fare.
const { Schema, model } = require('mongoose');
const { ROUTE_STATUSES } = require('./route.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const routeSchema = new Schema(
  {
    /** routeNumber: the number painted on the bus (for example "154"); unique. */
    routeNumber: { type: String, required: true, trim: true, unique: true },
    routeName: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    /** baseFare: minimum fare in LKR; admins edit it without code changes (NFR-10). */
    baseFare: { type: Number, required: true, min: 0 },
    /** perKmRate: used with baseFare when an admin reprices a route; stop fares stay authoritative. */
    perKmRate: { type: Number, min: 0 },
    /** serviceStartTime / serviceEndTime: "HH:MM" first and last departure of the day. */
    serviceStartTime: { type: String, trim: true },
    serviceEndTime: { type: String, trim: true },
    status: { type: String, enum: Object.values(ROUTE_STATUSES), default: ROUTE_STATUSES.ACTIVE },
  },
  // updatedAt is kept, so the edit dialog can say when the route was last changed.
  { timestamps: true, toJSON: buildToJsonOptions() }
);

module.exports = model('Route', routeSchema);
