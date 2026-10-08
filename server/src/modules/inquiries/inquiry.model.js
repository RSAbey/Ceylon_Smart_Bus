// INQUIRY table: a support question or complaint from a passenger or driver.
const { Schema, model } = require('mongoose');
const { INQUIRY_PRIORITIES, INQUIRY_TAGS, INQUIRY_STATUSES } = require('./inquiry.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const inquirySchema = new Schema(
  {
    /** userId: passenger or driver who wrote it; edit/delete is allowed only within 5 minutes (service rule). */
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: Object.values(INQUIRY_PRIORITIES),
      default: INQUIRY_PRIORITIES.MEDIUM,
    },
    tag: { type: String, enum: Object.values(INQUIRY_TAGS), required: true },
    /** routeId / busId / driverId: optional links to what the inquiry is about. */
    routeId: { type: Schema.Types.ObjectId, ref: 'Route' },
    busId: { type: Schema.Types.ObjectId, ref: 'Bus' },
    driverId: { type: Schema.Types.ObjectId, ref: 'DriverProfile' },
    status: { type: String, enum: Object.values(INQUIRY_STATUSES), default: INQUIRY_STATUSES.OPEN },
    /** assigneeId: the admin dealing with it; absent while it waits in the unassigned queue. */
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date },
  },
  { timestamps: true, toJSON: buildToJsonOptions() }
);

inquirySchema.index({ userId: 1, createdAt: -1 });

module.exports = model('Inquiry', inquirySchema);
