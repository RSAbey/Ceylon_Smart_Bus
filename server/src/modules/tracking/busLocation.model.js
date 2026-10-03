// BUS_LOCATION table: GPS pings posted by the driver app every few seconds during a trip.
const { Schema, model } = require('mongoose');
const buildToJsonOptions = require('../../utils/toJsonOptions');

/** Pings older than 24 hours are deleted automatically to keep the free Atlas tier small. */
const BUS_LOCATION_RETENTION_SECONDS = 24 * 60 * 60;

const busLocationSchema = new Schema(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speedKmh: { type: Number, min: 0 },
    recordedAt: { type: Date, default: Date.now },
  },
  { toJSON: buildToJsonOptions() }
);

busLocationSchema.index({ tripId: 1, recordedAt: -1 });
busLocationSchema.index({ recordedAt: 1 }, { expireAfterSeconds: BUS_LOCATION_RETENTION_SECONDS });

module.exports = model('BusLocation', busLocationSchema);
