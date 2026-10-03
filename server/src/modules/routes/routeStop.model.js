// ROUTE_STOP table: ordered stops of a route (weak entity of ROUTE).
const { Schema, model } = require('mongoose');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const FIRST_STOP_SEQUENCE = 1;

const routeStopSchema = new Schema(
  {
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
    stopName: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    /** stopSequence: 1 = first stop; unique within a route so the stop order is never ambiguous. */
    stopSequence: { type: Number, required: true, min: FIRST_STOP_SEQUENCE },
    /** fareFromOrigin: fare in LKR from the first stop to this stop (used to price a ticket segment). */
    fareFromOrigin: { type: Number, required: true, min: 0 },
  },
  { toJSON: buildToJsonOptions() }
);

routeStopSchema.index({ routeId: 1, stopSequence: 1 }, { unique: true });

module.exports = model('RouteStop', routeStopSchema);
