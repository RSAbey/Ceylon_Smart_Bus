// Live Tracking (Member 02, screens 10 to 12): map with the bus and its stops, plus the arrival card.
// Polls every 5 s so the shown position is never more than about 10 s old (NFR-01).
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import RouteMap from '../components/RouteMap';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import usePolling from '../../../hooks/usePolling';
import { TRACKING_POLL_INTERVAL_MS } from '../../../utils/constants';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchTripTracking } from '../services/trackingApi';
import {
  NO_ETA_PLACEHOLDER,
  TRACKING_CAPTIONS,
  TRACKING_STATUSES,
} from '../constants';

const SECONDS_PER_MINUTE = 60;

/**
 * Turns the position age into the "updated 20 sec ago" line.
 * @param {number | null} positionAgeSeconds - How old the position is.
 * @returns {string} Human-readable freshness.
 */
function formatPositionAge(positionAgeSeconds) {
  if (positionAgeSeconds === null || positionAgeSeconds === undefined) return 'no position yet';
  if (positionAgeSeconds < SECONDS_PER_MINUTE) return `updated ${positionAgeSeconds} sec ago`;
  return `updated ${Math.floor(positionAgeSeconds / SECONDS_PER_MINUTE)} min ago`;
}

/**
 * Live tracking for one bus.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function LiveTrackingScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trackingCard, setTrackingCard] = useState(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const refreshTracking = useCallback(() => {
    fetchTripTracking(tripId)
      .then((loadedTracking) => {
        setTrackingCard(loadedTracking);
        setLoadErrorMessage('');
      })
      .catch((loadError) => setLoadErrorMessage(loadError.message))
      .finally(() => setHasLoadedOnce(true));
  }, [tripId]);

  usePolling(refreshTracking, TRACKING_POLL_INTERVAL_MS);

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Live Tracking"
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (!hasLoadedOnce) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Finding your bus..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage && !trackingCard) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={refreshTracking} />
      </ScreenContainer>
    );
  }

  const stops = trackingCard?.stops || [];
  const busPosition = trackingCard?.position;
  const isDisrupted = trackingCard?.status === TRACKING_STATUSES.DISRUPTED;

  return (
    <ScreenContainer hasPadding={false} header={screenHeader}>
      <RouteMap
        style={styles.map}
        stops={stops}
        currentStopId={trackingCard?.currentStopId}
        busPosition={busPosition}
        busLabel={`Bus ${trackingCard?.route?.routeNumber}`}
        accessibilityLabel={`Map showing route ${trackingCard?.route?.routeNumber}`}
      />

      <View style={styles.cardWrapper}>
        <AppCard>
          <View style={styles.routeRow}>
            <View style={styles.routeBadge}>
              <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
            </View>
            <Text style={typography.heading3}>{trackingCard?.route?.routeNumber}</Text>
            <Text style={[typography.bodyMedium, styles.mutedText]}>
              {trackingCard?.route?.origin} → {trackingCard?.route?.destination}
            </Text>
          </View>

          <View style={styles.etaRow}>
            <Text style={[typography.display, styles.etaNumber]}>
              {isDisrupted || trackingCard?.etaMinutes === null
                ? NO_ETA_PLACEHOLDER
                : trackingCard?.etaMinutes}
            </Text>
            <Text style={[typography.bodyMedium, styles.etaUnit]}>min</Text>
            <Text style={[typography.label, styles.mutedText]}>Estimated arrival</Text>
          </View>

          <Text style={[typography.bodyMedium, styles.captionText]}>
            {TRACKING_CAPTIONS[trackingCard?.status] || TRACKING_CAPTIONS[TRACKING_STATUSES.DISRUPTED]}
          </Text>

          <View style={styles.footerRow}>
            <StatusBadge
              status={trackingCard?.status || TRACKING_STATUSES.DISRUPTED}
              label={
                trackingCard?.status === TRACKING_STATUSES.DELAYED
                  ? `Delayed ${trackingCard.delayMinutes} min`
                  : undefined
              }
            />
            <View style={styles.freshnessRow}>
              <Ionicons name="time-outline" size={sizes.iconSmall} color={colors.text.secondary} />
              <Text style={[typography.caption, styles.mutedText]}>
                {formatPositionAge(trackingCard?.positionAgeSeconds)}
              </Text>
            </View>
          </View>

          {/* The passenger is watching this exact bus, so booking a ticket on it is one tap (Member 03). */}
          <AppButton
            label="Buy a ticket for this bus"
            variant="secondary"
            size="large"
            isFullWidth
            iconName="ticket-outline"
            style={styles.bookButton}
            onPress={() => router.push(`/(passenger)/ticket/new?tripId=${tripId}`)}
          />
        </AppCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  cardWrapper: {
    padding: sizes.screenGutter,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routeBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    color: colors.text.secondary,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  etaNumber: {
    color: colors.primary[600],
  },
  etaUnit: {
    color: colors.primary[600],
  },
  captionText: {
    marginTop: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
  },
  bookButton: {
    marginTop: spacing.md,
  },
  freshnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
