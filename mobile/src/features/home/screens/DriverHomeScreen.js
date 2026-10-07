// Driver Dashboard (Member 04): the one screen a driver sees first — their bus, whether the trip is
// running, any delay they have reported, and the three things they do from the cab.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchDriverHome } from '../services/homeApi';
import { HOME_QUICK_ACTIONS } from '../constants';

/**
 * The driver's landing screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DriverHomeScreen() {
  const router = useRouter();
  const drawer = useDrawer();

  const [driverHome, setDriverHome] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadHome = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // Starting a trip or reporting a delay happens on other tabs, so refresh on focus.
  useFocusEffect(reloadHome);

  useEffect(() => {
    let isEffectActive = true;
    fetchDriverHome()
      .then((loadedHome) => {
        if (!isEffectActive) return;
        setDriverHome(loadedHome);
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
    <AppHeader
      variant="back"
      title="Dashboard"
      onMenuPress={drawer ? drawer.openDrawer : undefined}
    />
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

  const { bus, route, stops, isTripRunning, activeDelayMinutes } = driverHome;

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

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <View style={styles.busHeaderRow}>
          <View style={styles.busBadge}>
            <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
          </View>
          <View style={styles.busText}>
            <Text style={typography.heading2}>{bus.plateNumber}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>{bus.busName}</Text>
          </View>
          <StatusBadge
            status={isTripRunning ? 'active' : 'cancelled'}
            label={isTripRunning ? 'On trip' : 'Not started'}
          />
        </View>

        {route ? (
          <Text style={typography.bodyLarge}>
            Route {route.routeNumber} &#183; {route.origin} &#8594; {route.destination}
          </Text>
        ) : (
          <Text style={[typography.bodyMedium, styles.mutedText]}>
            No route assigned to this bus yet.
          </Text>
        )}
        <Text style={[typography.bodySmall, styles.mutedText]}>
          {stops.length} stops on this route
        </Text>
      </AppCard>

      {isTripRunning && activeDelayMinutes > 0 && (
        <AppCard style={styles.delayCard}>
          <View style={styles.delayRow}>
            <Ionicons name="alert-circle" size={sizes.iconLarge} color={colors.warning.dark} />
            <View style={styles.delayText}>
              <Text style={typography.heading3}>Running {activeDelayMinutes} min late</Text>
              <Text style={[typography.bodySmall, styles.mutedText]}>
                Passengers following this route have been told.
              </Text>
            </View>
          </View>
          <AppButton
            label="Update or clear the delay"
            variant="outline"
            isFullWidth
            iconName="create-outline"
            onPress={() => router.push('/(driver)/(tabs)/delay-report')}
          />
        </AppCard>
      )}

      {isTripRunning && activeDelayMinutes === 0 && (
        <View style={styles.onTimeRow}>
          <Ionicons name="checkmark-circle" size={sizes.iconMedium} color={colors.success.dark} />
          <Text style={[typography.bodyMedium, styles.onTimeText]}>
            Running on time. Passengers can see this bus on the live map.
          </Text>
        </View>
      )}

      <Text style={[typography.sectionHeading, styles.mutedText]}>What do you need to do?</Text>
      <View style={styles.actionGrid}>
        {HOME_QUICK_ACTIONS.driver.map((quickAction) => (
          <AppCard
            key={quickAction.key}
            onPress={() => router.push(quickAction.route)}
            accessibilityLabel={quickAction.accessibilityLabel}
            style={styles.actionCard}
          >
            <View style={styles.actionBadge}>
              <Ionicons name={quickAction.iconName} size={sizes.iconLarge} color={colors.primary[600]} />
            </View>
            <Text style={typography.bodyLarge}>{quickAction.label}</Text>
            <Text style={[typography.caption, styles.mutedText]}>{quickAction.hint}</Text>
          </AppCard>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  busHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  busBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  busText: {
    flex: 1,
    gap: spacing.xxs,
  },
  delayCard: {
    backgroundColor: colors.warning.light,
  },
  delayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  delayText: {
    flex: 1,
    gap: spacing.xxs,
  },
  onTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.success.light,
  },
  onTimeText: {
    flex: 1,
    color: colors.success.dark,
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
});
