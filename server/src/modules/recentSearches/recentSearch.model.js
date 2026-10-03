// RECENT_SEARCH table: journeys a passenger searched for, shown on the Home screen.
const { Schema, model } = require('mongoose');
const buildToJsonOptions = require('../../utils/toJsonOptions');

const recentSearchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** originText: optional because a search can start from the passenger's current location. */
    originText: { type: String, trim: true },
    destinationText: { type: String, required: true, trim: true },
    /** routeId: set when the search matched a specific route (nullable). */
    routeId: { type: Schema.Types.ObjectId, ref: 'Route' },
    searchedAt: { type: Date, default: Date.now },
  },
  { toJSON: buildToJsonOptions() }
);

module.exports = model('RecentSearch', recentSearchSchema);
