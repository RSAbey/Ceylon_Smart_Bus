// My Routes (driver app): the route this driver's bus is assigned to, with its stops in order.
// A driver drives one assigned bus, so this is normally a single card rather than a long list.
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
import EmptyState from '../../../components/feedback/EmptyState';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchMyTripOverview } from '../services/trackingApi';
import { DRIVER_ROUTE_MESSAGES } from '../constants';

/**
 * The driver's assigned route.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DriverRoutesScreen() {
  const router = useRouter();

  const [tripOverview, setTripOverview] = useState(null);
  const [areStopsExpanded, setAreStopsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadRoute = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // An administrator can reassign the bus between shifts, so re-read on focus.
  useFocusEffect(reloadRoute);

  useEffect(() => {
    let isEffectActive = true;
    fetchMyTripOverview()
      .then((loadedOverview) => {
        if (!isEffectActive) return;
        setTripOverview(loadedOverview);
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
      <Text style={typography.heading2}>{DRIVER_ROUTE_MESSAGES.title}</Text>
      <Text style={[typography.bodySmall, styles.mutedText]}>
        {DRIVER_ROUTE_MESSAGES.subtitle}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your route..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadRoute} />
      </ScreenContainer>
    );
  }

  const { bus, route, stops, isTripRunning, trip } = tripOverview;

  if (!route) {
    return (
      <ScreenContainer header={screenHeader}>
        <EmptyState
          iconName="git-network-outline"
          title={DRIVER_ROUTE_MESSAGES.noRouteTitle}
          message={DRIVER_ROUTE_MESSAGES.noRouteMessage}
          actionLabel="Reload"
          onActionPress={reloadRoute}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <View style={styles.routeHeaderRow}>
          <View style={styles.routeBadge}>
            <Ionicons name="bus" size={sizes.iconLarge} color={colors.primary[600]} />
          </View>
          <Text style={[typography.display, styles.routeNumberText]}>{route.routeNumber}</Text>
          <StatusBadge
            status={isTripRunning ? 'active' : 'cancelled'}
            label={isTripRunning ? 'Running' : 'Not started'}
          />
        </View>

        <Text style={typography.heading3}>
          {route.origin} &#8594; {route.destination}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="bus-outline" size={sizes.iconSmall} color={colors.text.secondary} />
          <Text style={[typography.bodySmall, styles.mutedText]}>
            {bus?.plateNumber} &#183; {stops.length} stops
          </Text>
        </View>

        <View style={styles.actionRow}>
          <AppButton
            label="Live"
            isFullWidth
            iconName="navigate-outline"
            style={styles.actionButton}
            onPress={() => router.push('/(driver)/(tabs)/live')}
          />
          <AppButton
            label={areStopsExpanded ? 'Hide stops' : 'Details'}
            variant="outline"
            isFullWidth
            iconName={areStopsExpanded ? 'chevron-up' : 'chevron-down'}
            style={styles.actionButton}
            onPress={() => setAreStopsExpanded((wasExpanded) => !wasExpanded)}
          />
        </View>
      </AppCard>

      {areStopsExpanded && (
        <AppCard>
          <Text style={[typography.sectionHeading, styles.mutedText]}>
            {DRIVER_ROUTE_MESSAGES.stopsHeading}
          </Text>
          {stops.map((routeStop, stopIndex) => {
            const isLastStop = stopIndex === stops.length - 1;
            return (
              <Pressable
                key={routeStop.id}
                onPress={() => router.push(`/(passenger)/route-details/${route.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Stop ${routeStop.stopSequence}, ${routeStop.stopName}`}
                style={styles.stopRow}
              >
                <View style={styles.timelineColumn}>
                  <View style={[styles.stopDot, isLastStop && styles.stopDotTerminus]} />
                  {!isLastStop && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.stopTextBlock}>
                  <Text style={typography.bodyLarge}>{routeStop.stopName}</Text>
                  <Text style={[typography.caption, styles.mutedText]}>
                    Stop {routeStop.stopSequence}
                    {isLastStop ? ' · Terminus' : ''}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </AppCard>
      )}

      {isTripRunning && trip && (
        <AppButton
          label="Open live tracking"
          variant="outline"
          isFullWidth
          iconName="map-outline"
          onPress={() => router.push('/(driver)/(tabs)/live')}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xxs,
    paddingHorizontal: sizes.screenGutter,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  mutedText: {
    color: colors.text.secondary,
  },
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
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
    borderColor: colors.primary[500],
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },
  stopDotTerminus: {
    backgroundColor: colors.primary[500],
  },
  timelineLine: {
    flex: 1,
    width: sizes.borderThick,
    backgroundColor: colors.border,
  },
  stopTextBlock: {
    flex: 1,
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
  },
});
