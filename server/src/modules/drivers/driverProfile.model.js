// DRIVER_PROFILE table: extra attributes that only users with role = driver have (ERD specialisation).
const { Schema, model } = require('mongoose');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const driverProfileSchema = new Schema(
  {
    /** userId: one profile per driver user (1:1 with USER). */
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    /** licenseNumber / nic: legal identifiers, each unique across all drivers. */
    licenseNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    nic: { type: String, required: true, trim: true, uppercase: true, unique: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: buildToJsonOptions() }
);

module.exports = model('DriverProfile', driverProfileSchema);
