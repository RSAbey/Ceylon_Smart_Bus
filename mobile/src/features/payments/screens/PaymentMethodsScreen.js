// Payment Methods (Member 03): the methods the app accepts and the passenger's own payment history.
// No card is stored: the prototype has no saved-card table, so this screen explains rather than manages.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchMyPayments, fetchPaymentMethods } from '../services/paymentApi';
import { CURRENCY_PREFIX } from '../../tickets/constants';
import { PAYMENT_BADGES, PAYMENT_MESSAGES, PAYMENT_METHOD_ICONS, PAYMENTS_EMPTY } from '../constants';

/**
 * Loads the accepted methods and the payment history together.
 * @returns {Promise<{paymentMethods: object[], payments: object[]}>} Everything the screen needs.
 */
async function loadPaymentMethodsScreen() {
  const [paymentMethods, payments] = await Promise.all([fetchPaymentMethods(), fetchMyPayments()]);
  return { paymentMethods, payments };
}

/**
 * Accepted payment methods plus the passenger's past fares.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function PaymentMethodsScreen() {
  const router = useRouter();
  const drawer = useDrawer();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadPayments = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    loadPaymentMethodsScreen()
      .then(({ paymentMethods: loadedMethods, payments: loadedPayments }) => {
        if (!isEffectActive) return;
        setPaymentMethods(loadedMethods);
        setPayments(loadedPayments);
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
    <AppHeader
      variant="back"
      title="Payment Methods"
      onBackPress={router.canGoBack() ? router.back : undefined}
      onMenuPress={drawer ? drawer.openDrawer : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your payments..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadPayments} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <Text style={[typography.sectionHeading, styles.mutedText]}>Accepted at checkout</Text>
      {paymentMethods.map((paymentMethod) => (
        <AppCard key={paymentMethod.method}>
          <View style={styles.methodRow}>
            <View style={styles.methodBadge}>
              <Ionicons
                name={PAYMENT_METHOD_ICONS[paymentMethod.method]}
                size={sizes.iconMedium}
                color={colors.primary[600]}
              />
            </View>
            <View style={styles.methodText}>
              <Text style={typography.bodyLarge}>{paymentMethod.label}</Text>
              <Text style={[typography.caption, styles.mutedText]}>{paymentMethod.hint}</Text>
            </View>
          </View>
        </AppCard>
      ))}

      <View style={styles.noticeRow}>
        <Ionicons
          name="shield-checkmark-outline"
          size={sizes.iconMedium}
          color={colors.information.dark}
        />
        <Text style={[typography.caption, styles.noticeText]}>{PAYMENT_MESSAGES.mockNotice}</Text>
      </View>

      <Text style={[typography.sectionHeading, styles.mutedText]}>Your payments</Text>
      {payments.length === 0 ? (
        <EmptyState
          iconName="receipt-outline"
          title={PAYMENTS_EMPTY.title}
          message={PAYMENTS_EMPTY.message}
          actionLabel="Find a route"
          onActionPress={() => router.push('/(passenger)/(tabs)/explore')}
        />
      ) : (
        payments.map((paymentEntry) => {
          const paymentBadge = PAYMENT_BADGES[paymentEntry.payment.status];
          return (
            <AppCard key={paymentEntry.payment.id}>
              <View style={styles.historyRow}>
                <View style={styles.historyText}>
                  <Text style={typography.bodyLarge}>
                    {CURRENCY_PREFIX} {paymentEntry.payment.amount}
                  </Text>
                  <Text style={[typography.caption, styles.mutedText]}>
                    {paymentEntry.ticketKey} · {paymentEntry.payment.method}
                  </Text>
                </View>
                <StatusBadge status={paymentBadge.status} label={paymentBadge.label} />
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
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  methodBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
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
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
