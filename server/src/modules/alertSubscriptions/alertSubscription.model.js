// ALERT_SUBSCRIPTION table: which routes a passenger wants alerts for (resolves PASSENGER–ROUTE many-to-many).
const { Schema, model } = require('mongoose');
const { ALERT_TYPES } = require('./alertSubscription.constants');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const alertSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
    alertType: { type: String, enum: Object.values(ALERT_TYPES), default: ALERT_TYPES.BOTH },
    /** isActive: lets a passenger pause alerts without losing the subscription. */
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: buildToJsonOptions() }
);

/** One subscription per passenger per route. */
alertSubscriptionSchema.index({ userId: 1, routeId: 1 }, { unique: true });

module.exports = model('AlertSubscription', alertSubscriptionSchema);
