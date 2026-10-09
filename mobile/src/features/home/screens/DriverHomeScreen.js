// Driver Dashboard (Member 04): the first screen of a shift — the journey in progress, the two
// things a driver does most, and what the day has taken so far.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useAuth } from '../../../context/AuthContext';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { getNameInitials } from '../../../utils/formatters';
import { fetchDriverHome } from '../services/homeApi';
import { fetchShiftSummary } from '../../payments/services/paymentApi';
import { fetchTripTracking } from '../../tracking/services/trackingApi';
import { formatFare } from '../../tickets/formatters';
import { HOME_QUICK_ACTIONS } from '../constants';

/**
 * Loads the dashboard: the driver's bus and trip, plus today's takings.
 * @returns {Promise<{driverHome: object, shiftSummary: object | null}>} Everything the screen shows.
 */
async function loadDriverDashboard() {
  const driverHome = await fetchDriverHome();
  // The shift totals are a nicety; a driver with no trips today still gets the rest of the screen.
  const shiftSummary = await fetchShiftSummary().catch(() => null);
  const tracking = driverHome.trip ? await fetchTripTracking(driverHome.trip.id).catch(() => null) : null;
  return { driverHome, shiftSummary, tracking };
}

/**
 * The driver's landing screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DriverHomeScreen() {
  const router = useRouter();
  const { user: signedInUser } = useAuth();

  const [driverHome, setDriverHome] = useState(null);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [trackingCard, setTrackingCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadHome = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // Starting a trip, scanning and reporting delays all happen on other tabs, so refresh on focus.
  useFocusEffect(reloadHome);

  useEffect(() => {
    let isEffectActive = true;
    loadDriverDashboard()
      .then(({ driverHome: loadedHome, shiftSummary: loadedShift, tracking }) => {
        if (!isEffectActive) return;
        setDriverHome(loadedHome);
        setShiftSummary(loadedShift);
        setTrackingCard(tracking);
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

  const screenHeader = (
    <View style={styles.header}>
      <View style={styles.headerTextBlock}>
        <Text style={typography.heading2}>Driver Dashboard</Text>
        <Text style={[typography.bodySmall, styles.mutedText]}>
          {signedInUser?.fullName}
          {driverHome?.bus ? ` · ${driverHome.bus.plateNumber}` : ''}
        </Text>
      </View>
      <Pressable
        onPress={() => router.push('/(driver)/profile')}
        accessibilityRole="button"
        accessibilityLabel="Open your driver profile"
        style={styles.avatarButton}
      >
        <Text style={[typography.label, styles.avatarText]}>
          {getNameInitials(signedInUser?.fullName)}
        </Text>
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your dashboard..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadHome} />
      </ScreenContainer>
    );
  }

  const { bus, route, stops, isTripRunning, activeDelayMinutes, passengerCount } = driverHome;

  if (!bus) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState
          title="No bus assigned"
          message="An administrator has not assigned a bus to you yet. Ask them to assign one before starting a trip."
          onRetry={reloadHome}
        />
      </ScreenContainer>
    );
  }

  const orderedStops = trackingCard?.stops || stops;
  const currentStopIndex = orderedStops.findIndex(
    (routeStop) => routeStop.id === trackingCard?.currentStopId
  );
  const nextStop =
    currentStopIndex >= 0 && currentStopIndex + 1 < orderedStops.length
      ? orderedStops[currentStopIndex + 1]
      : null;
  const stopsRemaining =
    currentStopIndex >= 0 ? Math.max(0, orderedStops.length - currentStopIndex - 1) : orderedStops.length;

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <Text style={[typography.sectionHeading, styles.mutedText]}>Current journey</Text>

      <AppCard>
        <View style={styles.journeyHeaderRow}>
          <View style={styles.routeBadge}>
            <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
          </View>
          <View style={styles.journeyTextBlock}>
            <Text style={typography.heading3}>Route {route?.routeNumber || '--'}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>
              {route ? `${route.origin} → ${route.destination}` : 'No route assigned'}
            </Text>
          </View>
          <StatusBadge
            status={isTripRunning ? 'active' : 'cancelled'}
            label={isTripRunning ? 'Journey active' : 'Not started'}
          />
        </View>

        {isTripRunning ? (
          <View style={styles.nextStopPanel}>
            <Text style={[typography.caption, styles.mutedText]}>Next stop</Text>
            <Text style={typography.heading2}>{nextStop?.stopName || 'Final stop'}</Text>
            <View style={styles.stopsRemainingRow}>
              <Ionicons
                name="ellipsis-horizontal-circle-outline"
                size={sizes.iconSmall}
                color={colors.text.secondary}
              />
              <Text style={[typography.bodySmall, styles.mutedText]}>
                {stopsRemaining} {stopsRemaining === 1 ? 'stop' : 'stops'} remaining ·{' '}
                {passengerCount ?? 0} passengers
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[typography.bodyMedium, styles.mutedText]}>
            Start your run from the Live tab so passengers can track this bus.
          </Text>
        )}

        {isTripRunning && activeDelayMinutes > 0 && (
          <View style={styles.delayRow}>
            <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.warning.dark} />
            <Text style={[typography.bodySmall, styles.delayText]}>
              Passengers have been told you are {activeDelayMinutes} min late.
            </Text>
          </View>
        )}

        <AppButton
          label={isTripRunning ? 'View live route' : 'Start your trip'}
          size="large"
          isFullWidth
          iconName={isTripRunning ? 'trending-up' : 'play-circle-outline'}
          onPress={() => router.push('/(driver)/(tabs)/live')}
        />
      </AppCard>

      <Text style={[typography.sectionHeading, styles.mutedText]}>Quick actions</Text>
      <View style={styles.actionGrid}>
        {HOME_QUICK_ACTIONS.driver.map((quickAction) => (
          <AppCard
            key={quickAction.key}
            onPress={() => router.push(quickAction.route)}
            accessibilityLabel={quickAction.accessibilityLabel}
            style={styles.actionCard}
          >
            <View style={styles.actionBadge}>
              <Ionicons
                name={quickAction.iconName}
                size={sizes.iconLarge}
                color={colors.primary[600]}
              />
            </View>
            <Text style={typography.bodyLarge}>{quickAction.label}</Text>
            <Text style={[typography.caption, styles.mutedText]}>{quickAction.hint}</Text>
          </AppCard>
        ))}
      </View>

      <Text style={[typography.sectionHeading, styles.mutedText]}>Today&apos;s summary</Text>
      <AppCard onPress={() => router.push('/(driver)/shift')} accessibilityLabel="Open your shift totals">
        <View style={styles.summaryRow}>
          <View style={styles.summaryBlock}>
            <Text style={typography.display}>{shiftSummary?.ticketCount ?? 0}</Text>
            <Text style={[typography.caption, styles.mutedText]}>Tickets</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={typography.display}>{shiftSummary?.digitalCount ?? 0}</Text>
            <Text style={[typography.caption, styles.mutedText]}>Digital</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={typography.display}>{shiftSummary?.cashCount ?? 0}</Text>
            <Text style={[typography.caption, styles.mutedText]}>Cash</Text>
          </View>
        </View>
        <View style={styles.summaryFooterRow}>
          <Text style={[typography.bodySmall, styles.mutedText]}>
            Collected {formatFare(shiftSummary?.shiftTotal ?? 0)}
          </Text>
          <Ionicons name="chevron-forward" size={sizes.iconSmall} color={colors.text.secondary} />
        </View>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: sizes.screenGutter,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  avatarButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary[600],
  },
  mutedText: {
    color: colors.text.secondary,
  },
  journeyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  routeBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  nextStopPanel: {
    gap: spacing.xxs,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
  },
  stopsRemainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  delayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.warning.light,
  },
  delayText: {
    flex: 1,
    color: colors.warning.dark,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    flexGrow: 1,
    minWidth: '45%',
    gap: spacing.xs,
  },
  actionBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryBlock: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  summaryDivider: {
    width: sizes.borderThin,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  summaryFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
  },
});
