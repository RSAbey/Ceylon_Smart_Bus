// DELAY_REPORT table: a delay reported by a driver on an ongoing trip (FR-08).
const { Schema, model } = require('mongoose');
const {
  DELAY_REASONS,
  DELAY_REPORT_STATUSES,
  MIN_DELAY_MINUTES,
  MAX_DELAY_MINUTES,
} = require('./delay.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

/**
 * The reason "other" is meaningless without an explanation, so it requires a note (PROJECT_PLAN.md 3.3).
 * @this {object} The delay report being validated.
 * @returns {boolean} True when reasonNote must be supplied.
 */
function isReasonNoteRequired() {
  return this.reason === DELAY_REASONS.OTHER;
}

const delayReportSchema = new Schema(
  {
    /** tripId: must point to an ONGOING trip (checked in delay.service). */
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'DriverProfile', required: true },
    reason: { type: String, enum: Object.values(DELAY_REASONS), required: true },
    reasonNote: {
      type: String,
      trim: true,
      required: [isReasonNoteRequired, 'Please describe the reason when choosing "Other".'],
    },
    delayMinutes: { type: Number, required: true, min: MIN_DELAY_MINUTES, max: MAX_DELAY_MINUTES },
    status: {
      type: String,
      enum: Object.values(DELAY_REPORT_STATUSES),
      default: DELAY_REPORT_STATUSES.ACTIVE,
    },
    /** adminNote / reviewedBy: filled when an admin acknowledges the report. */
    adminNote: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true, toJSON: buildToJsonOptions() }
);

/** Only one ACTIVE delay per trip; a second submit updates the active one instead. */
delayReportSchema.index(
  { tripId: 1 },
  { unique: true, partialFilterExpression: { status: DELAY_REPORT_STATUSES.ACTIVE } }
);

module.exports = model('DelayReport', delayReportSchema);
