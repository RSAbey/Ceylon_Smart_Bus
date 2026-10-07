// Seat Selection (Member 03, FR-06 step 2): the bus seat map, 2 + 2 across an aisle.
// Used twice: to finish a new booking, and to move an existing ticket to another seat.
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
import EmptyState from '../../../components/feedback/EmptyState';
import { useToast } from '../../../components/ui/ToastMessage';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchSeatMap } from '../services/seatApi';
import { createTicket, updateTicket } from '../../tickets/services/ticketApi';
import { SEAT_LEGEND, SEAT_MESSAGES, SEAT_SQUARE_SIZE, SEAT_STATES } from '../constants';

/**
 * Works out which of the three states a seat is in.
 * @param {object} seat - A seat from the seat map.
 * @param {string} chosenSeatNumber - The seat the passenger has tapped.
 * @returns {string} One of SEAT_STATES.
 */
function resolveSeatState(seat, chosenSeatNumber) {
  if (seat.seatNumber === chosenSeatNumber) return SEAT_STATES.SELECTED;
  if (seat.isBooked) return SEAT_STATES.BOOKED;
  return SEAT_STATES.AVAILABLE;
}

/**
 * Splits the flat seat list into rows of four so the map can be drawn.
 * @param {object[]} seats - Seats in map order.
 * @param {number} seatsPerRow - How many seats sit across the bus.
 * @returns {Array<object[]>} Seats grouped into rows.
 */
function groupSeatsIntoRows(seats, seatsPerRow) {
  const seatRows = [];
  for (let rowStart = 0; rowStart < seats.length; rowStart += seatsPerRow) {
    seatRows.push(seats.slice(rowStart, rowStart + seatsPerRow));
  }
  return seatRows;
}

/**
 * Seat map screen. With a ticketId it changes that ticket's seat; otherwise it creates the ticket.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function SeatSelectionScreen() {
  const router = useRouter();
  const { tripId, boardingStopId, alightingStopId, ticketId } = useLocalSearchParams();
  const { showSuccessToast, showErrorToast } = useToast();

  const [seatMap, setSeatMap] = useState(null);
  const [chosenSeatNumber, setChosenSeatNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadSeatMap = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);
  const isChangingSeat = Boolean(ticketId);

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
    return () => {
      isEffectActive = false;
    };
  }, [tripId, reloadCounter]);

  /**
   * Books the ticket, or moves the existing ticket, then sends the passenger to the next screen.
   * @returns {Promise<void>} Resolves once the request finishes.
   */
  async function confirmSeat() {
    setIsConfirming(true);
    try {
      if (isChangingSeat) {
        await updateTicket(ticketId, { seatNumber: chosenSeatNumber });
        showSuccessToast(`Moved to seat ${chosenSeatNumber}.`);
        router.replace(`/(passenger)/ticket/${ticketId}`);
        return;
      }
      const ticketView = await createTicket({
        tripId,
        boardingStopId,
        alightingStopId,
        seatNumber: chosenSeatNumber,
      });
      router.replace(`/(passenger)/payment/${ticketView.ticket.id}`);
    } catch (confirmError) {
      showErrorToast(confirmError.message);
      // The seat may have been taken while the passenger was deciding, so show the current map.
      reloadSeatMap();
      setChosenSeatNumber('');
    } finally {
      setIsConfirming(false);
    }
  }

  const screenHeader = (
    <AppHeader
      variant="back"
      title={isChangingSeat ? 'Change Seat' : 'Choose a Seat'}
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

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
  if (seatMap.availableCount === 0) {
    return (
      <ScreenContainer header={screenHeader}>
        <EmptyState
          iconName="bus-outline"
          title={SEAT_MESSAGES.fullBus}
          message="Try the next bus on this route, or track this one and board later."
          actionLabel="Back to the route"
          onActionPress={router.back}
        />
      </ScreenContainer>
    );
  }

  const seatRows = groupSeatsIntoRows(seatMap.seats, seatMap.seatsPerRow);

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <Text style={typography.heading3}>{seatMap.bus.plateNumber}</Text>
        <Text style={[typography.bodySmall, styles.mutedText]}>
          {seatMap.bus.busName} · {seatMap.availableCount} of {seatMap.bus.capacity} seats free
        </Text>
      </AppCard>

      <View style={styles.legendRow}>
        {SEAT_LEGEND.map((legendEntry) => (
          <View key={legendEntry.state} style={styles.legendEntry}>
            <View style={[styles.legendSwatch, styles[`seat_${legendEntry.state}`]]} />
            <Text style={[typography.caption, styles.mutedText]}>{legendEntry.label}</Text>
          </View>
        ))}
      </View>

      <AppCard>
        <View style={styles.frontMarker}>
          <Ionicons name="arrow-up-circle-outline" size={sizes.iconMedium} color={colors.text.secondary} />
          <Text style={[typography.caption, styles.mutedText]}>Front of the bus</Text>
        </View>

        {seatRows.map((seatRow) => (
          <View key={seatRow[0].seatNumber} style={styles.seatRow}>
            {seatRow.map((seat, seatIndexInRow) => {
              const seatState = resolveSeatState(seat, chosenSeatNumber);
              return (
                <View key={seat.seatNumber} style={styles.seatSlot}>
                  {/* The aisle sits between the second and third seat of every row. */}
                  {seatIndexInRow === seatMap.seatsPerRow / 2 && <View style={styles.aisle} />}
                  <Pressable
                    onPress={() => setChosenSeatNumber(seat.seatNumber)}
                    disabled={seat.isBooked}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: seat.isBooked,
                      selected: seatState === SEAT_STATES.SELECTED,
                    }}
                    accessibilityLabel={`Seat ${seat.seatNumber}, ${
                      SEAT_LEGEND.find((legendEntry) => legendEntry.state === seatState).label
                    }`}
                    style={[styles.seatSquare, styles[`seat_${seatState}`]]}
                  >
                    <Text
                      style={[
                        typography.label,
                        seatState === SEAT_STATES.SELECTED && styles.selectedSeatText,
                        seatState === SEAT_STATES.BOOKED && styles.bookedSeatText,
                      ]}
                    >
                      {seat.seatNumber}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </AppCard>

      <Text style={[typography.bodySmall, styles.mutedText]}>
        {chosenSeatNumber ? `Seat ${chosenSeatNumber} selected.` : SEAT_MESSAGES.chooseSeat}
      </Text>

      <AppButton
        label={isChangingSeat ? 'Move to this seat' : 'Confirm and pay'}
        size="large"
        isFullWidth
        iconName="arrow-forward"
        isLoading={isConfirming}
        isDisabled={!chosenSeatNumber}
        onPress={confirmSeat}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  legendEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    width: sizes.iconMedium,
    height: sizes.iconMedium,
    borderRadius: radii.sm,
  },
  frontMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: sizes.borderThin,
    borderBottomColor: colors.border,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  seatSlot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aisle: {
    width: spacing.xxl,
  },
  seatSquare: {
    width: SEAT_SQUARE_SIZE,
    height: SEAT_SQUARE_SIZE,
    margin: spacing.xxs,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: sizes.borderThin,
  },
  seat_available: {
    backgroundColor: colors.surface,
    borderColor: colors.primary[500],
  },
  seat_selected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  seat_booked: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  selectedSeatText: {
    color: colors.text.onColor,
  },
  bookedSeatText: {
    color: colors.text.disabled,
  },
});
