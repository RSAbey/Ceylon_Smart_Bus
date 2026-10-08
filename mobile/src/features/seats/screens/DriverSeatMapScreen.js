// Seat map (driver app, Member 03): which seats are taken on the run the driver is on. Read only —
// the passenger's Select Seats screen books a seat and charges a fare, which is not the driver's
// job, so this screen shows the same 2 + 2 layout without any of the selling.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchSeatMap } from '../services/seatApi';
import { AISLE_WIDTH, SEAT_MESSAGES, SEAT_SQUARE_SIZE } from '../constants';

/** The two states a seat can be in on this screen; the driver never selects one. */
const DRIVER_SEAT_LEGEND = Object.freeze([
  { isBooked: false, label: 'Free', iconName: 'square-outline' },
  { isBooked: true, label: 'Taken', iconName: 'close' },
]);

/**
 * One seat square. The icon says the state as well as the colour does (NFR-09).
 * @param {object} props - Component props.
 * @param {object} props.seat - Seat with its number and whether it is booked.
 * @returns {import('react').JSX.Element} The square.
 */
function SeatSquare({ seat }) {
  return (
    <View
      style={[styles.seatSquare, seat.isBooked ? styles.seatBooked : styles.seatFree]}
      accessibilityLabel={`Seat ${seat.seatNumber}, ${seat.isBooked ? 'taken' : 'free'}`}
    >
      <Ionicons
        name={seat.isBooked ? 'close' : 'square-outline'}
        size={sizes.iconSmall}
        color={seat.isBooked ? colors.text.onColor : colors.text.secondary}
      />
      <Text
        style={[
          typography.caption,
          seat.isBooked ? styles.seatBookedText : styles.seatFreeText,
        ]}
      >
        {seat.seatNumber}
      </Text>
    </View>
  );
}

/**
 * Read-only seat map for the driver's current trip.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DriverSeatMapScreen() {
  const { tripId } = useLocalSearchParams();
  const [seatMap, setSeatMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadSeatMap = useCallback(
    () => setReloadCounter((previousCount) => previousCount + 1),
    []
  );

  useEffect(() => {
    let isEffectActive = true;
    fetchSeatMap(tripId)
      .then((loadedSeatMap) => {
        if (!isEffectActive) return;
        setSeatMap(loadedSeatMap);
        setLoadErrorMessage('');
      })
      .catch((loadError) => {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
      });
    // Ignore a reply that arrives after the screen has moved on.
    return () => {
      isEffectActive = false;
    };
  }, [tripId, reloadCounter]);

  const screenHeader = <AppHeader title="Seat map" hasBackButton />;

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading the seat map..." />
      </ScreenContainer>
    );
  }

  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadSeatMap} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={screenHeader} isScrollable>
      <AppCard>
        <Text style={typography.heading3}>
          {seatMap.bus?.busName} · {seatMap.bus?.plateNumber}
        </Text>
        <Text style={[typography.bodyMedium, styles.mutedText]}>
          Route {seatMap.route?.routeNumber} · {seatMap.bookedCount} of {seatMap.bus?.capacity}{' '}
          seats taken · {seatMap.availableCount} free
        </Text>
      </AppCard>

      <View style={styles.legendRow}>
        {DRIVER_SEAT_LEGEND.map((legendEntry) => (
          <View key={legendEntry.label} style={styles.legendEntry}>
            <View
              style={[
                styles.legendSwatch,
                legendEntry.isBooked ? styles.seatBooked : styles.seatFree,
              ]}
            >
              <Ionicons
                name={legendEntry.iconName}
                size={sizes.iconSmall}
                color={legendEntry.isBooked ? colors.text.onColor : colors.text.secondary}
              />
            </View>
            <Text style={[typography.caption, styles.mutedText]}>{legendEntry.label}</Text>
          </View>
        ))}
      </View>

      <AppCard>
        <Text style={[typography.caption, styles.mutedText, styles.frontLabel]}>
          {SEAT_MESSAGES.frontOfBus}
        </Text>
        {seatMap.seats.map((seatRow, rowIndex) => {
          const halfRow = Math.ceil(seatRow.length / 2);
          return (
            <View key={seatRow[0]?.seatNumber || rowIndex} style={styles.seatRow}>
              {seatRow.slice(0, halfRow).map((seat) => (
                <SeatSquare key={seat.seatNumber} seat={seat} />
              ))}
              {/* The aisle carries the row number, exactly as a conductor reads the bus. */}
              <View style={styles.aisle}>
                <Text style={[typography.caption, styles.mutedText]}>{rowIndex + 1}</Text>
              </View>
              {seatRow.slice(halfRow).map((seat) => (
                <SeatSquare key={seat.seatNumber} seat={seat} />
              ))}
            </View>
          );
        })}
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  legendEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendSwatch: {
    width: sizes.iconLarge,
    height: sizes.iconLarge,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  frontLabel: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  aisle: {
    width: AISLE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatSquare: {
    width: SEAT_SQUARE_SIZE,
    height: SEAT_SQUARE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: sizes.borderThin,
  },
  seatFree: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  seatFreeText: {
    color: colors.text.secondary,
  },
  seatBooked: {
    backgroundColor: colors.text.disabled,
    borderColor: colors.text.disabled,
  },
  seatBookedText: {
    color: colors.text.onColor,
  },
});
