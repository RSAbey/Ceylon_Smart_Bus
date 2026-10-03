// TRIP table: one run of a bus on a route by a driver; holds the latest known position for fast reads.
const { Schema, model } = require('mongoose');
const { TRIP_STATUSES } = require('./trip.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const tripSchema = new Schema(
  {
    busId: { type: Schema.Types.ObjectId, ref: 'Bus', required: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'DriverProfile', required: true },
    status: { type: String, enum: Object.values(TRIP_STATUSES), default: TRIP_STATUSES.ONGOING },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    /** lastLatitude / lastLongitude / lastLocationAt: copy of the newest BusLocation so passengers poll one document. */
    lastLatitude: { type: Number },
    lastLongitude: { type: Number },
    lastLocationAt: { type: Date },
  },
  { toJSON: buildToJsonOptions() }
);

/** A driver and a bus can each have only ONE ongoing trip at a time. */
const ONGOING_TRIP_INDEX_OPTIONS = Object.freeze({
  unique: true,
  partialFilterExpression: { status: TRIP_STATUSES.ONGOING },
});
tripSchema.index({ driverId: 1 }, { ...ONGOING_TRIP_INDEX_OPTIONS });
tripSchema.index({ busId: 1 }, { ...ONGOING_TRIP_INDEX_OPTIONS });

module.exports = model('Trip', tripSchema);
