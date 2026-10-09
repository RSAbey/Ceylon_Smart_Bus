// Alert Settings (Member 04): which routes the passenger is told about, and what they are told.
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
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
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import {
  fetchAlertSubscriptions,
  subscribeToRouteAlerts,
  unsubscribeFromRouteAlerts,
  updateAlertSubscription,
} from '../services/notificationApi';
import { searchRoutes } from '../../routes/services/routeApi';
import { ALERT_SETTINGS_EMPTY, ALERT_MESSAGES, ALERT_TYPE_OPTIONS } from '../constants';

/**
 * The passenger's per-route alert preferences.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AlertSettingsScreen() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToast();

  const [subscriptions, setSubscriptions] = useState([]);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [isRoutePickerOpen, setIsRoutePickerOpen] = useState(false);
  const [subscriptionPendingRemoval, setSubscriptionPendingRemoval] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadSettings = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    Promise.all([fetchAlertSubscriptions(), searchRoutes()])
      .then(([loadedSubscriptions, loadedRoutes]) => {
        if (!isEffectActive) return;
        setSubscriptions(loadedSubscriptions);
        setAvailableRoutes(loadedRoutes.map((routeResult) => routeResult.route));
        setLoadErrorMessage('');
      })
      .catch((loadError) => {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
      });
    return () => {
      isEffectActive = false;
    };
  }, [reloadCounter]);

  const followRoute = async (routeId) => {
    setIsRoutePickerOpen(false);
    try {
      await subscribeToRouteAlerts({ routeId });
      showSuccessToast('Alerts turned on for this route.');
      reloadSettings();
    } catch (followError) {
      showErrorToast(followError.message);
    }
  };

  const changeAlertType = async (subscriptionId, alertType) => {
    try {
      await updateAlertSubscription(subscriptionId, { alertType });
      reloadSettings();
    } catch (changeError) {
      showErrorToast(changeError.message);
    }
  };

  const togglePaused = async (subscription) => {
    try {
      await updateAlertSubscription(subscription.id, { isActive: !subscription.isActive });
      reloadSettings();
    } catch (toggleError) {
      showErrorToast(toggleError.message);
    }
  };

  const confirmRemove = async () => {
    setIsRemoving(true);
    try {
      await unsubscribeFromRouteAlerts(subscriptionPendingRemoval.id);
      showSuccessToast('Alerts turned off for this route.');
      setSubscriptionPendingRemoval(null);
      reloadSettings();
    } catch (removeError) {
      showErrorToast(removeError.message);
    } finally {
      setIsRemoving(false);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Alert Settings"
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your alert settings..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadSettings} />
      </ScreenContainer>
    );
  }

  const followedRouteIds = subscriptions.map((subscription) => subscription.routeId?.id);
  const unfollowedRoutes = availableRoutes.filter(
    (availableRoute) => !followedRouteIds.includes(availableRoute.id)
  );

  const routePicker = (
    <Modal
      visible={isRoutePickerOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setIsRoutePickerOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeaderRow}>
            <Text style={typography.heading3}>Follow a route</Text>
            <AppButton
              label="Close"
              variant="text"
              size="small"
              onPress={() => setIsRoutePickerOpen(false)}
            />
          </View>
          <ScrollView>
            {unfollowedRoutes.length === 0 ? (
              <Text style={[typography.bodyMedium, styles.mutedText]}>
                You already follow every active route.
              </Text>
            ) : (
              unfollowedRoutes.map((availableRoute) => (
                <Pressable
                  key={availableRoute.id}
                  onPress={() => followRoute(availableRoute.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Follow route ${availableRoute.routeNumber}`}
                  style={styles.pickerRow}
                >
                  <Text style={typography.bodyLarge}>Route {availableRoute.routeNumber}</Text>
                  <Text style={[typography.caption, styles.mutedText]}>
                    {availableRoute.origin} &#8594; {availableRoute.destination}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (subscriptions.length === 0) {
    return (
      <ScreenContainer header={screenHeader}>
        <EmptyState
          iconName="notifications-off-outline"
          title={ALERT_SETTINGS_EMPTY.title}
          message={ALERT_SETTINGS_EMPTY.message}
          actionLabel={ALERT_SETTINGS_EMPTY.actionLabel}
          onActionPress={() => setIsRoutePickerOpen(true)}
        />
        {routePicker}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <Text style={[typography.bodySmall, styles.mutedText]}>
        Choose what you want to be told about each route you follow.
      </Text>

      {subscriptions.map((subscription) => (
        <AppCard key={subscription.id}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.routeBadge}>
              <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
            </View>
            <View style={styles.routeText}>
              <Text style={typography.heading3}>Route {subscription.routeId?.routeNumber}</Text>
              <Text style={[typography.caption, styles.mutedText]}>
                {subscription.routeId?.origin} &#8594; {subscription.routeId?.destination}
              </Text>
            </View>
            <Switch
              value={subscription.isActive}
              onValueChange={() => togglePaused(subscription)}
              accessibilityLabel={`Alerts for route ${subscription.routeId?.routeNumber}`}
              trackColor={{ true: colors.primary[500], false: colors.border }}
            />
          </View>

          {subscription.isActive ? (
            <View style={styles.optionBlock}>
              {ALERT_TYPE_OPTIONS.map((alertOption) => {
                const isChosen = alertOption.alertType === subscription.alertType;
                return (
                  <Pressable
                    key={alertOption.alertType}
                    onPress={() => changeAlertType(subscription.id, alertOption.alertType)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isChosen }}
                    accessibilityLabel={`${alertOption.label}. ${alertOption.hint}`}
                    style={[styles.optionRow, isChosen && styles.optionRowChosen]}
                  >
                    <Ionicons
                      name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                      size={sizes.iconMedium}
                      color={isChosen ? colors.primary[600] : colors.text.disabled}
                    />
                    <View style={styles.optionText}>
                      <Text style={typography.bodyMedium}>{alertOption.label}</Text>
                      <Text style={[typography.caption, styles.mutedText]}>{alertOption.hint}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.pausedRow}>
              <Ionicons
                name="pause-circle-outline"
                size={sizes.iconMedium}
                color={colors.text.secondary}
              />
              <Text style={[typography.bodySmall, styles.mutedText]}>
                {ALERT_MESSAGES.pausedLabel}. Turn the switch back on to start getting alerts again.
              </Text>
            </View>
          )}

          <AppButton
            label="Stop following"
            variant="text"
            size="small"
            iconName="trash-outline"
            accessibilityLabel={`Stop following route ${subscription.routeId?.routeNumber}`}
            onPress={() => setSubscriptionPendingRemoval(subscription)}
          />
        </AppCard>
      ))}

      <AppButton
        label="Follow another route"
        isFullWidth
        iconName="add"
        onPress={() => setIsRoutePickerOpen(true)}
      />

      {routePicker}

      <ConfirmDialog
        isVisible={Boolean(subscriptionPendingRemoval)}
        title="Stop following this route?"
        message={`You will no longer be told about route ${subscriptionPendingRemoval?.routeId?.routeNumber}.`}
        confirmLabel="Stop following"
        isDestructive
        isConfirming={isRemoving}
        onConfirm={confirmRemove}
        onCancel={() => setSubscriptionPendingRemoval(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  routeBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeText: {
    flex: 1,
    gap: spacing.xxs,
  },
  optionBlock: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
  },
  optionRowChosen: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  optionText: {
    flex: 1,
    gap: spacing.xxs,
  },
  pausedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalSheet: {
    maxHeight: '75%',
    padding: sizes.screenGutter,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  pickerRow: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    borderBottomWidth: sizes.borderThin,
    borderBottomColor: colors.border,
  },
});
