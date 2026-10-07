// Alerts (Member 04, FR-03 and FR-08): the passenger's notification feed, newest first.
// Polls every 30 s so a delay reported while the screen is open shows up without a pull to refresh.
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { useToast } from '../../../components/ui/ToastMessage';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import usePolling from '../../../hooks/usePolling';
import { NOTIFICATION_POLL_INTERVAL_MS } from '../../../utils/constants';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import {
  clearReadNotifications,
  dismissNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationApi';
import {
  ALERTS_EMPTY,
  ALERT_FILTER_TABS,
  ALERT_MESSAGES,
  NOTIFICATION_STYLES,
  NOTIFICATION_TYPES,
} from '../constants';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/**
 * Turns a timestamp into "just now", "12 min ago", "3 h ago" or a date.
 * @param {string} createdAt - When the alert arrived.
 * @returns {string} Readable age.
 */
function formatAlertAge(createdAt) {
  const ageSeconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (ageSeconds < SECONDS_PER_MINUTE) return 'just now';
  const ageMinutes = Math.floor(ageSeconds / SECONDS_PER_MINUTE);
  if (ageMinutes < MINUTES_PER_HOUR) return `${ageMinutes} min ago`;
  const ageHours = Math.floor(ageMinutes / MINUTES_PER_HOUR);
  if (ageHours < HOURS_PER_DAY) return `${ageHours} h ago`;
  return new Date(createdAt).toLocaleDateString();
}

/**
 * The passenger's alert feed.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const drawer = useDrawer();
  const { showSuccessToast, showErrorToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isClearDialogVisible, setIsClearDialogVisible] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const refreshFeed = useCallback(() => {
    fetchNotifications(selectedType ? { type: selectedType } : {})
      .then((feed) => {
        setNotifications(feed.notifications);
        setUnreadCount(feed.unreadCount);
        setLoadErrorMessage('');
      })
      .catch((loadError) => setLoadErrorMessage(loadError.message))
      .finally(() => setIsLoading(false));
  }, [selectedType]);

  // A delay can be reported while the screen is open, so the feed refreshes itself.
  usePolling(refreshFeed, NOTIFICATION_POLL_INTERVAL_MS);

  /**
   * Switches tab. The spinner is turned on in this handler rather than inside an effect, because
   * React 19 treats a synchronous setState inside an effect as a cascading render.
   * @param {string} tabType - The tab's NOTIFICATION_TYPES value, or an empty string for All.
   * @returns {void}
   */
  function showAlertsOfType(tabType) {
    setIsLoading(true);
    setSelectedType(tabType);
  }

  /**
   * Opens what the alert is about, marking it read on the way.
   * @param {object} notification - The alert that was tapped.
   * @returns {Promise<void>} Resolves once handled.
   */
  async function openNotification(notification) {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setUnreadCount((previousCount) => Math.max(0, previousCount - 1));
        setNotifications((previousAlerts) =>
          previousAlerts.map((previousAlert) =>
            previousAlert.id === notification.id ? { ...previousAlert, isRead: true } : previousAlert
          )
        );
      } catch {
        // Failing to mark it read must not stop the passenger opening what it is about.
      }
    }
    if (notification.tripId) {
      router.push(`/(passenger)/live-tracking/${notification.tripId}`);
      return;
    }
    if (notification.type === NOTIFICATION_TYPES.INQUIRY_REPLY) {
      router.push('/(passenger)/inquiries');
      return;
    }
    if (notification.type === NOTIFICATION_TYPES.TICKET || notification.type === NOTIFICATION_TYPES.PAYMENT) {
      router.push('/(passenger)/(tabs)/tickets');
      return;
    }
    if (notification.routeId?.id) {
      router.push(`/(passenger)/route-details/${notification.routeId.id}`);
    }
  }

  const markEverythingRead = async () => {
    try {
      await markAllNotificationsRead();
      showSuccessToast('All alerts marked as read.');
      refreshFeed();
    } catch (markError) {
      showErrorToast(markError.message);
    }
  };

  const confirmClearRead = async () => {
    setIsClearing(true);
    try {
      const clearedCount = await clearReadNotifications();
      showSuccessToast(`${clearedCount} alerts cleared.`);
      setIsClearDialogVisible(false);
      refreshFeed();
    } catch (clearError) {
      showErrorToast(clearError.message);
    } finally {
      setIsClearing(false);
    }
  };

  const removeNotification = async (notificationId) => {
    try {
      await dismissNotification(notificationId);
      setNotifications((previousAlerts) =>
        previousAlerts.filter((previousAlert) => previousAlert.id !== notificationId)
      );
    } catch (dismissError) {
      showErrorToast(dismissError.message);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title={unreadCount > 0 ? `Alerts (${unreadCount})` : 'Alerts'}
      onMenuPress={drawer ? drawer.openDrawer : undefined}
    />
  );

  const typeTabs = (
    <View style={styles.tabRow}>
      {ALERT_FILTER_TABS.map((filterTab) => {
        const isSelectedTab = filterTab.type === selectedType;
        return (
          <Pressable
            key={filterTab.label}
            onPress={() => showAlertsOfType(filterTab.type)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelectedTab }}
            accessibilityLabel={`Show ${filterTab.label} alerts`}
            style={[styles.tabButton, isSelectedTab && styles.tabButtonSelected]}
          >
            <Text style={[typography.label, isSelectedTab && styles.tabTextSelected]}>
              {filterTab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        {typeTabs}
        <LoadingState message="Loading your alerts..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        {typeTabs}
        <ErrorState message={loadErrorMessage} onRetry={refreshFeed} />
      </ScreenContainer>
    );
  }
  if (notifications.length === 0) {
    return (
      <ScreenContainer header={screenHeader}>
        {typeTabs}
        <EmptyState
          iconName="notifications-outline"
          title={ALERTS_EMPTY.title}
          message={ALERTS_EMPTY.message}
          actionLabel={ALERTS_EMPTY.actionLabel}
          onActionPress={() => router.push('/(passenger)/alert-settings')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      {typeTabs}

      <View style={styles.actionRow}>
        <AppButton
          label={ALERT_MESSAGES.markAllRead}
          variant="outline"
          size="small"
          iconName="checkmark-done"
          isDisabled={unreadCount === 0}
          onPress={markEverythingRead}
        />
        <AppButton
          label="Settings"
          variant="text"
          size="small"
          iconName="options-outline"
          onPress={() => router.push('/(passenger)/alert-settings')}
        />
      </View>

      {notifications.map((notification) => {
        const alertStyle =
          NOTIFICATION_STYLES[notification.type] || NOTIFICATION_STYLES[NOTIFICATION_TYPES.ANNOUNCEMENT];
        return (
          <AppCard
            key={notification.id}
            onPress={() => openNotification(notification)}
            accessibilityLabel={`${alertStyle.label}: ${notification.title}. ${
              notification.isRead ? 'Read' : 'Unread'
            }. ${formatAlertAge(notification.createdAt)}`}
            style={!notification.isRead ? styles.unreadCard : undefined}
          >
            <View style={styles.alertRow}>
              <View style={[styles.alertBadge, !notification.isRead && styles.alertBadgeUnread]}>
                <Ionicons
                  name={alertStyle.iconName}
                  size={sizes.iconMedium}
                  color={notification.isRead ? colors.text.secondary : colors.primary[600]}
                />
              </View>

              <View style={styles.alertText}>
                <View style={styles.alertTitleRow}>
                  <Text style={[typography.bodyLarge, styles.alertTitle]}>{notification.title}</Text>
                  {!notification.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={[typography.bodySmall, styles.mutedText]}>{notification.message}</Text>
                <Text style={[typography.caption, styles.mutedText]}>
                  {alertStyle.label} &#183; {formatAlertAge(notification.createdAt)}
                </Text>
              </View>

              <Pressable
                onPress={() => removeNotification(notification.id)}
                accessibilityRole="button"
                accessibilityLabel={`Dismiss alert: ${notification.title}`}
                style={styles.dismissButton}
              >
                <Ionicons name="close" size={sizes.iconMedium} color={colors.text.secondary} />
              </Pressable>
            </View>
          </AppCard>
        );
      })}

      <AppButton
        label={ALERT_MESSAGES.clearRead}
        variant="text"
        iconName="trash-outline"
        onPress={() => setIsClearDialogVisible(true)}
      />

      <ConfirmDialog
        isVisible={isClearDialogVisible}
        title={ALERT_MESSAGES.clearConfirmTitle}
        message={ALERT_MESSAGES.clearConfirmMessage}
        confirmLabel="Clear"
        isDestructive
        isConfirming={isClearing}
        onConfirm={confirmClearRead}
        onCancel={() => setIsClearDialogVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabButtonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  tabTextSelected: {
    color: colors.primary[600],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadCard: {
    borderLeftWidth: sizes.borderThick,
    borderLeftColor: colors.primary[500],
  },
  alertRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  alertBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeUnread: {
    backgroundColor: colors.primary[100],
  },
  alertText: {
    flex: 1,
    gap: spacing.xxs,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alertTitle: {
    flex: 1,
  },
  unreadDot: {
    width: sizes.unreadDot,
    height: sizes.unreadDot,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary[500],
  },
  mutedText: {
    color: colors.text.secondary,
  },
  dismissButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
