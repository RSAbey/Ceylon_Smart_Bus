// DRIVER_PROFILE table: extra attributes that only users with role = driver have (ERD specialisation).
const { Schema, model } = require('mongoose');
const { LICENSE_CLASSES, DRIVER_DUTY_STATUSES } = require('./driver.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const driverProfileSchema = new Schema(
  {
    /** userId: one profile per driver user (1:1 with USER). */
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    /** licenseNumber / nic: legal identifiers, each unique across all drivers. */
    licenseNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    nic: { type: String, required: true, trim: true, uppercase: true, unique: true },
    /** licenseClass: what the licence entitles them to drive. */
    licenseClass: {
      type: String,
      enum: Object.values(LICENSE_CLASSES),
      default: LICENSE_CLASSES.HEAVY_VEHICLE,
    },
    /** dutyStatus: available, on leave, or suspended. Separate from the USER account status. */
    dutyStatus: {
      type: String,
      enum: Object.values(DRIVER_DUTY_STATUSES),
      default: DRIVER_DUTY_STATUSES.ACTIVE,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: buildToJsonOptions() }
);

module.exports = model('DriverProfile', driverProfileSchema);
