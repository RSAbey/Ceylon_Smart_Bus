// Live Bus Tracking entry (Member 02, FR-03): choose which nearby bus to follow.
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import useCurrentLocation from '../../../hooks/useCurrentLocation';
import usePolling from '../../../hooks/usePolling';
import { TRACKING_POLL_INTERVAL_MS } from '../../../utils/constants';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchNearbyBuses } from '../services/trackingApi';

/**
 * Lists buses running near the passenger so they can pick one to track.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function SelectBusToTrackScreen() {
  const router = useRouter();
  const drawer = useDrawer();
  const { position, isLocating, locationErrorMessage, retryLocation } = useCurrentLocation();

  const [nearbyBuses, setNearbyBuses] = useState([]);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const refreshNearbyBuses = useCallback(() => {
    if (!position) return;
    fetchNearbyBuses(position)
      .then((loadedBuses) => {
        setNearbyBuses(loadedBuses);
        setLoadErrorMessage('');
      })
      .catch((loadError) => setLoadErrorMessage(loadError.message))
      .finally(() => setHasLoadedOnce(true));
  }, [position]);

  usePolling(refreshNearbyBuses, TRACKING_POLL_INTERVAL_MS);

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Live Bus Tracking"
      onBackPress={router.canGoBack() ? router.back : undefined}
      onMenuPress={drawer ? drawer.openDrawer : undefined}
    />
  );

  if (isLocating) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Finding your location..." />
      </ScreenContainer>
    );
  }
  if (locationErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState title="Location needed" message={locationErrorMessage} onRetry={retryLocation} />
      </ScreenContainer>
    );
  }
  if (!hasLoadedOnce) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Looking for buses near you..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={refreshNearbyBuses} />
      </ScreenContainer>
    );
  }
  if (nearbyBuses.length === 0) {
    return (
      <ScreenContainer header={screenHeader}>
        <EmptyState
          iconName="bus-outline"
          title="No buses running near you"
          message="Buses appear here while a driver has a trip in progress. Try again shortly."
          actionLabel="Browse routes"
          onActionPress={() => router.push('/(passenger)/(tabs)/explore')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <Text style={[typography.sectionHeading, styles.mutedText]}>
        {nearbyBuses.length} {nearbyBuses.length === 1 ? 'bus' : 'buses'} near you
      </Text>
      {nearbyBuses.map((nearbyBus) => (
        <AppCard
          key={nearbyBus.tripId}
          onPress={() => router.push(`/(passenger)/live-tracking/${nearbyBus.tripId}`)}
          accessibilityLabel={`Track route ${nearbyBus.route?.routeNumber}, ${nearbyBus.distanceKm} kilometres away`}
        >
          <View style={styles.busRow}>
            <View style={styles.routeBadge}>
              <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
            </View>
            <View style={styles.busTextBlock}>
              <Text style={typography.heading3}>Route {nearbyBus.route?.routeNumber}</Text>
              <Text style={[typography.bodySmall, styles.mutedText]}>
                {nearbyBus.route?.origin} → {nearbyBus.route?.destination}
              </Text>
              <Text style={[typography.bodySmall, styles.mutedText]}>{nearbyBus.busName}</Text>
            </View>
            <Text style={[typography.heading3, styles.distanceText]}>{nearbyBus.distanceKm} km</Text>
          </View>
        </AppCard>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  busRow: {
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
  busTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  distanceText: {
    color: colors.primary[600],
  },
});
