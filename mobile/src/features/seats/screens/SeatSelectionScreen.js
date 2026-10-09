// Select Seats (Member 03, FR-06): the bus seat map, 2 + 2 across an aisle, with the row number
// down the middle. Several seats can go on one ticket, so a group travels on one fare.
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
import { groupSeatsIntoRows } from '../seatRows';
import { createTicket, updateTicket } from '../../tickets/services/ticketApi';
import { CURRENCY_PREFIX } from '../../tickets/constants';
import { formatDepartureTime } from '../../tickets/formatters';
import {
  AISLE_WIDTH,
  SEAT_LEGEND,
  SEAT_MESSAGES,
  SEAT_SQUARE_SIZE,
  SEAT_STATES,
  describeSeatCount,
} from '../constants';

/**
 * Works out which of the three states a seat is in.
 * @param {object} seat - A seat from the seat map.
 * @param {string[]} chosenSeatNumbers - Seats the passenger has tapped.
 * @returns {string} One of SEAT_STATES.
 */
function resolveSeatState(seat, chosenSeatNumbers) {
  if (chosenSeatNumbers.includes(seat.seatNumber)) return SEAT_STATES.SELECTED;
  if (seat.isBooked) return SEAT_STATES.BOOKED;
  return SEAT_STATES.AVAILABLE;
}

/**
 * One tappable seat square.
 * @param {object} props - Component props.
 * @param {object} props.seat - The seat to draw.
 * @param {string} props.seatState - One of SEAT_STATES.
 * @param {Function} props.onPress - Called when a free seat is tapped.
 * @returns {import('react').JSX.Element} The seat square.
 */
function SeatSquare({ seat, seatState, onPress }) {
  const stateLabel = SEAT_LEGEND.find((legendEntry) => legendEntry.state === seatState).label;
  return (
    <Pressable
      onPress={onPress}
      disabled={seat.isBooked}
      accessibilityRole="checkbox"
      accessibilityState={{ disabled: seat.isBooked, checked: seatState === SEAT_STATES.SELECTED }}
      accessibilityLabel={`Seat ${seat.seatNumber}, ${stateLabel}`}
      style={[styles.seatSquare, styles[`seat_${seatState}`]]}
    >
      {seatState === SEAT_STATES.BOOKED ? (
        <Ionicons name="close" size={sizes.iconMedium} color={colors.text.disabled} />
      ) : (
        <Text
          style={[typography.label, seatState === SEAT_STATES.SELECTED && styles.selectedSeatText]}
        >
          {seat.seatNumber}
        </Text>
      )}
      {seatState === SEAT_STATES.SELECTED && (
        <View style={styles.seatCheck}>
          <Ionicons name="checkmark-circle" size={sizes.iconSmall} color={colors.surface} />
        </View>
      )}
    </Pressable>
  );
}

