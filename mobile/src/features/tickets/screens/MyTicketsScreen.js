// My Tickets (Member 03, FR-05): the ticket the passenger is about to travel on, then the ones
// behind them. Split this way because a passenger opening this screen at a bus stop wants one
// thing: the QR code for the journey they are about to make.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { useAuth } from '../../../context/AuthContext';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchMyTickets } from '../services/ticketApi';
import { formatDepartureTime, formatFare } from '../formatters';
import {
  BUY_TICKET_LABEL,
  OFFLINE_PILL,
  TICKET_BADGES,
  TICKET_STATUSES,
  TICKETS_EMPTY,
  UNPAID_BADGE,
} from '../constants';

/**
 * A ticket is "upcoming" while it can still be used: active, and paid or waiting to be paid.
 * @param {object} ticketView - A ticket from the API.
 * @returns {boolean} True when it belongs in the Upcoming section.
 */
function isUpcomingTicket(ticketView) {
  return ticketView.ticket.status === TICKET_STATUSES.ACTIVE;
}

/**
 * The passenger's ticket list.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function MyTicketsScreen() {
  const router = useRouter();
  const drawer = useDrawer();
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadTickets = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // Buying, paying for and cancelling tickets all happen on other screens, so refresh on focus.
  useFocusEffect(reloadTickets);

  useEffect(() => {
    let isEffectActive = true;
    fetchMyTickets()
      .then((loadedTickets) => {
        if (!isEffectActive) return;
        setTickets(loadedTickets);
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
      <View style={styles.headerTextBlock}>
        <Text style={typography.heading2}>My Tickets</Text>
        <Text style={[typography.bodySmall, styles.mutedText]}>
          Hi, {user?.fullName?.split(' ')[0] || 'there'}
        </Text>
      </View>
      {drawer && (
        <AppButton
          label="Menu"
          variant="text"
          size="small"
          iconName="menu"
          accessibilityLabel="Open menu"
          onPress={drawer.openDrawer}
        />
      )}
    </View>
  );

  const bookSeatButton = (
    <AppButton
      label={BUY_TICKET_LABEL}
      variant="secondary"
      size="large"
      isFullWidth
      iconName="ticket-outline"
      accessibilityLabel="Book a seat: choose a bus and seats"
      onPress={() => router.push('/(passenger)/ticket/new')}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your tickets..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadTickets} />
      </ScreenContainer>
    );
  }
  if (tickets.length === 0) {
    return (
      <ScreenContainer header={screenHeader}>
        <EmptyState
          iconName="ticket-outline"
          title={TICKETS_EMPTY.title}
          message={TICKETS_EMPTY.message}
          actionLabel={TICKETS_EMPTY.actionLabel}
          onActionPress={() => router.push('/(passenger)/ticket/new')}
        />
      </ScreenContainer>
    );
  }

  const upcomingTickets = tickets.filter(isUpcomingTicket);
  const pastTickets = tickets.filter((ticketView) => !isUpcomingTicket(ticketView));

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <Text style={[typography.sectionHeading, styles.mutedText]}>Upcoming</Text>

      {upcomingTickets.length === 0 ? (
        <AppCard>
          <View style={styles.noUpcomingBlock}>
            <Ionicons name="ticket-outline" size={sizes.iconHuge} color={colors.text.secondary} />
            <Text style={[typography.bodyMedium, styles.centredMutedText]}>
              No ticket for an upcoming journey.
            </Text>
          </View>
        </AppCard>
      ) : (
        upcomingTickets.map((ticketView) => {
          const ticketBadge = TICKET_BADGES[ticketView.ticket.status];
          const isAwaitingPayment = !ticketView.isPaid;
          return (
            <AppCard key={ticketView.ticket.id}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.routeBadge}>
                  <Ionicons name="bus" size={sizes.iconMedium} color={colors.primary[600]} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={typography.heading3}>Bus {ticketView.route?.routeNumber}</Text>
                  <Text style={[typography.bodySmall, styles.mutedText]}>
                    {ticketView.boardingStop?.stopName} &#8594;{' '}
                    {ticketView.alightingStop?.stopName}
                  </Text>
                </View>
                <StatusBadge
                  status={isAwaitingPayment ? UNPAID_BADGE.status : ticketBadge.status}
                  label={isAwaitingPayment ? UNPAID_BADGE.label : ticketBadge.label}
                />
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailGrid}>
                <View style={styles.detailBlock}>
                  <Text style={[typography.caption, styles.mutedText]}>Departs</Text>
                  <Text style={typography.bodyMedium}>
                    {formatDepartureTime(ticketView.departsAt)}
                  </Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={[typography.caption, styles.mutedText]}>
                    {ticketView.seatNumbers.length === 1 ? 'Seat' : 'Seats'}
                  </Text>
                  <Text style={typography.bodyMedium}>
                    {ticketView.seatNumbers.join(', ') || 'Released'}
                  </Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={[typography.caption, styles.mutedText]}>Fare</Text>
                  <Text style={typography.bodyMedium}>
                    {formatFare(ticketView.ticket.fareAmount)}
                  </Text>
                </View>
              </View>

              {ticketView.isPaid && (
                <View style={styles.offlinePill}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={sizes.iconSmall}
                    color={colors.primary[600]}
                  />
                  <Text style={[typography.bodySmall, styles.offlinePillText]}>
                    {OFFLINE_PILL.online.label}
                  </Text>
                </View>
              )}

              <AppButton
                label={ticketView.isPaid ? 'View ticket' : 'Pay the fare'}
                size="large"
                isFullWidth
                iconName={ticketView.isPaid ? 'qr-code-outline' : 'card-outline'}
                onPress={() =>
                  router.push(
                    ticketView.isPaid
                      ? `/(passenger)/ticket/${ticketView.ticket.id}`
                      : `/(passenger)/payment/${ticketView.ticket.id}`
                  )
                }
              />
            </AppCard>
          );
        })
      )}

      {bookSeatButton}

      {pastTickets.length > 0 && (
        <>
          <Text style={[typography.sectionHeading, styles.mutedText]}>Recent tickets</Text>
          <AppCard>
            {pastTickets.map((ticketView, ticketIndex) => {
              const ticketBadge = TICKET_BADGES[ticketView.ticket.status];
              return (
                <View
                  key={ticketView.ticket.id}
                  style={[styles.pastRow, ticketIndex > 0 && styles.pastRowDivided]}
                >
                  <View style={styles.pastBadge}>
                    <Ionicons
                      name="ticket-outline"
                      size={sizes.iconMedium}
                      color={colors.text.secondary}
                    />
                  </View>
                  <View style={styles.pastTextBlock}>
                    <Text style={typography.bodyMedium}>
                      {ticketView.boardingStop?.stopName} &#8594;{' '}
                      {ticketView.alightingStop?.stopName}
                    </Text>
                    <Text style={[typography.caption, styles.mutedText]}>
                      {formatDepartureTime(ticketView.departsAt)}
                    </Text>
                  </View>
                  <View style={styles.pastAmountBlock}>
                    <Text style={typography.bodyMedium}>
                      {formatFare(ticketView.ticket.fareAmount)}
                    </Text>
                    <StatusBadge status={ticketBadge.status} label={ticketBadge.label} />
                  </View>
                </View>
              );
            })}
          </AppCard>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: sizes.screenGutter,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  centredMutedText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  noUpcomingBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  cardHeaderRow: {
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
  cardHeaderText: {
    flex: 1,
    gap: spacing.xxs,
  },
  detailDivider: {
    height: sizes.borderThin,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailBlock: {
    gap: spacing.xxs,
  },
  offlinePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[100],
  },
  offlinePillText: {
    color: colors.primary[600],
  },
  pastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pastRowDivided: {
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
  },
  pastBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  pastAmountBlock: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
});
