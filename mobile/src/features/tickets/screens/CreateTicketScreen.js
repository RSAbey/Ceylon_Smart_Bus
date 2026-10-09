// Book a Ticket (Member 03, FR-06 step 1). Reached two ways: from a route or live map with the bus
// already chosen, or from the "Buy my ticket" button with no bus, which adds a bus-picking step first.
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchTripTracking } from '../../tracking/services/trackingApi';
import { fetchBookableTrips } from '../services/ticketApi';
import { formatDepartureTime, formatFare } from '../formatters';

/**
 * A tappable row showing the chosen stop, or a prompt when nothing is chosen yet.
 * @param {object} props - Component props.
 * @param {string} props.label - Field label, "Getting on" or "Getting off".
 * @param {string} props.iconName - Ionicons name for the row.
 * @param {object} [props.selectedStop] - The chosen stop.
 * @param {string} props.placeholder - Prompt shown when no stop is chosen.
 * @param {Function} props.onPress - Opens the stop picker.
 * @returns {import('react').JSX.Element} The field row.
 */
function StopField({ label, iconName, selectedStop, placeholder, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${selectedStop?.stopName || placeholder}. Tap to change.`}
      style={styles.stopField}
    >
      <Ionicons name={iconName} size={sizes.iconLarge} color={colors.primary[600]} />
      <View style={styles.stopFieldText}>
        <Text style={[typography.caption, styles.mutedText]}>{label}</Text>
        <Text style={typography.bodyLarge}>{selectedStop?.stopName || placeholder}</Text>
      </View>
      <Ionicons name="chevron-down" size={sizes.iconMedium} color={colors.text.secondary} />
    </Pressable>
  );
}

/**
 * Step shown when no bus was chosen yet: every bus currently in service.
 * @param {object} props - Component props.
 * @param {object[]} props.bookableTrips - Buses with seats left.
 * @param {Function} props.onChooseTrip - Called with the chosen trip id.
 * @returns {import('react').JSX.Element} The bus list.
 */
function BusPicker({ bookableTrips, onChooseTrip }) {
  return (
    <View style={styles.busPickerBlock}>
      <Text style={[typography.sectionHeading, styles.mutedText]}>
        {bookableTrips.length} {bookableTrips.length === 1 ? 'bus' : 'buses'} in service now
      </Text>
      {bookableTrips.map((bookableTrip) => (
        <AppCard
          key={bookableTrip.tripId}
          onPress={() => onChooseTrip(bookableTrip.tripId)}
          accessibilityLabel={`Route ${bookableTrip.route.routeNumber}, ${bookableTrip.availableSeats} seats free`}
        >
          <View style={styles.busRow}>
            <View style={styles.routeBadge}>
              <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
            </View>
            <View style={styles.busText}>
              <Text style={typography.heading3}>Bus {bookableTrip.route.routeNumber}</Text>
              <Text style={[typography.bodySmall, styles.mutedText]}>
                {bookableTrip.route.origin} &#8594; {bookableTrip.route.destination}
              </Text>
              <Text style={[typography.caption, styles.mutedText]}>
                {formatDepartureTime(bookableTrip.departsAt)} &#183;{' '}
                {bookableTrip.availableSeats} seats free
              </Text>
            </View>
            <Text style={[typography.heading3, styles.fareText]}>
              {formatFare(bookableTrip.baseFare)}
            </Text>
          </View>
        </AppCard>
      ))}
    </View>
  );
}

/**
 * Ticket booking step one.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function CreateTicketScreen() {
  const router = useRouter();
  const { tripId: tripIdFromRoute } = useLocalSearchParams();

  const [chosenTripId, setChosenTripId] = useState(tripIdFromRoute || '');
  const [bookableTrips, setBookableTrips] = useState([]);
  const [trackingCard, setTrackingCard] = useState(null);
  const [boardingStop, setBoardingStop] = useState(null);
  const [alightingStop, setAlightingStop] = useState(null);
  const [openPickerField, setOpenPickerField] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadScreen = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    // With no bus chosen the screen lists what is running; with one it loads that bus and its stops.
    const loadScreen = chosenTripId
      ? fetchTripTracking(chosenTripId).then((loadedTracking) => {
          if (isEffectActive) setTrackingCard(loadedTracking);
        })
      : fetchBookableTrips().then((loadedTrips) => {
          if (isEffectActive) setBookableTrips(loadedTrips);
        });

    loadScreen
      .then(() => {
        if (isEffectActive) setLoadErrorMessage('');
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
  }, [chosenTripId, reloadCounter]);

  /**
   * Picks a bus and clears any stops chosen for a previous one.
   * @param {string} pickedTripId - Trip the passenger tapped.
   * @returns {void}
   */
  function chooseTrip(pickedTripId) {
    setIsLoading(true);
    setBoardingStop(null);
    setAlightingStop(null);
    setChosenTripId(pickedTripId);
  }

  const screenHeader = (
    <AppHeader
      variant="back"
      title={chosenTripId ? 'Book a Ticket' : 'Choose Your Bus'}
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message={chosenTripId ? 'Loading this bus...' : 'Finding buses in service...'} />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadScreen} />
      </ScreenContainer>
    );
  }

  if (!chosenTripId) {
    if (bookableTrips.length === 0) {
      return (
        <ScreenContainer header={screenHeader}>
          <EmptyState
            iconName="bus-outline"
            title="No buses running right now"
            message="Tickets are sold for buses in service. Check the routes to see when the next one starts."
            actionLabel="Explore routes"
            onActionPress={() => router.replace('/(passenger)/(tabs)/explore')}
          />
        </ScreenContainer>
      );
    }
    return (
      <ScreenContainer isScrollable header={screenHeader}>
        <BusPicker bookableTrips={bookableTrips} onChooseTrip={chooseTrip} />
      </ScreenContainer>
    );
  }

  const stops = trackingCard?.stops || [];
  // The fare is an estimate until the server prices it when the ticket is created.
  const perSeatFare =
    boardingStop && alightingStop
      ? Math.max(0, alightingStop.fareFromOrigin - boardingStop.fareFromOrigin)
      : null;
  const isJourneyBackwards =
    boardingStop && alightingStop && boardingStop.stopSequence >= alightingStop.stopSequence;
  const canContinue = Boolean(boardingStop && alightingStop) && !isJourneyBackwards;

  /**
   * Stores the stop the passenger tapped in whichever field opened the picker.
   * @param {object} pickedStop - The stop tapped in the list.
   * @returns {void}
   */
  function selectStop(pickedStop) {
    if (openPickerField === 'boarding') setBoardingStop(pickedStop);
    if (openPickerField === 'alighting') setAlightingStop(pickedStop);
    setOpenPickerField('');
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <View style={styles.busRow}>
          <View style={styles.routeBadge}>
            <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
          </View>
          <View style={styles.busText}>
            <Text style={typography.heading3}>Bus {trackingCard?.route?.routeNumber}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>
              {trackingCard?.route?.origin} &#8594; {trackingCard?.route?.destination}
            </Text>
          </View>
          {!tripIdFromRoute && (
            <AppButton label="Change" variant="text" size="small" onPress={() => chooseTrip('')} />
          )}
        </View>
      </AppCard>

      <AppCard>
        <StopField
          label="Getting on"
          iconName="radio-button-on-outline"
          selectedStop={boardingStop}
          placeholder="Choose your boarding stop"
          onPress={() => setOpenPickerField('boarding')}
        />
        <View style={styles.fieldDivider} />
        <StopField
          label="Getting off"
          iconName="location-outline"
          selectedStop={alightingStop}
          placeholder="Choose your destination stop"
          onPress={() => setOpenPickerField('alighting')}
        />
      </AppCard>

      {isJourneyBackwards && (
        <View style={styles.warningRow}>
          <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.error.dark} />
          <Text style={[typography.bodySmall, styles.warningText]}>
            This bus reaches your boarding stop after your destination. Swap the two stops.
          </Text>
        </View>
      )}

      {perSeatFare !== null && !isJourneyBackwards && (
        <AppCard>
          <Text style={[typography.sectionHeading, styles.mutedText]}>Fare per seat</Text>
          <Text style={[typography.display, styles.fareText]}>{formatFare(perSeatFare)}</Text>
          <Text style={[typography.caption, styles.mutedText]}>
            Choose your seats next; the total is confirmed by the server when you book.
          </Text>
        </AppCard>
      )}

      <AppButton
        label="Choose seats"
        size="large"
        isFullWidth
        iconName="arrow-forward"
        isDisabled={!canContinue}
        onPress={() =>
          router.push(
            `/(passenger)/seat-selection/${chosenTripId}?boardingStopId=${boardingStop.id}&alightingStopId=${alightingStop.id}`
          )
        }
      />

      <Modal
        visible={Boolean(openPickerField)}
        animationType="slide"
        transparent
        onRequestClose={() => setOpenPickerField('')}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={typography.heading3}>
                {openPickerField === 'boarding' ? 'Where do you get on?' : 'Where do you get off?'}
              </Text>
              <AppButton
                label="Close"
                variant="text"
                size="small"
                onPress={() => setOpenPickerField('')}
              />
            </View>
            <ScrollView>
              {stops.map((routeStop) => (
                <Pressable
                  key={routeStop.id}
                  onPress={() => selectStop(routeStop)}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${routeStop.stopName}`}
                  style={styles.pickerRow}
                >
                  <Text style={typography.bodyLarge}>{routeStop.stopName}</Text>
                  <Text style={[typography.caption, styles.mutedText]}>
                    Stop {routeStop.stopSequence}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  busPickerBlock: {
    gap: spacing.lg,
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
  busText: {
    flex: 1,
    gap: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  stopField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm,
  },
  stopFieldText: {
    flex: 1,
    gap: spacing.xxs,
  },
  fieldDivider: {
    height: sizes.borderThin,
    backgroundColor: colors.border,
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
  fareText: {
    color: colors.primary[600],
    marginVertical: spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalSheet: {
    maxHeight: '75%',
    padding: sizes.screenGutter,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  pickerRow: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    borderBottomWidth: sizes.borderThin,
    borderBottomColor: colors.border,
  },
});
