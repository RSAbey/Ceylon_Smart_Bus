// NOTIFICATION table: one in-app notification for one user (delay, bus approaching, ticket, announcement...).
const { Schema, model } = require('mongoose');
const { NOTIFICATION_TYPES } = require('./notification.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    /** routeId / tripId / delayReportId / announcementId: optional links so the app can deep-link to the source. */
    routeId: { type: Schema.Types.ObjectId, ref: 'Route' },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
    delayReportId: { type: Schema.Types.ObjectId, ref: 'DelayReport' },
    announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: buildToJsonOptions() }
);

/** Supports the unread badge and the newest-first feed for one user. */
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = model('Notification', notificationSchema);
