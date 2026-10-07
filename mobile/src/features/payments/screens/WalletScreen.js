// Mobile Wallet (Member 03, FR-07): the prepaid balance, a statement, and top-up with a demo card.
// A topped-up wallet lets a passenger pay a fare in one tap instead of typing a card each time.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import CardDetailsForm from '../components/CardDetailsForm';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchWallet, topUpWallet } from '../services/paymentApi';
import { formatFare } from '../../tickets/formatters';
import {
  MAX_TOPUP_AMOUNT,
  MIN_TOPUP_AMOUNT,
  TOPUP_PRESET_AMOUNTS,
  WALLET_LINE_STYLES,
  WALLET_MESSAGES,
  PAYMENT_MESSAGES,
} from '../constants';

const EMPTY_CARD_DETAILS = Object.freeze({
  cardNumber: '',
  cardHolderName: '',
  cardExpiry: '',
  cardCvv: '',
});

/**
 * The wallet screen: balance, top-up and statement.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function WalletScreen() {
  const router = useRouter();
  const drawer = useDrawer();
  const { showSuccessToast, showErrorToast } = useToast();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [chosenAmount, setChosenAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [cardDetails, setCardDetails] = useState(EMPTY_CARD_DETAILS);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadWallet = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    fetchWallet()
      .then((walletSummary) => {
        if (!isEffectActive) return;
        setBalance(walletSummary.balance);
        setTransactions(walletSummary.transactions);
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

  // A preset button and the custom field are two ways to set the same number.
  const topUpAmount = chosenAmount ?? Number(customAmount);
  const isAmountValid =
    Number.isFinite(topUpAmount) && topUpAmount >= MIN_TOPUP_AMOUNT && topUpAmount <= MAX_TOPUP_AMOUNT;

  const confirmTopUp = async () => {
    setIsToppingUp(true);
    setFieldErrors({});
    try {
      const walletSummary = await topUpWallet({ amount: topUpAmount, ...cardDetails });
      setBalance(walletSummary.balance);
      setTransactions(walletSummary.transactions);
      setChosenAmount(null);
      setCustomAmount('');
      setCardDetails(EMPTY_CARD_DETAILS);
      showSuccessToast(`${formatFare(topUpAmount)} added to your wallet.`);
    } catch (topUpError) {
      showErrorToast(topUpError.message);
      setFieldErrors(topUpError.fieldErrors || {});
    } finally {
      setIsToppingUp(false);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title={WALLET_MESSAGES.title}
      onBackPress={router.canGoBack() ? router.back : undefined}
      onMenuPress={drawer ? drawer.openDrawer : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your wallet..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadWallet} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard style={styles.balanceCard}>
        <View style={styles.balanceHeaderRow}>
          <Ionicons name="wallet-outline" size={sizes.iconLarge} color={colors.text.onColor} />
          <Text style={[typography.bodyMedium, styles.balanceLabel]}>
            {WALLET_MESSAGES.balanceLabel}
          </Text>
        </View>
        <Text style={[typography.display, styles.balanceAmount]}>{formatFare(balance)}</Text>
      </AppCard>

      <AppCard>
        <Text style={typography.heading3}>{WALLET_MESSAGES.topUpTitle}</Text>
        <Text style={[typography.bodySmall, styles.mutedText]}>{WALLET_MESSAGES.chooseAmount}</Text>

        <View style={styles.presetRow}>
          {TOPUP_PRESET_AMOUNTS.map((presetAmount) => {
            const isChosenPreset = chosenAmount === presetAmount;
            return (
              <Pressable
                key={presetAmount}
                onPress={() => {
                  setChosenAmount(presetAmount);
                  setCustomAmount('');
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: isChosenPreset }}
                accessibilityLabel={`Top up ${formatFare(presetAmount)}`}
                style={[styles.presetButton, isChosenPreset && styles.presetButtonChosen]}
              >
                <Text style={[typography.label, isChosenPreset && styles.presetTextChosen]}>
                  {formatFare(presetAmount)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppTextInput
          label="Or enter an amount"
          value={customAmount}
          onChangeText={(typedAmount) => {
            setCustomAmount(typedAmount.replace(/\D/g, ''));
            setChosenAmount(null);
          }}
          errorText={fieldErrors.amount}
          helperText={`Between ${formatFare(MIN_TOPUP_AMOUNT)} and ${formatFare(MAX_TOPUP_AMOUNT)}.`}
          iconName="cash-outline"
          keyboardType="number-pad"
        />
      </AppCard>

      <AppCard>
        <Text style={[typography.sectionHeading, styles.mutedText]}>Card to charge</Text>
        <CardDetailsForm
          cardDetails={cardDetails}
          onChangeCardDetails={setCardDetails}
          fieldErrors={fieldErrors}
        />
      </AppCard>

      <View style={styles.noticeRow}>
        <Ionicons
          name="information-circle-outline"
          size={sizes.iconMedium}
          color={colors.information.dark}
        />
        <Text style={[typography.caption, styles.noticeText]}>{PAYMENT_MESSAGES.mockNotice}</Text>
      </View>

      <AppButton
        label={isAmountValid ? `Top up ${formatFare(topUpAmount)}` : 'Top up'}
        size="large"
        isFullWidth
        iconName="add-circle-outline"
        isLoading={isToppingUp}
        isDisabled={!isAmountValid}
        onPress={confirmTopUp}
      />

      <Text style={[typography.sectionHeading, styles.mutedText]}>Wallet activity</Text>
      {transactions.length === 0 ? (
        <Text style={[typography.bodySmall, styles.mutedText]}>
          {WALLET_MESSAGES.emptyStatement}
        </Text>
      ) : (
        transactions.map((transaction) => {
          const lineStyle = WALLET_LINE_STYLES[transaction.type];
          return (
            <AppCard key={transaction.id}>
              <View style={styles.statementRow}>
                <View style={styles.statementBadge}>
                  <Ionicons
                    name={lineStyle.iconName}
                    size={sizes.iconMedium}
                    color={colors.primary[600]}
                  />
                </View>
                <View style={styles.statementText}>
                  <Text style={typography.bodyLarge}>{transaction.description}</Text>
                  <Text style={[typography.caption, styles.mutedText]}>
                    {new Date(transaction.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statementAmountBlock}>
                  <Text style={typography.bodyLarge}>
                    {lineStyle.sign}
                    {formatFare(transaction.amount)}
                  </Text>
                  <Text style={[typography.caption, styles.mutedText]}>
                    {formatFare(transaction.balanceAfter)}
                  </Text>
                </View>
              </View>
            </AppCard>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  balanceCard: {
    backgroundColor: colors.primary[600],
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceLabel: {
    color: colors.text.onColor,
  },
  balanceAmount: {
    color: colors.text.onColor,
    marginTop: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  presetButton: {
    flexGrow: 1,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  presetButtonChosen: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  presetTextChosen: {
    color: colors.primary[600],
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
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statementBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statementText: {
    flex: 1,
    gap: spacing.xxs,
  },
  statementAmountBlock: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
});
