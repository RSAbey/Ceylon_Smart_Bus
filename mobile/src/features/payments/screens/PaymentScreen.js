// Payment (Member 03, FR-07): confirm the fare and choose a method. Payments are mocked for the
// prototype, so no card details are ever collected or stored.
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
import { useToast } from '../../../components/ui/ToastMessage';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchPaymentMethods, payForTicket } from '../services/paymentApi';
import { fetchTicketDetails } from '../../tickets/services/ticketApi';
import { CURRENCY_PREFIX } from '../../tickets/constants';
import { PAYMENT_MESSAGES, PAYMENT_METHOD_ICONS } from '../constants';

/**
 * Loads the ticket being paid for and the available methods together.
 * @param {string} ticketId - Ticket being paid for.
 * @returns {Promise<{ticketView: object, paymentMethods: object[]}>} Everything the screen needs.
 */
async function loadPaymentScreen(ticketId) {
  const [ticketView, paymentMethods] = await Promise.all([
    fetchTicketDetails(ticketId),
    fetchPaymentMethods(),
  ]);
  return { ticketView, paymentMethods };
}

/**
 * Fare confirmation and payment method choice.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function PaymentScreen() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams();
  const { showSuccessToast, showErrorToast } = useToast();

  const [ticketView, setTicketView] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [chosenMethod, setChosenMethod] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadPayment = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    loadPaymentScreen(ticketId)
      .then(({ ticketView: loadedTicket, paymentMethods: loadedMethods }) => {
        if (!isEffectActive) return;
        setTicketView(loadedTicket);
        setPaymentMethods(loadedMethods);
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

  const payNow = async () => {
    setIsPaying(true);
    try {
      await payForTicket({ ticketId, method: chosenMethod });
      showSuccessToast(PAYMENT_MESSAGES.paid);
      router.replace(`/(passenger)/ticket/${ticketId}`);
    } catch (payError) {
      showErrorToast(payError.message);
    } finally {
      setIsPaying(false);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Payment"
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your fare..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadPayment} />
      </ScreenContainer>
    );
  }

  const { ticket, route, boardingStop, alightingStop, seatNumber, isPaid } = ticketView;

  if (isPaid) {
    return (
      <ScreenContainer header={screenHeader}>
        <AppCard>
          <View style={styles.paidBlock}>
            <Ionicons
              name="checkmark-circle"
              size={sizes.iconHuge}
              color={colors.success.dark}
            />
            <Text style={typography.heading3}>This fare is already paid</Text>
            <Text style={[typography.bodyMedium, styles.centredText]}>
              Ticket {ticket.ticketKey} is ready to use.
            </Text>
          </View>
        </AppCard>
        <AppButton
          label="Show my ticket"
          size="large"
          isFullWidth
          onPress={() => router.replace(`/(passenger)/ticket/${ticket.id}`)}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <Text style={[typography.sectionHeading, styles.mutedText]}>Fare to pay</Text>
        <Text style={[typography.display, styles.fareText]}>
          {CURRENCY_PREFIX} {ticket.fareAmount}
        </Text>
        <View style={styles.summaryDivider} />
        <Text style={typography.bodyMedium}>
          Route {route?.routeNumber} · Seat {seatNumber || 'released'}
        </Text>
        <Text style={[typography.bodySmall, styles.mutedText]}>
          {boardingStop?.stopName} to {alightingStop?.stopName}
        </Text>
      </AppCard>

      <Text style={[typography.sectionHeading, styles.mutedText]}>
        {PAYMENT_MESSAGES.chooseMethod}
      </Text>

      {paymentMethods.map((paymentMethod) => {
        const isChosen = paymentMethod.method === chosenMethod;
        return (
          <Pressable
            key={paymentMethod.method}
            onPress={() => setChosenMethod(paymentMethod.method)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isChosen }}
            accessibilityLabel={`${paymentMethod.label}. ${paymentMethod.hint}`}
            style={[styles.methodRow, isChosen && styles.methodRowChosen]}
          >
            <Ionicons
              name={PAYMENT_METHOD_ICONS[paymentMethod.method]}
              size={sizes.iconLarge}
              color={isChosen ? colors.primary[600] : colors.text.secondary}
            />
            <View style={styles.methodText}>
              <Text style={typography.bodyLarge}>{paymentMethod.label}</Text>
              <Text style={[typography.caption, styles.mutedText]}>{paymentMethod.hint}</Text>
            </View>
            <Ionicons
              name={isChosen ? 'radio-button-on' : 'radio-button-off'}
              size={sizes.iconLarge}
              color={isChosen ? colors.primary[600] : colors.text.disabled}
            />
          </Pressable>
        );
      })}

      <View style={styles.noticeRow}>
        <Ionicons
          name="information-circle-outline"
          size={sizes.iconMedium}
          color={colors.information.dark}
        />
        <Text style={[typography.caption, styles.noticeText]}>{PAYMENT_MESSAGES.mockNotice}</Text>
      </View>

      <AppButton
        label={`Pay ${CURRENCY_PREFIX} ${ticket.fareAmount}`}
        size="large"
        isFullWidth
        iconName="lock-closed-outline"
        isLoading={isPaying}
        isDisabled={!chosenMethod}
        onPress={payNow}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  centredText: {
    textAlign: 'center',
  },
  fareText: {
    color: colors.primary[600],
    marginVertical: spacing.xs,
  },
  summaryDivider: {
    height: sizes.borderThin,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  methodRowChosen: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  methodText: {
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
  paidBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
});
