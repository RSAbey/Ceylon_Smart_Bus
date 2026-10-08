// Bookings (Member 03): who has reserved a seat on the run the driver is on, and the switch that
// closes the bus to new reservations when it is getting full.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { useToast } from '../../../components/ui/ToastMessage';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { getNameInitials } from '../../../utils/formatters';
import { fetchTripBookings, setAcceptingBookings } from '../services/seatApi';
import { BOOKING_BADGES, BOOKING_MESSAGES } from '../constants';

const PERCENT_SCALE = 100;

/**
 * The driver's booking overview for the trip they are running.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DriverBookingsScreen() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToast();

  const [bookingOverview, setBookingOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isTogglingBookings, setIsTogglingBookings] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadBookings = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // Passengers book while the bus is moving, so refresh whenever the tab comes back into view.
  useFocusEffect(reloadBookings);

  useEffect(() => {
    let isEffectActive = true;
    fetchTripBookings()
      .then((loadedOverview) => {
        if (!isEffectActive) return;
        setBookingOverview(loadedOverview);
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

  const toggleBookings = async (isAccepting) => {
    setIsTogglingBookings(true);
    try {
      const updatedOverview = await setAcceptingBookings(isAccepting);
      setBookingOverview(updatedOverview);
      showSuccessToast(
        isAccepting ? 'Taking seat reservations again.' : 'This bus is now walk-on only.'
      );
    } catch (toggleError) {
      showErrorToast(toggleError.message);
    } finally {
      setIsTogglingBookings(false);
    }
  };

  const screenHeader = (
    <View style={styles.header}>
      <View style={styles.headerTextBlock}>
        <Text style={typography.heading2}>{BOOKING_MESSAGES.title}</Text>
        {bookingOverview?.route && (
          <Text style={[typography.bodySmall, styles.mutedText]}>
            Route {bookingOverview.route.routeNumber}, {bookingOverview.route.origin} &#8594;{' '}
            {bookingOverview.route.destination}
          </Text>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading bookings..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <EmptyState
          iconName="list-outline"
          title="No trip running"
          message={loadErrorMessage}
          actionLabel="Go to my trip"
          onActionPress={() => router.push('/(driver)/(tabs)/live')}
        />
      </ScreenContainer>
    );
  }
  if (!bookingOverview) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={BOOKING_MESSAGES.noTrip} onRetry={reloadBookings} />
      </ScreenContainer>
    );
  }

  const { totalSeats, bookedSeats, availableSeats, bookings, isAcceptingBookings } = bookingOverview;
  const bookedPercent = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * PERCENT_SCALE) : 0;

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard style={styles.acceptCard}>
        <View style={styles.acceptRow}>
          <View style={styles.acceptTextBlock}>
            <Text style={typography.bodyLarge}>{BOOKING_MESSAGES.acceptTitle}</Text>
            <Text style={[typography.caption, styles.mutedText]}>
              {BOOKING_MESSAGES.acceptHint}
            </Text>
          </View>
          <Switch
            value={isAcceptingBookings}
            onValueChange={toggleBookings}
            disabled={isTogglingBookings}
            accessibilityLabel="Accept new bookings on this trip"
            trackColor={{ true: colors.success.main, false: colors.border }}
          />
        </View>
      </AppCard>

      <Text style={[typography.sectionHeading, styles.mutedText]}>
        {BOOKING_MESSAGES.availabilityHeading}
      </Text>

      <AppCard>
        <View style={styles.countRow}>
          <View style={styles.countBlock}>
            <Text style={[typography.caption, styles.mutedText]}>Total</Text>
            <Text style={typography.heading2}>{totalSeats}</Text>
          </View>
          <View style={styles.countBlock}>
            <Text style={[typography.caption, styles.mutedText]}>Booked</Text>
            <Text style={typography.heading2}>{bookedSeats}</Text>
          </View>
          <View style={styles.countBlock}>
            <Text style={[typography.caption, styles.mutedText]}>Available</Text>
            <Text style={[typography.heading2, styles.availableText]}>{availableSeats}</Text>
          </View>
        </View>

        {/* The bar repeats what the numbers above already say, so it is decorative (NFR-09). */}
        <View
          style={styles.capacityTrack}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={[styles.capacityFill, { width: `${bookedPercent}%` }]} />
        </View>
      </AppCard>

      <Text style={[typography.sectionHeading, styles.mutedText]}>
        {BOOKING_MESSAGES.todaysHeading}
      </Text>

      {bookings.length === 0 ? (
        <Text style={[typography.bodySmall, styles.mutedText]}>{BOOKING_MESSAGES.noBookings}</Text>
      ) : (
        bookings.map((booking) => {
          const bookingBadge = BOOKING_BADGES[booking.bookingStatus];
          return (
            <AppCard key={booking.ticketId}>
              <View style={styles.bookingRow}>
                <View style={styles.avatarCircle}>
                  <Text style={[typography.label, styles.avatarText]}>
                    {getNameInitials(booking.passengerName)}
                  </Text>
                </View>
                <View style={styles.bookingTextBlock}>
                  <Text style={typography.bodyLarge}>{booking.passengerName}</Text>
                  <Text style={[typography.caption, styles.mutedText]}>
                    {booking.seatNumbers.length === 1 ? 'Seat' : 'Seats'}{' '}
                    {booking.seatNumbers.join(', ')} &#183; Boarding: {booking.boardingStopName}
                  </Text>
                </View>
                <StatusBadge status={bookingBadge.status} label={bookingBadge.label} />
              </View>
            </AppCard>
          );
        })
      )}

      {!isAcceptingBookings && (
        <View style={styles.noticeRow}>
          <Ionicons
            name="information-circle-outline"
            size={sizes.iconMedium}
            color={colors.information.dark}
          />
          <Text style={[typography.caption, styles.noticeText]}>{BOOKING_MESSAGES.closedNote}</Text>
        </View>
      )}

      <AppButton
        label="Open the seat map"
        variant="outline"
        isFullWidth
        iconName="grid-outline"
        onPress={() => router.push(`/(driver)/seat-map/${bookingOverview.tripId}`)}
      />
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
  headerTextBlock: {
    gap: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  acceptCard: {
    backgroundColor: colors.information.light,
  },
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  acceptTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  countBlock: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  availableText: {
    color: colors.success.dark,
  },
  capacityTrack: {
    height: sizes.unreadDot,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.primary[500],
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text.onColor,
  },
  bookingTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.information.light,
  },
  noticeText: {
    flex: 1,
    color: colors.information.dark,
  },
});
