// Ticket Details (Member 03, FR-05): the QR code the driver scans, the journey, and cancel / edit.
// The QR is drawn from fields already in memory, so it still shows with no connection (NFR-04).
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
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
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { cancelTicket, fetchTicketDetails } from '../services/ticketApi';
import { QR_PAYLOAD_TYPE } from '../../verification/constants';
import { CURRENCY_PREFIX, QR_CODE_SIZE, TICKET_BADGES, TICKET_STATUSES, UNPAID_BADGE } from '../constants';

/**
 * One labelled line in the journey block.
 * @param {object} props - Component props.
 * @param {string} props.iconName - Ionicons name.
 * @param {string} props.label - What the value means.
 * @param {string} props.detail - The value itself.
 * @returns {import('react').JSX.Element} The row.
 */
function JourneyRow({ iconName, label, detail }) {
  return (
    <View style={styles.journeyRow}>
      <Ionicons name={iconName} size={sizes.iconMedium} color={colors.text.secondary} />
      <Text style={[typography.bodyMedium, styles.journeyLabel]}>{label}</Text>
      <Text style={typography.bodyLarge}>{detail}</Text>
    </View>
  );
}

/**
 * A single ticket with its QR code.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function TicketDetailsScreen() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams();
  const { showSuccessToast, showErrorToast } = useToast();

  const [ticketView, setTicketView] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isCancelDialogVisible, setIsCancelDialogVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadTicket = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // Paying and editing happen on other screens, so refresh whenever this screen comes back into view.
  useFocusEffect(reloadTicket);

  useEffect(() => {
    let isEffectActive = true;
    fetchTicketDetails(ticketId)
      .then((loadedTicket) => {
        if (!isEffectActive) return;
        setTicketView(loadedTicket);
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
  }, [ticketId, reloadCounter]);

  const confirmCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelTicket(ticketId);
      showSuccessToast('Ticket cancelled. Your seat has been released.');
      setIsCancelDialogVisible(false);
      reloadTicket();
    } catch (cancelError) {
      showErrorToast(cancelError.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Ticket"
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your ticket..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadTicket} />
      </ScreenContainer>
    );
  }

  const { ticket, route, bus, boardingStop, alightingStop, seatNumber, isPaid } = ticketView;
  const ticketBadge = TICKET_BADGES[ticket.status];
  const isActiveTicket = ticket.status === TICKET_STATUSES.ACTIVE;
  // The driver's app reads this exact shape; anything else is rejected as not a ticket.
  const qrPayload = JSON.stringify({
    type: QR_PAYLOAD_TYPE,
    ticketKey: ticket.ticketKey,
    qrSignature: ticket.qrSignature,
  });

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderText}>
            <Text style={typography.heading2}>Route {route?.routeNumber}</Text>
            <Text style={[typography.bodySmall, styles.mutedText]}>{ticket.ticketKey}</Text>
          </View>
          <StatusBadge status={ticketBadge.status} label={ticketBadge.label} />
        </View>

        {isPaid && isActiveTicket ? (
          <View style={styles.qrBlock}>
            <QRCode
              value={qrPayload}
              size={QR_CODE_SIZE}
              color={colors.text.primary}
              backgroundColor={colors.surface}
            />
            <Text style={[typography.bodySmall, styles.qrCaption]}>
              Show this to the driver when you board.
            </Text>
            <Text style={[typography.caption, styles.mutedText]}>
              Code not scanning? The driver can type {ticket.ticketKey}.
            </Text>
          </View>
        ) : (
          <View style={styles.qrPlaceholder}>
            <Ionicons
              name={isActiveTicket ? 'lock-closed-outline' : 'close-circle-outline'}
              size={sizes.iconHuge}
              color={colors.text.secondary}
            />
            <Text style={[typography.bodyMedium, styles.qrCaption]}>
              {isActiveTicket
                ? 'Pay the fare to unlock your QR code.'
                : `This ticket is ${ticket.status} and can no longer be used.`}
            </Text>
          </View>
        )}
      </AppCard>

      <AppCard>
        <Text style={[typography.sectionHeading, styles.mutedText]}>Your journey</Text>
        <JourneyRow iconName="radio-button-on-outline" label="From" detail={boardingStop?.stopName} />
        <JourneyRow iconName="location-outline" label="To" detail={alightingStop?.stopName} />
        <JourneyRow iconName="person-outline" label="Seat" detail={seatNumber || 'Released'} />
        <JourneyRow iconName="bus-outline" label="Bus" detail={bus?.plateNumber || 'Not assigned'} />
        <JourneyRow
          iconName="cash-outline"
          label="Fare"
          detail={`${CURRENCY_PREFIX} ${ticket.fareAmount}`}
        />
      </AppCard>

      {isActiveTicket && !isPaid && (
        <View style={styles.unpaidBlock}>
          <StatusBadge status={UNPAID_BADGE.status} label={UNPAID_BADGE.label} />
          <AppButton
            label="Pay the fare"
            size="large"
            isFullWidth
            iconName="card-outline"
            onPress={() => router.push(`/(passenger)/payment/${ticket.id}`)}
          />
        </View>
      )}

      {isActiveTicket && (
        <View style={styles.actionRow}>
          <AppButton
            label="Change"
            variant="outline"
            isFullWidth
            iconName="create-outline"
            style={styles.actionButton}
            onPress={() => router.push(`/(passenger)/ticket/edit/${ticket.id}`)}
          />
          <AppButton
            label="Cancel"
            variant="error"
            isFullWidth
            iconName="close-circle-outline"
            style={styles.actionButton}
            onPress={() => setIsCancelDialogVisible(true)}
          />
        </View>
      )}

      <ConfirmDialog
        isVisible={isCancelDialogVisible}
        title="Cancel this ticket?"
        message={
          isPaid
            ? 'Your seat is released and the fare is refunded. This cannot be undone.'
            : 'Your seat is released. This cannot be undone.'
        }
        confirmLabel="Cancel ticket"
        cancelLabel="Keep it"
        isDestructive
        isConfirming={isCancelling}
        onConfirm={confirmCancel}
        onCancel={() => setIsCancelDialogVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    gap: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  qrBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  qrPlaceholder: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.xxl,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  qrCaption: {
    textAlign: 'center',
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  journeyLabel: {
    flex: 1,
    color: colors.text.secondary,
  },
  unpaidBlock: {
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
