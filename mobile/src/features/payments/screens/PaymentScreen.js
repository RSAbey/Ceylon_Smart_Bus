// Payment (Member 03, FR-07): confirm the fare, choose a method, and for a card enter the demo
// details. Payments are mocked for the prototype: nothing is charged and no card is stored.
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
import CardDetailsForm from '../components/CardDetailsForm';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchPaymentMethods, payForTicket } from '../services/paymentApi';
import { fetchTicketDetails } from '../../tickets/services/ticketApi';
import { formatFare } from '../../tickets/formatters';
import {
  PAYMENT_MESSAGES,
  PAYMENT_METHODS,
  PAYMENT_METHOD_ICONS,
  WALLET_MESSAGES,
} from '../constants';

const EMPTY_CARD_DETAILS = Object.freeze({
  cardNumber: '',
  cardHolderName: '',
  cardExpiry: '',
  cardCvv: '',
});

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
 * Fare confirmation, method choice and the demo card form.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function PaymentScreen() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams();
  const { showSuccessToast, showErrorToast } = useToast();

  const [ticketView, setTicketView] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [chosenMethod, setChosenMethod] = useState('');
  const [cardDetails, setCardDetails] = useState(EMPTY_CARD_DETAILS);
  const [fieldErrors, setFieldErrors] = useState({});
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
    setFieldErrors({});
    try {
      const paymentRequest = { ticketId, method: chosenMethod };
      // Card fields only travel when the passenger picked card, and the server never stores them.
      if (chosenMethod === PAYMENT_METHODS.CARD) Object.assign(paymentRequest, cardDetails);
      await payForTicket(paymentRequest);
      showSuccessToast(PAYMENT_MESSAGES.paid);
      router.replace(`/(passenger)/ticket/${ticketId}`);
    } catch (payError) {
      showErrorToast(payError.message);
      setFieldErrors(payError.fieldErrors || {});
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

  const { ticket, route, boardingStop, alightingStop, seatNumbers, isPaid, perSeatFare } = ticketView;

  if (isPaid) {
    return (
      <ScreenContainer header={screenHeader}>
        <AppCard>
          <View style={styles.paidBlock}>
            <Ionicons name="checkmark-circle" size={sizes.iconHuge} color={colors.success.dark} />
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

  const walletMethod = paymentMethods.find(
    (paymentMethod) => paymentMethod.method === PAYMENT_METHODS.WALLET
  );
  const isWalletShort = (walletMethod?.balance || 0) < ticket.fareAmount;
  const isCardChosen = chosenMethod === PAYMENT_METHODS.CARD;

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <Text style={[typography.sectionHeading, styles.mutedText]}>Fare to pay</Text>
        <Text style={[typography.display, styles.fareText]}>{formatFare(ticket.fareAmount)}</Text>
        <Text style={[typography.caption, styles.mutedText]}>
          {seatNumbers.length} {seatNumbers.length === 1 ? 'seat' : 'seats'} &#215;{' '}
          {formatFare(perSeatFare)}
        </Text>
        <View style={styles.summaryDivider} />
        <Text style={typography.bodyMedium}>
          Route {route?.routeNumber} &#183; {seatNumbers.join(', ') || 'no seats'}
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
        const isWalletRow = paymentMethod.method === PAYMENT_METHODS.WALLET;
        const isRowDisabled = isWalletRow && isWalletShort;
        return (
          <Pressable
            key={paymentMethod.method}
            onPress={() => setChosenMethod(paymentMethod.method)}
            disabled={isRowDisabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: isChosen, disabled: isRowDisabled }}
            accessibilityLabel={`${paymentMethod.label}. ${paymentMethod.hint}`}
            style={[
              styles.methodRow,
              isChosen && styles.methodRowChosen,
              isRowDisabled && styles.methodRowDisabled,
            ]}
          >
            <Ionicons
              name={PAYMENT_METHOD_ICONS[paymentMethod.method]}
              size={sizes.iconLarge}
              color={isChosen ? colors.primary[600] : colors.text.secondary}
            />
            <View style={styles.methodText}>
              <Text style={typography.bodyLarge}>{paymentMethod.label}</Text>
              <Text style={[typography.caption, styles.mutedText]}>
                {isRowDisabled ? WALLET_MESSAGES.notEnough : paymentMethod.hint}
              </Text>
            </View>
            {isWalletRow ? (
              <AppButton
                label="Top up"
                variant="text"
                size="small"
                onPress={() => router.push('/(passenger)/wallet')}
              />
            ) : (
              <Ionicons
                name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                size={sizes.iconLarge}
                color={isChosen ? colors.primary[600] : colors.text.disabled}
              />
            )}
          </Pressable>
        );
      })}

      {isCardChosen && (
        <AppCard>
          <Text style={[typography.sectionHeading, styles.mutedText]}>Card details</Text>
          <CardDetailsForm
            cardDetails={cardDetails}
            onChangeCardDetails={setCardDetails}
            fieldErrors={fieldErrors}
          />
        </AppCard>
      )}

      <View style={styles.noticeRow}>
        <Ionicons
          name="information-circle-outline"
          size={sizes.iconMedium}
          color={colors.information.dark}
        />
        <Text style={[typography.caption, styles.noticeText]}>{PAYMENT_MESSAGES.mockNotice}</Text>
      </View>

      <AppButton
        label={`Pay ${formatFare(ticket.fareAmount)}`}
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
  methodRowDisabled: {
    opacity: 0.6,
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
