// Live Tracking (driver app): start and end a run, share the bus position while it is moving, and
// see what passengers see — progress along the route, next stop, speed and whether the bus is late.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import RouteMap from '../components/RouteMap';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import usePolling from '../../../hooks/usePolling';
import { TRACKING_POLL_INTERVAL_MS } from '../../../utils/constants';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import {
  endTrip,
  fetchMyTripOverview,
  fetchTripTracking,
  postBusLocation,
  startTrip,
} from '../services/trackingApi';
import {
  DRIVER_LIVE_MESSAGES,
  DRIVER_LOCATION_INTERVAL_MS,
  MAP_MESSAGES,
  TRACKING_CAPTIONS,
  TRACKING_STATUSES,
  WEAK_GPS_AFTER_SECONDS,
} from '../constants';

const METRES_PER_SECOND_TO_KMH = 3.6;

/**
 * Describes the GPS quality from how old the last accepted position is.
 * @param {number | null} positionAgeSeconds - Age of the newest position.
 * @returns {{label: string, iconName: string, isHealthy: boolean}} Badge wording.
 */
function describeGpsQuality(positionAgeSeconds) {
  if (positionAgeSeconds === null || positionAgeSeconds === undefined) {
    return { label: DRIVER_LIVE_MESSAGES.gpsNone, iconName: 'location-outline', isHealthy: false };
  }
  if (positionAgeSeconds <= WEAK_GPS_AFTER_SECONDS) {
    return { label: DRIVER_LIVE_MESSAGES.gpsStrong, iconName: 'locate', isHealthy: true };
  }
  return { label: DRIVER_LIVE_MESSAGES.gpsWeak, iconName: 'locate-outline', isHealthy: false };
}