/**
 * Seat map screen. With a ticketId it changes that ticket's seats; otherwise it creates the ticket.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function SeatSelectionScreen() {
  const router = useRouter();
  const { tripId, boardingStopId, alightingStopId, ticketId } = useLocalSearchParams();
  const { showErrorToast, showSuccessToast } = useToast();

  const [seatMap, setSeatMap] = useState(null);
  const [chosenSeatNumbers, setChosenSeatNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadSeatMap = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);
  const isChangingSeats = Boolean(ticketId);

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
   * Adds or removes a seat from the selection, keeping it in map order.
   * @param {string} seatNumber - Seat that was tapped.
   * @returns {void}
   */
  function toggleSeat(seatNumber) {
    setChosenSeatNumbers((previousSeats) => {
      if (previousSeats.includes(seatNumber)) {
        return previousSeats.filter((previousSeat) => previousSeat !== seatNumber);
      }
      if (previousSeats.length >= seatMap.maxSeatsPerTicket) {
        showErrorToast(`One ticket can hold at most ${seatMap.maxSeatsPerTicket} seats.`);
        return previousSeats;
      }
      return [...previousSeats, seatNumber].sort();
    });
  }

  /**
   * Books the ticket, or moves the existing ticket, then sends the passenger to the next screen.
   * @returns {Promise<void>} Resolves once the request finishes.
   */
  async function confirmSeats() {
    setIsConfirming(true);
    try {
      if (isChangingSeats) {
        await updateTicket(ticketId, { seatNumbers: chosenSeatNumbers });
        showSuccessToast(`Moved to ${chosenSeatNumbers.join(', ')}.`);
        router.replace(`/(passenger)/ticket/${ticketId}`);
        return;
      }
      const ticketView = await createTicket({
        tripId,
        boardingStopId,
        alightingStopId,
        seatNumbers: chosenSeatNumbers,
      });
      router.replace(`/(passenger)/payment/${ticketView.ticket.id}`);
    } catch (confirmError) {
      showErrorToast(confirmError.message);
      // A seat may have been taken while the passenger was deciding, so show the current map.
      reloadSeatMap();
      setChosenSeatNumbers([]);
    } finally {
      setIsConfirming(false);
    }
  }

  const screenHeader = (
    <AppHeader
      variant="back"
      title={isChangingSeats ? 'Change Seats' : 'Select Seats'}
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
  if (seatMap.availableCount === 0 && !isChangingSeats) {
    return (
      <ScreenContainer header={screenHeader}>
        <EmptyState
          iconName="bus-outline"
          title={SEAT_MESSAGES.fullBus}
          message="Try the next bus on this route, or track this one and board later."
          actionLabel="Back to the bus"
          onActionPress={router.back}
        />
      </ScreenContainer>
    );
  }

  const seatRows = groupSeatsIntoRows(seatMap.seats, seatMap.seatsPerRow);
  const perSeatFare = seatMap.route?.baseFare || 0;
  const totalFare = perSeatFare * chosenSeatNumbers.length;
  const halfRow = seatMap.seatsPerRow / 2;

  return (
    <ScreenContainer
      isScrollable
      header={screenHeader}
      footer={
        <View style={styles.summaryBar}>
          <View style={styles.summaryTextBlock}>
            <Text style={typography.bodyLarge}>{describeSeatCount(chosenSeatNumbers)}</Text>
            <Text style={[typography.caption, styles.mutedText]}>
              {chosenSeatNumbers.length > 0
                ? `Seats ${chosenSeatNumbers.join(', ')}`
                : SEAT_MESSAGES.chooseSeat}
            </Text>
          </View>
          <View style={styles.summaryTotalBlock}>
            <Text style={[typography.caption, styles.mutedText]}>Total</Text>
            <Text style={typography.heading3}>
              {CURRENCY_PREFIX} {totalFare}
            </Text>
          </View>
        </View>
      }
    >
      <AppCard>
        <View style={styles.busRow}>
          <View style={styles.busBadge}>
            <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
          </View>
          <View style={styles.busTextBlock}>
            <Text style={typography.heading3}>{seatMap.bus.plateNumber}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>
              {seatMap.route?.origin} &#8594; {seatMap.route?.destination}
            </Text>
            <Text style={[typography.caption, styles.mutedText]}>
              {formatDepartureTime(seatMap.departsAt)}
            </Text>
          </View>
          <View style={styles.farePerSeatBlock}>
            <Text style={typography.heading3}>
              {CURRENCY_PREFIX} {perSeatFare}
            </Text>
            <Text style={[typography.caption, styles.mutedText]}>per seat</Text>
          </View>
        </View>
      </AppCard>

      <View style={styles.legendRow}>
        {SEAT_LEGEND.map((legendEntry) => (
          <View key={legendEntry.state} style={styles.legendEntry}>
            <View style={[styles.legendSwatch, styles[`seat_${legendEntry.state}`]]}>
              <Ionicons
                name={legendEntry.iconName}
                size={sizes.iconSmall}
                color={
                  legendEntry.state === SEAT_STATES.SELECTED
                    ? colors.surface
                    : legendEntry.state === SEAT_STATES.BOOKED
                      ? colors.text.disabled
                      : colors.text.secondary
                }
              />
            </View>
            <Text style={[typography.bodySmall, styles.mutedText]}>{legendEntry.label}</Text>
          </View>
        ))}
      </View>

      <AppCard>
        <View style={styles.frontRow}>
          <Text style={[typography.caption, styles.mutedText]}>{SEAT_MESSAGES.frontOfBus}</Text>
          <View style={styles.driverBlock}>
            <Text style={[typography.caption, styles.mutedText]}>{SEAT_MESSAGES.driver}</Text>
            <Ionicons
              name="person-circle-outline"
              size={sizes.iconLarge}
              color={colors.text.secondary}
            />
          </View>
        </View>

        {seatRows.map((seatRow, rowIndex) => (
          <View key={seatRow[0].seatNumber} style={styles.seatRow}>
            {seatRow.slice(0, halfRow).map((seat) => (
              <SeatSquare
                key={seat.seatNumber}
                seat={seat}
                seatState={resolveSeatState(seat, chosenSeatNumbers)}
                onPress={() => toggleSeat(seat.seatNumber)}
              />
            ))}
            {/* The aisle carries the row number, exactly as a conductor reads the bus. */}
            <View style={styles.aisle}>
              <Text style={[typography.caption, styles.mutedText]}>{rowIndex + 1}</Text>
            </View>
            {seatRow.slice(halfRow).map((seat) => (
              <SeatSquare
                key={seat.seatNumber}
                seat={seat}
                seatState={resolveSeatState(seat, chosenSeatNumbers)}
                onPress={() => toggleSeat(seat.seatNumber)}
              />
            ))}
          </View>
        ))}
      </AppCard>

      <AppButton
        label={isChangingSeats ? 'Move to these seats' : 'Continue'}
        size="large"
        isFullWidth
        isLoading={isConfirming}
        isDisabled={chosenSeatNumbers.length === 0}
        onPress={confirmSeats}
      />
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
  busBadge: {
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
  farePerSeatBlock: {
    alignItems: 'flex-end',
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
    width: sizes.iconXLarge,
    height: sizes.iconXLarge,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: sizes.borderThin,
  },
  frontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: sizes.borderThin,
    borderBottomColor: colors.border,
  },
  driverBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    margin: spacing.xxs,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: sizes.borderThin,
  },
  seatCheck: {
    position: 'absolute',
    top: spacing.xxs,
    right: spacing.xxs,
  },
  seat_available: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: sizes.screenGutter,
    paddingVertical: spacing.md,
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  summaryTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  summaryTotalBlock: {
    alignItems: 'flex-end',
  },
});
