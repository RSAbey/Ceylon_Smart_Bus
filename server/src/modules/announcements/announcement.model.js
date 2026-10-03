// ANNOUNCEMENT table: a message an admin broadcasts to passengers of one route or of all routes.
const { Schema, model } = require('mongoose');
const { ANNOUNCEMENT_SEVERITIES, ANNOUNCEMENT_STATUSES } = require('./announcement.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const announcementSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** targetRouteId: null means the announcement goes to ALL passengers. */
    targetRouteId: { type: Schema.Types.ObjectId, ref: 'Route', default: null },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_SEVERITIES),
      default: ANNOUNCEMENT_SEVERITIES.INFO,
    },
    status: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_STATUSES),
      default: ANNOUNCEMENT_STATUSES.DRAFT,
    },
    /** publishedAt: set when the status becomes "published" (that is when notifications are created). */
    publishedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true, toJSON: buildToJsonOptions() }
);

module.exports = model('Announcement', announcementSchema);
