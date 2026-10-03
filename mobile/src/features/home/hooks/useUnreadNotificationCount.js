// Unread notification count for the Alerts tab dot and the header bell (Member 04).

const NO_UNREAD_NOTIFICATIONS = 0;

/**
 * Returns how many notifications the signed-in passenger has not read.
 * Foundation stub: always 0. Member 04 replaces the body with usePolling(NOTIFICATION_POLL_INTERVAL_MS)
 * calling GET /notifications/unread-count, keeping this signature so the tab layout does not change.
 * @returns {number} Unread notification count.
 */
export default function useUnreadNotificationCount() {
  return NO_UNREAD_NOTIFICATIONS;
}
