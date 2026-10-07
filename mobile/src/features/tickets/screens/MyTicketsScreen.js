// My Tickets (Member 03, FR-05): the passenger's tickets with status tabs and a card per ticket.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchMyTickets } from '../services/ticketApi';
import {
  CURRENCY_PREFIX,
  TICKET_BADGES,
  TICKET_FILTER_TABS,
  TICKET_STATUSES,
  TICKETS_EMPTY,
  UNPAID_BADGE,
  BUY_TICKET_LABEL,
} from '../constants';

/**
 * The passenger's ticket list. Tapping a ticket opens its QR code.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function MyTicketsScreen() {
  const router = useRouter();
  const drawer = useDrawer();

  const [tickets, setTickets] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadTickets = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // Buying, paying for and cancelling tickets all happen on other screens, so refresh on focus.
  useFocusEffect(reloadTickets);

  useEffect(() => {
    let isEffectActive = true;
    fetchMyTickets(selectedStatus)
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
  }, [selectedStatus, reloadCounter]);

  /**
   * Switches tab. The spinner is turned on here rather than inside the effect, because React 19
   * treats a synchronous setState inside an effect as a cascading render.
   * @param {string} tabStatus - The tab's TICKET_STATUSES value, or an empty string for All.
   * @returns {void}
   */
  function showTicketsForStatus(tabStatus) {
    setIsLoading(true);
    setSelectedStatus(tabStatus);
  }

  const screenHeader = (
    <AppHeader variant="back" title="My Tickets" onMenuPress={drawer ? drawer.openDrawer : undefined} />
  );

  const buyTicketButton = (
    <AppButton
      label={BUY_TICKET_LABEL}
      size="large"
      isFullWidth
      iconName="add"
      accessibilityLabel="Buy my ticket: choose a bus and seats"
      onPress={() => router.push('/(passenger)/ticket/new')}
    />
  );

  const statusTabs = (
    <View style={styles.tabRow}>
      {TICKET_FILTER_TABS.map((filterTab) => {
        const isSelectedTab = filterTab.status === selectedStatus;
        return (
          <Pressable
            key={filterTab.label}
            onPress={() => showTicketsForStatus(filterTab.status)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelectedTab }}
            accessibilityLabel={`Show ${filterTab.label} tickets`}
            style={[styles.tabButton, isSelectedTab && styles.tabButtonSelected]}
          >
            <Text style={[typography.label, isSelectedTab && styles.tabTextSelected]}>
              {filterTab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        {statusTabs}
        <LoadingState message="Loading your tickets..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        {statusTabs}
        <ErrorState message={loadErrorMessage} onRetry={reloadTickets} />
      </ScreenContainer>
    );
  }
  if (tickets.length === 0) {
    return (
      <ScreenContainer header={screenHeader}>
        {statusTabs}
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

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      {statusTabs}
      {buyTicketButton}

      {tickets.map((ticketView) => {
        const ticketBadge = TICKET_BADGES[ticketView.ticket.status];
        const isAwaitingPayment =
          ticketView.ticket.status === TICKET_STATUSES.ACTIVE && !ticketView.isPaid;
        return (
          <AppCard
            key={ticketView.ticket.id}
            onPress={() => router.push(`/(passenger)/ticket/${ticketView.ticket.id}`)}
            accessibilityLabel={`Ticket ${ticketView.ticket.ticketKey}, route ${ticketView.route?.routeNumber}, ${ticketBadge.label}`}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.routeBadge}>
                <Ionicons name="ticket" size={sizes.iconMedium} color={colors.primary[600]} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={typography.heading3}>Route {ticketView.route?.routeNumber}</Text>
                <Text style={[typography.caption, styles.mutedText]}>
                  {ticketView.ticket.ticketKey}
                </Text>
              </View>
              <StatusBadge status={ticketBadge.status} label={ticketBadge.label} />
            </View>

            <Text style={typography.bodyLarge}>
              {ticketView.boardingStop?.stopName} to {ticketView.alightingStop?.stopName}
            </Text>

            <View style={styles.detailRow}>
              <Ionicons
                name="person-outline"
                size={sizes.iconSmall}
                color={colors.text.secondary}
              />
              <Text style={[typography.bodySmall, styles.mutedText]}>
                {ticketView.seatNumbers.length === 1 ? 'Seat' : 'Seats'}{' '}
                {ticketView.seatNumbers.join(', ') || 'released'}
              </Text>
              <Ionicons name="cash-outline" size={sizes.iconSmall} color={colors.text.secondary} />
              <Text style={[typography.bodySmall, styles.mutedText]}>
                {CURRENCY_PREFIX} {ticketView.ticket.fareAmount}
              </Text>
            </View>

            {isAwaitingPayment && (
              <View style={styles.unpaidRow}>
                <StatusBadge status={UNPAID_BADGE.status} label={UNPAID_BADGE.label} />
                <AppButton
                  label="Pay now"
                  size="small"
                  onPress={() => router.push(`/(passenger)/payment/${ticketView.ticket.id}`)}
                />
              </View>
            )}
          </AppCard>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabButtonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  tabTextSelected: {
    color: colors.primary[600],
  },
  cardHeaderRow: {
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
  cardHeaderText: {
    flex: 1,
    gap: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  unpaidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
  },
});
