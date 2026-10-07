// Alert-subscription business logic (Member 04): which routes a passenger wants alerts about, and
// who should be told when something happens on a route (FR-03, FR-08).
const AlertSubscription = require('./alertSubscription.model');
const Route = require('../routes/route.model');
const { ALERT_TYPES } = require('./alertSubscription.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const ROUTE_SUMMARY_FIELDS = 'routeNumber routeName origin destination';

/**
 * The passenger's alert settings, one row per subscribed route.
 * @param {string} userId - Signed-in passenger.
 * @returns {Promise<object[]>} Subscriptions with their route.
 */
async function listSubscriptions(userId) {
  return AlertSubscription.find({ userId })
    .sort({ createdAt: -1 })
    .populate('routeId', ROUTE_SUMMARY_FIELDS);
}

/**
 * Subscribes to alerts for a route, or updates the type when already subscribed, so the toggle
 * never fails on a second tap.
 * @param {string} userId - Signed-in passenger.
 * @param {object} subscriptionDetails - routeId and the wanted alertType.
 * @returns {Promise<object>} The stored subscription.
 */
async function subscribe(userId, subscriptionDetails) {
  const matchingRoute = await Route.findById(subscriptionDetails.routeId);
  if (!matchingRoute) {
    throw new AppError('Route not found.', HTTP_STATUS.NOT_FOUND);
  }

  const existingSubscription = await AlertSubscription.findOne({
    userId,
    routeId: subscriptionDetails.routeId,
  });
  if (existingSubscription) {
    existingSubscription.alertType = subscriptionDetails.alertType || existingSubscription.alertType;
    existingSubscription.isActive = true;
    await existingSubscription.save();
    return existingSubscription.populate('routeId', ROUTE_SUMMARY_FIELDS);
  }

  const createdSubscription = await AlertSubscription.create({
    userId,
    routeId: subscriptionDetails.routeId,
    alertType: subscriptionDetails.alertType || ALERT_TYPES.BOTH,
  });
  return createdSubscription.populate('routeId', ROUTE_SUMMARY_FIELDS);
}

/**
 * Loads the passenger's own subscription, refusing to touch another passenger's.
 * @param {string} userId - Signed-in passenger.
 * @param {string} subscriptionId - Subscription to load.
 * @returns {Promise<object>} The subscription document.
 */
async function getOwnSubscription(userId, subscriptionId) {
  const matchingSubscription = await AlertSubscription.findById(subscriptionId);
  if (!matchingSubscription) {
    throw new AppError('Alert setting not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (String(matchingSubscription.userId) !== String(userId)) {
    throw new AppError('You can only change your own alert settings.', HTTP_STATUS.FORBIDDEN);
  }
  return matchingSubscription;
}

/**
 * Changes the alert type, or pauses and resumes alerts without losing the subscription.
 * @param {string} userId - Signed-in passenger.
 * @param {string} subscriptionId - Subscription to change.
 * @param {object} subscriptionChanges - alertType and/or isActive.
 * @returns {Promise<object>} The updated subscription.
 */
async function updateSubscription(userId, subscriptionId, subscriptionChanges) {
  const editableSubscription = await getOwnSubscription(userId, subscriptionId);
  if (subscriptionChanges.alertType !== undefined) {
    editableSubscription.alertType = subscriptionChanges.alertType;
  }
  if (subscriptionChanges.isActive !== undefined) {
    editableSubscription.isActive = subscriptionChanges.isActive;
  }
  await editableSubscription.save();
  return editableSubscription.populate('routeId', ROUTE_SUMMARY_FIELDS);
}

/**
 * Removes a subscription entirely.
 * @param {string} userId - Signed-in passenger.
 * @param {string} subscriptionId - Subscription to remove.
 * @returns {Promise<void>} Resolves once removed.
 */
async function unsubscribe(userId, subscriptionId) {
  await getOwnSubscription(userId, subscriptionId);
  await AlertSubscription.findByIdAndDelete(subscriptionId);
}

/**
 * The passengers who asked to hear about a route, used when a delay or announcement happens.
 * Paused subscriptions, and passengers who only wanted the other alert type, are left out.
 * @param {string} routeId - Route the event is on.
 * @param {string} wantedAlertType - ALERT_TYPES.APPROACHING or ALERT_TYPES.DELAY.
 * @returns {Promise<string[]>} Distinct user ids as strings.
 */
async function getSubscriberUserIds(routeId, wantedAlertType) {
  const subscriberUserIds = await AlertSubscription.distinct('userId', {
    routeId,
    isActive: true,
    alertType: { $in: [wantedAlertType, ALERT_TYPES.BOTH] },
  });
  return subscriberUserIds.map(String);
}

module.exports = {
  listSubscriptions,
  subscribe,
  updateSubscription,
  unsubscribe,
  getSubscriberUserIds,
};
