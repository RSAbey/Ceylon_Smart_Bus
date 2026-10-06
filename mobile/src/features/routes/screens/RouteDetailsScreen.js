// Route Details (Member 02, screens 18 and 19): route card, stop timeline with an expandable stop, Track bus.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchRouteDetails, fetchStopConnections, saveRoute } from '../services/routeApi';
import { fetchTripTracking } from '../../tracking/services/trackingApi';
import { STOP_BADGES } from '../constants';

/**
 * A small pill label such as "Current stop" or "Terminus".
 * @param {object} props - Component props.
 * @param {string} props.label - Pill text.
 * @returns {import('react').JSX.Element} The pill.
 */
function StopBadge({ label }) {
  return (
    <View style={styles.stopBadge}>
      <Text style={[typography.caption, styles.stopBadgeText]}>{label}</Text>
    </View>
  );
}

/**
 * Route details with an ordered stop list; tapping a stop shows its arrival time and connecting routes.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function RouteDetailsScreen() {
  const router = useRouter();
  const { routeId } = useLocalSearchParams();
  const { showSuccessToast, showErrorToast } = useToast();

  const [routeDetails, setRouteDetails] = useState(null);
  const [trackingCard, setTrackingCard] = useState(null);
  const [expandedStopId, setExpandedStopId] = useState(null);
  const [stopConnections, setStopConnections] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadRoute = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    fetchRouteDetails(routeId)
      .then(async (loadedRoute) => {
        if (!isEffectActive) return;
        setRouteDetails(loadedRoute);
        setLoadErrorMessage('');
        // When a bus is running we can show real arrival times against each stop.
        const runningTripId = loadedRoute.runningTrips?.[0]?.id;
        if (runningTripId) {
          const loadedTracking = await fetchTripTracking(runningTripId);
          if (isEffectActive) setTrackingCard(loadedTracking);
        }
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
  }, [routeId, reloadCounter]);

  const toggleStop = async (routeStop) => {
    if (expandedStopId === routeStop.id) {
      setExpandedStopId(null);
      return;
    }
    setExpandedStopId(routeStop.id);
    setStopConnections(null);
    try {
      const loadedConnections = await fetchStopConnections(routeId, routeStop.id);
      setStopConnections(loadedConnections);
    } catch {
      // Connections are a nicety; the stop still expands with its arrival time.
      setStopConnections({ routeNumbers: [] });
    }
  };

  const addToSavedRoutes = async () => {
    try {
      await saveRoute(routeId);
      showSuccessToast('Route saved.');
    } catch (saveError) {
      showErrorToast(saveError.message);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer header={<AppHeader variant="back" title="Route" onBackPress={router.back} />}>
        <LoadingState message="Loading route..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={<AppHeader variant="back" title="Route" onBackPress={router.back} />}>
        <ErrorState message={loadErrorMessage} onRetry={reloadRoute} />
      </ScreenContainer>
    );
  }

  const { route, stops, runningTrips } = routeDetails;
  const runningTripId = runningTrips?.[0]?.id;
  const lastStopIndex = stops.length - 1;

  return (
    <ScreenContainer
      isScrollable
      header={
        <AppHeader
          variant="back"
          title={`Route ${route.routeNumber}`}
          onBackPress={router.canGoBack() ? router.back : undefined}
        />
      }
    >
      <AppCard>
        <View style={styles.routeHeaderRow}>
          <View style={styles.routeBadge}>
            <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
          </View>
          <Text style={[typography.heading2, styles.routeNumberText]}>{route.routeNumber}</Text>
          <AppButton
            label="Save"
            variant="outline"
            size="small"
            iconName="star-outline"
            onPress={addToSavedRoutes}
          />
        </View>
        <Text style={typography.heading3}>
          {route.origin} → {route.destination}
        </Text>
        <View style={styles.destinationBoard}>
          <Text style={[typography.caption, styles.mutedText]}>
            Destination board: {route.destination.toUpperCase()}
          </Text>
        </View>
        <Text style={[typography.bodyLarge, styles.fareText]}>Fare: Rs. {route.baseFare}</Text>
      </AppCard>

      <Text style={[typography.sectionHeading, styles.mutedText]}>Stops</Text>
      <View>
        {stops.map((routeStop, stopIndex) => {
          const isCurrentStop = trackingCard?.currentStopId === routeStop.id;
          const isExpanded = expandedStopId === routeStop.id;
          const isTerminus = stopIndex === lastStopIndex;
          return (
            <View key={routeStop.id}>
              <Pressable
                onPress={() => toggleStop(routeStop)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                accessibilityLabel={`${routeStop.stopName}${isCurrentStop ? ', current stop' : ''}${isTerminus ? ', terminus' : ''}`}
                style={styles.stopRow}
              >
                <View style={styles.timelineColumn}>
                  <View
                    style={[
                      styles.stopDot,
                      (isCurrentStop || isExpanded) && styles.stopDotActive,
                      isCurrentStop && styles.stopDotFilled,
                    ]}
                  />
                  {stopIndex < lastStopIndex && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.stopTextBlock}>
                  <Text style={[typography.bodyLarge, isCurrentStop && styles.currentStopText]}>
                    {routeStop.stopName}
                  </Text>
                  {isCurrentStop && <StopBadge label={STOP_BADGES.current} />}
                  {isTerminus && !isCurrentStop && <StopBadge label={STOP_BADGES.terminus} />}
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.expandedCard}>
                  <Text style={[typography.bodyMedium, styles.etaText]}>
                    {trackingCard?.etaMinutes !== null && trackingCard?.etaMinutes !== undefined
                      ? `ETA: ${trackingCard.etaMinutes} mins`
                      : 'ETA: no bus running right now'}
                  </Text>
                  <Text style={[typography.bodySmall, styles.mutedText]}>
                    Fare from start: Rs. {routeStop.fareFromOrigin}
                  </Text>
                  <Text style={[typography.bodySmall, styles.mutedText]}>
                    {stopConnections === null
                      ? 'Looking up other buses...'
                      : stopConnections.routeNumbers.length > 0
                        ? `Next bus: ${[route.routeNumber, ...stopConnections.routeNumbers].join(', ')}`
                        : `Next bus: ${route.routeNumber}`}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <AppButton
        label={runningTripId ? 'Track bus' : 'No bus running right now'}
        size="large"
        isFullWidth
        isDisabled={!runningTripId}
        onPress={() => router.push(`/(passenger)/live-tracking/${runningTripId}`)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  routeBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeNumberText: {
    flex: 1,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  destinationBoard: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    marginVertical: spacing.sm,
  },
  fareText: {
    color: colors.primary[600],
  },
  stopRow: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  timelineColumn: {
    alignItems: 'center',
    width: sizes.iconLarge,
  },
  stopDot: {
    width: sizes.iconSmall,
    height: sizes.iconSmall,
    borderRadius: radii.pill,
    borderWidth: sizes.borderThick,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },
  stopDotActive: {
    borderColor: colors.primary[500],
  },
  stopDotFilled: {
    backgroundColor: colors.primary[500],
  },
  timelineLine: {
    flex: 1,
    width: sizes.borderThick,
    backgroundColor: colors.border,
  },
  stopTextBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  currentStopText: {
    color: colors.text.primary,
  },
  stopBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    backgroundColor: colors.primary[100],
  },
  stopBadgeText: {
    color: colors.primary[600],
  },
  expandedCard: {
    marginLeft: sizes.iconLarge + spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: spacing.xxs,
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  etaText: {
    color: colors.primary[600],
  },
});
