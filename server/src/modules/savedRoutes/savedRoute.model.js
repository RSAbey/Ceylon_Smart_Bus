// SAVED_ROUTE table: a passenger's bookmarked route (resolves the PASSENGER–ROUTE many-to-many).
const { Schema, model } = require('mongoose');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const savedRouteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: buildToJsonOptions() }
);

/** A passenger can save the same route only once. */
savedRouteSchema.index({ userId: 1, routeId: 1 }, { unique: true });

module.exports = model('SavedRoute', savedRouteSchema);
