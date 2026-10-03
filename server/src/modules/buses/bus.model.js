// BUS table: a registered bus, optionally assigned to one driver and one route.
const { Schema, model } = require('mongoose');
const { BUS_STATUSES } = require('./bus.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const MIN_BUS_CAPACITY = 1;

const busSchema = new Schema(
  {
    /** plateNumber: Sri Lankan registration plate (for example "NB-1234"); unique. */
    plateNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    busName: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: MIN_BUS_CAPACITY },
    status: { type: String, enum: Object.values(BUS_STATUSES), default: BUS_STATUSES.ACTIVE },
    /** driverId: unique + sparse — a driver drives at most one bus, and a bus may have no driver yet. */
    driverId: { type: Schema.Types.ObjectId, ref: 'DriverProfile', unique: true, sparse: true },
    /** routeId: the route this bus currently serves (nullable). */
    routeId: { type: Schema.Types.ObjectId, ref: 'Route' },
  },
  { toJSON: buildToJsonOptions() }
);

module.exports = model('Bus', busSchema);