/**
 * The driver's live tracking screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DriverTripScreen() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToast();

  const [tripOverview, setTripOverview] = useState(null);
  const [trackingCard, setTrackingCard] = useState(null);
  const [lastSpeedKmh, setLastSpeedKmh] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isChangingTrip, setIsChangingTrip] = useState(false);
  const [isEndDialogVisible, setIsEndDialogVisible] = useState(false);
  const [shareErrorMessage, setShareErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadTrip = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useFocusEffect(reloadTrip);

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

  /**
   * Reads the phone position and posts it, which is what passengers see moving on the map.
   * @returns {Promise<void>} Resolves once the position is sent.
   */
  const shareCurrentPosition = useCallback(async () => {
    if (!tripOverview?.trip) return;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setShareErrorMessage('Allow location access so passengers can see this bus.');
        return;
      }
      const devicePosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const speedKmh =
        devicePosition.coords.speed > 0
          ? devicePosition.coords.speed * METRES_PER_SECOND_TO_KMH
          : undefined;
      await postBusLocation(tripOverview.trip.id, {
        latitude: devicePosition.coords.latitude,
        longitude: devicePosition.coords.longitude,
        speedKmh,
      });
      setLastSpeedKmh(speedKmh === undefined ? 0 : Math.round(speedKmh));
      setShareErrorMessage('');
    } catch (shareError) {
      setShareErrorMessage(shareError.message);
    }
  }, [tripOverview]);

  usePolling(shareCurrentPosition, DRIVER_LOCATION_INTERVAL_MS);

  /**
   * Re-reads the same tracking card passengers see, so the driver sees their own ETA and status.
   * @returns {void}
   */
  const refreshTracking = useCallback(() => {
    if (!tripOverview?.trip) return;
    fetchTripTracking(tripOverview.trip.id)
      .then(setTrackingCard)
      .catch(() => {
        // The card is a read-only mirror; failing to refresh must not interrupt the run.
      });
  }, [tripOverview]);

  usePolling(refreshTracking, TRACKING_POLL_INTERVAL_MS);

  const beginTrip = async () => {
    setIsChangingTrip(true);
    try {
      await startTrip();
      showSuccessToast('Trip started. Passengers can now track this bus.');
      reloadTrip();
    } catch (startError) {
      showErrorToast(startError.message);
    } finally {
      setIsChangingTrip(false);
    }
  };

  const finishTrip = async () => {
    setIsChangingTrip(true);
    try {
      await endTrip(false);
      showSuccessToast('Trip ended.');
      setIsEndDialogVisible(false);
      setTrackingCard(null);
      reloadTrip();
    } catch (endError) {
      showErrorToast(endError.message);
    } finally {
      setIsChangingTrip(false);
    }
  };

  const screenHeader = (
    <View style={styles.header}>
      <Text style={typography.heading2}>{DRIVER_LIVE_MESSAGES.title}</Text>
      <View style={styles.headerBadgeRow}>
        <View style={[styles.dutyPill, tripOverview?.isTripRunning && styles.dutyPillOn]}>
          <View
            style={[styles.dutyDot, tripOverview?.isTripRunning && styles.dutyDotOn]}
          />
          <Text style={[typography.caption, styles.dutyText]}>
            {tripOverview?.isTripRunning
              ? DRIVER_LIVE_MESSAGES.onDuty
              : DRIVER_LIVE_MESSAGES.offDuty}
          </Text>
        </View>
        {tripOverview?.isTripRunning && (
          <View style={styles.gpsPill}>
            <Ionicons
              name={describeGpsQuality(trackingCard?.positionAgeSeconds).iconName}
              size={sizes.iconSmall}
              color={
                describeGpsQuality(trackingCard?.positionAgeSeconds).isHealthy
                  ? colors.primary[600]
                  : colors.warning.dark
              }
            />
            <Text style={[typography.caption, styles.gpsText]}>
              {describeGpsQuality(trackingCard?.positionAgeSeconds).label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your bus..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadTrip} />
      </ScreenContainer>
    );
  }

  const { bus, route, stops, isTripRunning } = tripOverview;

  if (!bus) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState
          title="No bus assigned"
          message="An administrator has not assigned a bus to you yet. Ask them to assign one before starting a trip."
          onRetry={reloadTrip}
        />
      </ScreenContainer>
    );
  }

  if (!isTripRunning) {
    return (
      <ScreenContainer isScrollable header={screenHeader}>
        <AppCard>
          <View style={styles.notStartedBlock}>
            <Ionicons name="bus-outline" size={sizes.iconHuge} color={colors.text.secondary} />
            <Text style={typography.heading3}>{DRIVER_LIVE_MESSAGES.notStartedTitle}</Text>
            <Text style={[typography.bodyMedium, styles.centredText]}>
              {DRIVER_LIVE_MESSAGES.notStartedMessage}
            </Text>
          </View>
        </AppCard>

        <AppCard>
          <Text style={typography.heading3}>{bus.plateNumber}</Text>
          <Text style={[typography.bodySmall, styles.mutedText]}>{bus.busName}</Text>
          {route ? (
            <Text style={[typography.bodyMedium, styles.routeLine]}>
              Route {route.routeNumber} &#183; {route.origin} &#8594; {route.destination}
            </Text>
          ) : (
            <Text style={[typography.bodyMedium, styles.mutedText]}>
              No route assigned to this bus yet.
            </Text>
          )}
        </AppCard>

        <AppButton
          label={DRIVER_LIVE_MESSAGES.startTrip}
          size="large"
          isFullWidth
          iconName="play-circle-outline"
          isLoading={isChangingTrip}
          isDisabled={!route}
          onPress={beginTrip}
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
      : orderedStops[orderedStops.length - 1];
  const busPosition = trackingCard?.position;
  const trackingStatus = trackingCard?.status || TRACKING_STATUSES.DISRUPTED;

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <View style={styles.progressRow}>
          <View style={styles.progressTextBlock}>
            <Text style={typography.heading3}>Route {route?.routeNumber}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>
              {route?.origin} &#8594; {route?.destination}
            </Text>
          </View>
          <View style={styles.progressCountBlock}>
            <Text style={[typography.bodyMedium, styles.progressCountText]}>
              Stop {currentStopIndex >= 0 ? currentStopIndex + 1 : 1} of {orderedStops.length}
            </Text>
            <Text style={[typography.caption, styles.mutedText]}>
              {tripOverview.passengerCount ?? 0} passengers
            </Text>
          </View>
        </View>
      </AppCard>

      <View style={styles.mapFrame}>
        <RouteMap
          style={styles.map}
          stops={orderedStops}
          currentStopId={trackingCard?.currentStopId}
          busPosition={busPosition}
          busLabel={MAP_MESSAGES.driverBusLabel}
          accessibilityLabel={`Map of route ${route?.routeNumber} showing your bus`}
        />
      </View>

      <AppCard>
        <View style={styles.nextStopRow}>
          <Ionicons name="location" size={sizes.iconLarge} color={colors.secondary[500]} />
          <View style={styles.nextStopTextBlock}>
            <Text style={[typography.caption, styles.mutedText]}>
              {DRIVER_LIVE_MESSAGES.nextStop}
            </Text>
            <Text style={typography.heading3}>{nextStop?.stopName || 'End of route'}</Text>
          </View>
          {trackingCard?.etaMinutes !== null && trackingCard?.etaMinutes !== undefined && (
            <View style={styles.etaPill}>
              <Text style={[typography.label, styles.etaText]}>{trackingCard.etaMinutes} min</Text>
            </View>
          )}
        </View>
      </AppCard>

      <View style={styles.statRow}>
        <AppCard style={styles.statCard}>
          <Text style={[typography.caption, styles.mutedText]}>{DRIVER_LIVE_MESSAGES.speed}</Text>
          <Text style={typography.heading2}>
            {lastSpeedKmh === null ? '--' : lastSpeedKmh} km/h
          </Text>
        </AppCard>
        <AppCard style={styles.statCard}>
          <Text style={[typography.caption, styles.mutedText]}>{DRIVER_LIVE_MESSAGES.status}</Text>
          <StatusBadge
            status={trackingStatus}
            label={
              trackingStatus === TRACKING_STATUSES.DELAYED
                ? `Delayed ${trackingCard.delayMinutes} min`
                : undefined
            }
          />
        </AppCard>
      </View>

      {shareErrorMessage.length > 0 && (
        <View style={styles.warningRow}>
          <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.error.dark} />
          <Text style={[typography.bodySmall, styles.warningText]}>{shareErrorMessage}</Text>
        </View>
      )}

      <Text style={[typography.caption, styles.centredMutedText]}>
        {TRACKING_CAPTIONS[trackingStatus]}
      </Text>

      <AppButton
        label={DRIVER_LIVE_MESSAGES.reportDelay}
        variant="secondary"
        size="large"
        isFullWidth
        iconName="alert-circle-outline"
        onPress={() => router.push('/(driver)/delay-report')}
      />
      <AppButton
        label={DRIVER_LIVE_MESSAGES.endTrip}
        variant="outline"
        size="large"
        isFullWidth
        iconName="stop-circle-outline"
        onPress={() => setIsEndDialogVisible(true)}
      />

      <ConfirmDialog
        isVisible={isEndDialogVisible}
        title={DRIVER_LIVE_MESSAGES.endConfirmTitle}
        message={DRIVER_LIVE_MESSAGES.endConfirmMessage}
        confirmLabel={DRIVER_LIVE_MESSAGES.endTrip}
        isDestructive
        isConfirming={isChangingTrip}
        onConfirm={finishTrip}
        onCancel={() => setIsEndDialogVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    paddingHorizontal: sizes.screenGutter,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  dutyPillOn: {
    backgroundColor: colors.success.light,
  },
  dutyDot: {
    width: sizes.unreadDot,
    height: sizes.unreadDot,
    borderRadius: radii.pill,
    backgroundColor: colors.text.disabled,
  },
  dutyDotOn: {
    backgroundColor: colors.success.main,
  },
  dutyText: {
    color: colors.text.primary,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
  },
  gpsText: {
    color: colors.text.secondary,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  centredText: {
    textAlign: 'center',
  },
  centredMutedText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  routeLine: {
    marginTop: spacing.sm,
  },
  notStartedBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  progressCountBlock: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  progressCountText: {
    color: colors.primary[600],
  },
  mapFrame: {
    height: 260,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  nextStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nextStopTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  etaPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.warning.light,
  },
  etaText: {
    color: colors.warning.dark,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    gap: spacing.xs,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.error.light,
  },
  warningText: {
    flex: 1,
    color: colors.error.dark,
  },
});
