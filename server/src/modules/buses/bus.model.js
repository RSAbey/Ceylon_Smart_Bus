// BUS table: a registered bus, optionally assigned to one driver and one route.
const { Schema, model } = require('mongoose');
const { BUS_STATUSES } = require('./bus.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const MIN_BUS_CAPACITY = 1;

const busSchema = new Schema(
  {
    /** busCode: short fleet code such as "BUS-014", generated on registration; unique. */
    busCode: { type: String, required: true, trim: true, uppercase: true, unique: true },
    /** plateNumber: Sri Lankan registration plate (for example "NB-1234"); unique. */
    plateNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    busName: { type: String, required: true, trim: true },
    /** model: the vehicle model, chosen from BUS_MODELS. */
    model: { type: String, trim: true },
    capacity: { type: Number, required: true, min: MIN_BUS_CAPACITY },
    /** gpsDeviceId: the tracker fitted to this bus, so a faulty unit can be traced to a vehicle. */
    gpsDeviceId: { type: String, trim: true },
    /** lastServicedAt: when the bus was last serviced, shown on the fleet table. */
    lastServicedAt: { type: Date },
    status: { type: String, enum: Object.values(BUS_STATUSES), default: BUS_STATUSES.ACTIVE },
    /** driverId: unique + sparse — a driver drives at most one bus, and a bus may have no driver yet. */
    driverId: { type: Schema.Types.ObjectId, ref: 'DriverProfile', unique: true, sparse: true },
    /** routeId: the route this bus currently serves (nullable). */
    routeId: { type: Schema.Types.ObjectId, ref: 'Route' },
  },
  { toJSON: buildToJsonOptions() }
);

module.exports = model('Bus', busSchema);
