// API calls for alerts and alert settings (Member 04). Screens never call apiClient directly.
import apiClient from '../../../services/apiClient';

/**
 * The signed-in user's alert feed.
 * @param {object} [feedFilters] - Optional type, isRead and page.
 * @returns {Promise<object>} notifications, unreadCount, totalCount and hasMore.
 */
export async function fetchNotifications(feedFilters = {}) {
  const feedEnvelope = await apiClient.get('/notifications', { params: feedFilters });
  return feedEnvelope.data;
}

/**
 * The unread count for the bell badge.
 * @returns {Promise<number>} How many alerts are unread.
 */
export async function fetchUnreadCount() {
  const countEnvelope = await apiClient.get('/notifications/unread-count');
  return countEnvelope.data.unreadCount;
}

/**
 * Marks one alert as read.
 * @param {string} notificationId - Alert to mark.
 * @returns {Promise<object>} The updated alert.
 */
export async function markNotificationRead(notificationId) {
  const alertEnvelope = await apiClient.patch(`/notifications/${notificationId}/read`);
  return alertEnvelope.data;
}

/**
 * Marks every unread alert as read.
 * @returns {Promise<number>} How many were marked.
 */
export async function markAllNotificationsRead() {
  const alertEnvelope = await apiClient.patch('/notifications/read-all');
  return alertEnvelope.data.markedCount;
}

/**
 * Dismisses one alert.
 * @param {string} notificationId - Alert to remove.
 * @returns {Promise<void>} Resolves once removed.
 */
export async function dismissNotification(notificationId) {
  await apiClient.delete(`/notifications/${notificationId}`);
}

/**
 * Clears the alerts already read, leaving unread ones alone.
 * @returns {Promise<number>} How many were cleared.
 */
export async function clearReadNotifications() {
  const alertEnvelope = await apiClient.delete('/notifications');
  return alertEnvelope.data.clearedCount;
}

/**
 * The passenger's per-route alert settings.
 * @returns {Promise<object[]>} Subscriptions with their route.
 */
export async function fetchAlertSubscriptions() {
  const subscriptionEnvelope = await apiClient.get('/alert-subscriptions');
  return subscriptionEnvelope.data.subscriptions;
}

/**
 * Turns alerts on for a route.
 * @param {object} subscriptionDetails - routeId and optional alertType.
 * @returns {Promise<object>} The stored subscription.
 */
export async function subscribeToRouteAlerts(subscriptionDetails) {
  const subscriptionEnvelope = await apiClient.post('/alert-subscriptions', subscriptionDetails);
  return subscriptionEnvelope.data;
}

/**
 * Changes the alert type, or pauses and resumes alerts for a route.
 * @param {string} subscriptionId - Subscription to change.
 * @param {object} subscriptionChanges - alertType and/or isActive.
 * @returns {Promise<object>} The updated subscription.
 */
export async function updateAlertSubscription(subscriptionId, subscriptionChanges) {
  const subscriptionEnvelope = await apiClient.patch(
    `/alert-subscriptions/${subscriptionId}`,
    subscriptionChanges
  );
  return subscriptionEnvelope.data;
}

/**
 * Stops alerts for a route entirely.
 * @param {string} subscriptionId - Subscription to remove.
 * @returns {Promise<void>} Resolves once removed.
 */
export async function unsubscribeFromRouteAlerts(subscriptionId) {
  await apiClient.delete(`/alert-subscriptions/${subscriptionId}`);
}
