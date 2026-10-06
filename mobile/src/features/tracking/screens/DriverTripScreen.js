// Driver Trip screen (Member 02): start and end a run, and share the bus position while it is running.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import usePolling from '../../../hooks/usePolling';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { endTrip, fetchMyTripOverview, postBusLocation, startTrip } from '../services/trackingApi';
import { DRIVER_LOCATION_INTERVAL_MS } from '../constants';

/**
 * Driver trip control. While a trip runs the screen reports the bus position every few seconds,
 * which is what passengers see on the live map (FR-02, NFR-01).
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DriverTripScreen() {
  const { showSuccessToast, showErrorToast } = useToast();

  const [tripOverview, setTripOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isChangingTrip, setIsChangingTrip] = useState(false);
  const [isEndDialogVisible, setIsEndDialogVisible] = useState(false);
  const [lastSharedAt, setLastSharedAt] = useState(null);
  const [shareErrorMessage, setShareErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadTrip = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

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

  const shareCurrentPosition = useCallback(async () => {
    if (!tripOverview?.trip) return;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setShareErrorMessage('Allow location access so passengers can see this bus.');
        return;
      }
      const devicePosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await postBusLocation(tripOverview.trip.id, {
        latitude: devicePosition.coords.latitude,
        longitude: devicePosition.coords.longitude,
        speedKmh: devicePosition.coords.speed > 0 ? devicePosition.coords.speed * 3.6 : undefined,
      });
      setLastSharedAt(new Date());
      setShareErrorMessage('');
    } catch (shareError) {
      setShareErrorMessage(shareError.message);
    }
  }, [tripOverview]);

  // Only report a position while a trip is actually running.
  usePolling(shareCurrentPosition, DRIVER_LOCATION_INTERVAL_MS);

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
      reloadTrip();
    } catch (endError) {
      showErrorToast(endError.message);
    } finally {
      setIsChangingTrip(false);
    }
  };

  const screenHeader = <AppHeader variant="back" title="My Trip" />;

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

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <View style={styles.headerRow}>
          <View style={styles.routeBadge}>
            <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={typography.heading3}>{bus.plateNumber}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>{bus.busName}</Text>
          </View>
          <StatusBadge
            status={isTripRunning ? 'active' : 'cancelled'}
            label={isTripRunning ? 'On trip' : 'Not started'}
          />
        </View>

        {route ? (
          <Text style={typography.bodyLarge}>
            Route {route.routeNumber} · {route.origin} → {route.destination}
          </Text>
        ) : (
          <Text style={[typography.bodyMedium, styles.mutedText]}>No route assigned to this bus yet.</Text>
        )}
        <Text style={[typography.bodySmall, styles.mutedText]}>{stops.length} stops on this route</Text>
      </AppCard>

      {isTripRunning && (
        <AppCard>
          <Text style={[typography.sectionHeading, styles.mutedText]}>Sharing position</Text>
          <View style={styles.sharingRow}>
            <Ionicons
              name={shareErrorMessage ? 'alert-circle' : 'radio'}
              size={sizes.iconLarge}
              color={shareErrorMessage ? colors.error.dark : colors.success.dark}
            />
            <Text style={[typography.bodyMedium, styles.sharingText]}>
              {shareErrorMessage ||
                (lastSharedAt
                  ? `Position shared at ${lastSharedAt.toLocaleTimeString()}`
                  : 'Starting to share your position...')}
            </Text>
          </View>
        </AppCard>
      )}

      {isTripRunning ? (
        <AppButton
          label="End trip"
          variant="error"
          size="large"
          isFullWidth
          iconName="stop-circle-outline"
          onPress={() => setIsEndDialogVisible(true)}
        />
      ) : (
        <AppButton
          label="Start trip"
          size="large"
          isFullWidth
          iconName="play-circle-outline"
          isLoading={isChangingTrip}
          isDisabled={!route}
          onPress={beginTrip}
        />
      )}

      <ConfirmDialog
        isVisible={isEndDialogVisible}
        title="End this trip?"
        message="Passengers will stop seeing this bus on the live map."
        confirmLabel="End trip"
        isDestructive
        isConfirming={isChangingTrip}
        onConfirm={finishTrip}
        onCancel={() => setIsEndDialogVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
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
  headerTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  sharingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  sharingText: {
    flex: 1,
  },
});
