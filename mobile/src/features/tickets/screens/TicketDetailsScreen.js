// My Ticket (Member 03, FR-05): the QR code the conductor scans, the journey, and cancel / change.
// A copy is kept on the phone, so the ticket still opens out of coverage, which is exactly where
// buses are when the conductor asks to see it (NFR-04).
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
import { cacheTicket, forgetCachedTicket, readCachedTicket } from '../services/offlineTicketStore';
import { formatDepartureTime, formatFare, formatSyncTime, formatValidUntil } from '../formatters';
import { QR_PAYLOAD_TYPE } from '../../verification/constants';
import { OFFLINE_PILL, QR_CODE_SIZE, TICKET_BADGES, TICKET_STATUSES, UNPAID_BADGE } from '../constants';

/**
 * One label-and-value pair in the ticket stub.
 * @param {object} props - Component props.
 * @param {string} props.label - What the value means.
 * @param {string} props.detail - The value itself.
 * @param {boolean} [props.isAlignedRight] - Right-align for the second column.
 * @returns {import('react').JSX.Element} The pair.
 */
function StubField({ label, detail, isAlignedRight = false }) {
  return (
    <View style={[styles.stubField, isAlignedRight && styles.stubFieldRight]}>
      <Text style={[typography.caption, styles.mutedText]}>{label}</Text>
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
  const [syncedAt, setSyncedAt] = useState(null);
  const [isShowingCachedCopy, setIsShowingCachedCopy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isCancelDialogVisible, setIsCancelDialogVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadTicket = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // Paying and changing happen on other screens, so refresh whenever this screen comes back into view.
  useFocusEffect(reloadTicket);

  useEffect(() => {
    let isEffectActive = true;
    fetchTicketDetails(ticketId)
      .then(async (loadedTicket) => {
        if (!isEffectActive) return;
        setTicketView(loadedTicket);
        setSyncedAt(new Date().toISOString());
        setIsShowingCachedCopy(false);
        setLoadErrorMessage('');
        await cacheTicket(ticketId, loadedTicket);
      })
      .catch(async (loadError) => {
        // No signal is the normal case on a moving bus, so fall back to the stored copy.
        const cachedTicket = await readCachedTicket(ticketId);
        if (!isEffectActive) return;
        if (cachedTicket) {
          setTicketView(cachedTicket.ticketView);
          setSyncedAt(cachedTicket.syncedAt);
          setIsShowingCachedCopy(true);
          setLoadErrorMessage('');
        } else {
          setLoadErrorMessage(loadError.message);
        }
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
      await forgetCachedTicket(ticketId);
      showSuccessToast('Ticket cancelled. Your seats have been released.');
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
      title="My Ticket"
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

  const { ticket, route, boardingStop, alightingStop, seatNumbers, isPaid, passengerName, departsAt } =
    ticketView;
  const ticketBadge = TICKET_BADGES[ticket.status];
  const isActiveTicket = ticket.status === TICKET_STATUSES.ACTIVE;
  const isQrUsable = isPaid && isActiveTicket;
  const offlineWording = isShowingCachedCopy ? OFFLINE_PILL.offline : OFFLINE_PILL.online;
  // The driver's app reads this exact shape; anything else is rejected as not a ticket.
  const qrPayload = JSON.stringify({
    type: QR_PAYLOAD_TYPE,
    ticketKey: ticket.ticketKey,
    qrSignature: ticket.qrSignature,
  });

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Ionicons name="bus" size={sizes.iconMedium} color={colors.text.onColor} />
          </View>
          <Text style={[typography.bodyMedium, styles.brandText]}>Ceylon Smart Bus</Text>
          <StatusBadge status={ticketBadge.status} label={ticketBadge.label} />
        </View>

        <Text style={[typography.display, styles.busNumberText]}>
          Bus {route?.routeNumber || '--'}
        </Text>
        <Text style={[typography.bodyLarge, styles.mutedText]}>
          {boardingStop?.stopName} &#8594; {alightingStop?.stopName}
        </Text>

        {isQrUsable ? (
          <View style={styles.qrBlock}>
            <View style={styles.qrFrame}>
              <QRCode
                value={qrPayload}
                size={QR_CODE_SIZE}
                color={colors.text.primary}
                backgroundColor={colors.surface}
              />
            </View>
            <View style={styles.offlinePill}>
              <Ionicons
                name={isShowingCachedCopy ? 'cloud-offline-outline' : 'cloud-done-outline'}
                size={sizes.iconSmall}
                color={colors.primary[600]}
              />
              <Text style={[typography.bodySmall, styles.offlinePillText]}>
                {offlineWording.label}
              </Text>
            </View>
            <Text style={[typography.caption, styles.qrCaption]}>
              {isShowingCachedCopy
                ? `Last synced ${formatSyncTime(syncedAt)}. ${offlineWording.caption}`
                : offlineWording.caption}
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

        <View style={styles.dashedDivider} />

        <View style={styles.stubRow}>
          <StubField label="Passenger" detail={passengerName || 'You'} />
          <StubField
            label={seatNumbers.length === 1 ? 'Seat' : 'Seats'}
            detail={seatNumbers.length > 0 ? seatNumbers.join(', ') : 'Released'}
            isAlignedRight
          />
        </View>
        <View style={styles.stubRow}>
          <StubField label="Departs" detail={formatDepartureTime(departsAt)} />
          <StubField label="Fare" detail={formatFare(ticket.fareAmount)} isAlignedRight />
        </View>

        <View style={[styles.validUntilRow, !isQrUsable && styles.validUntilRowMuted]}>
          <Ionicons
            name="time-outline"
            size={sizes.iconMedium}
            color={isQrUsable ? colors.success.dark : colors.text.secondary}
          />
          <Text style={[typography.bodyMedium, styles.validUntilLabel]}>Valid until</Text>
          <Text style={typography.bodyMedium}>{formatValidUntil(ticket.validUntil)}</Text>
        </View>

        <View style={styles.stubRow}>
          <Text style={[typography.bodyMedium, styles.mutedText]}>Ticket ID</Text>
          <Text style={typography.bodyMedium}>{ticket.ticketKey}</Text>
        </View>
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

      {isActiveTicket && !isShowingCachedCopy && (
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
            ? 'Your seats are released and the fare is refunded. This cannot be undone.'
            : 'Your seats are released. This cannot be undone.'
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandBadge: {
    width: sizes.iconXLarge,
    height: sizes.iconXLarge,
    borderRadius: radii.sm,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    flex: 1,
    color: colors.text.secondary,
  },
  busNumberText: {
    marginBottom: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  qrBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  qrFrame: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[100],
  },
  offlinePillText: {
    color: colors.primary[600],
  },
  qrCaption: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  qrPlaceholder: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.xxl,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  dashedDivider: {
    marginVertical: spacing.lg,
    borderBottomWidth: sizes.borderThin,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
  },
  stubRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  stubField: {
    gap: spacing.xxs,
  },
  stubFieldRight: {
    alignItems: 'flex-end',
  },
  validUntilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.success.light,
  },
  validUntilRowMuted: {
    backgroundColor: colors.background,
  },
  validUntilLabel: {
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
