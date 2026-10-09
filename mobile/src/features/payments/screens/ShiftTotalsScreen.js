// Current Shift (Member 03): what this driver has collected today, split cash against digital.
// A conductor cashes up at the end of a shift, so the cash figure is the one that must be exact.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchShiftSummary } from '../services/paymentApi';
import { formatFare, formatSyncTime } from '../../tickets/formatters';
import { SHIFT_MESSAGES, SHIFT_RECENT_LIMIT } from '../constants';

/**
 * The driver's takings for today.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function ShiftTotalsScreen() {
  const router = useRouter();

  const [shiftSummary, setShiftSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadShift = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    fetchShiftSummary()
      .then((loadedSummary) => {
        if (!isEffectActive) return;
        setShiftSummary(loadedSummary);
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
      title={SHIFT_MESSAGES.title}
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Adding up your shift..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadShift} />
      </ScreenContainer>
    );
  }
  if (shiftSummary.tripCount === 0) {
    return (
      <ScreenContainer header={screenHeader}>
        <EmptyState
          iconName="receipt-outline"
          title="No shift today"
          message={SHIFT_MESSAGES.noShift}
          actionLabel="Start a trip"
          onActionPress={() => router.replace('/(driver)/(tabs)/live')}
        />
      </ScreenContainer>
    );
  }

  const { bus, route, shiftStartedAt, recentTransactions, transactionCount } = shiftSummary;

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <Text style={[typography.bodySmall, styles.mutedText]}>
        From {formatSyncTime(shiftStartedAt)}
        {bus ? `, ${bus.plateNumber}` : ''}
        {route ? ` on route ${route.routeNumber}` : ''}
      </Text>

      <AppCard style={styles.totalCard}>
        <View style={styles.totalRow}>
          <View style={styles.totalBlock}>
            <Text style={[typography.bodyMedium, styles.onColorMuted]}>
              {SHIFT_MESSAGES.totalTransactions}
            </Text>
            <Text style={[typography.display, styles.onColorText]}>{transactionCount}</Text>
          </View>
          <View style={styles.totalBlockRight}>
            <Text style={[typography.bodyMedium, styles.onColorMuted]}>
              {SHIFT_MESSAGES.shiftTotal}
            </Text>
            <Text style={[typography.display, styles.onColorText]}>
              {formatFare(shiftSummary.shiftTotal)}
            </Text>
          </View>
        </View>
      </AppCard>

      <View style={styles.splitRow}>
        <AppCard style={styles.splitCard}>
          <View style={styles.splitBadgeRow}>
            <View style={[styles.splitBadge, styles.cashBadge]}>
              <Ionicons name="cash-outline" size={sizes.iconMedium} color={colors.success.dark} />
            </View>
            <Text style={[typography.bodySmall, styles.mutedText]}>{SHIFT_MESSAGES.cashTotal}</Text>
          </View>
          <Text style={typography.heading2}>{formatFare(shiftSummary.cashTotal)}</Text>
          <Text style={[typography.caption, styles.mutedText]}>
            {shiftSummary.cashCount} {shiftSummary.cashCount === 1 ? 'fare' : 'fares'}
          </Text>
        </AppCard>

        <AppCard style={styles.splitCard}>
          <View style={styles.splitBadgeRow}>
            <View style={[styles.splitBadge, styles.digitalBadge]}>
              <Ionicons name="card-outline" size={sizes.iconMedium} color={colors.primary[600]} />
            </View>
            <Text style={[typography.bodySmall, styles.mutedText]}>
              {SHIFT_MESSAGES.digitalTotal}
            </Text>
          </View>
          <Text style={typography.heading2}>{formatFare(shiftSummary.digitalTotal)}</Text>
          <Text style={[typography.caption, styles.mutedText]}>
            {shiftSummary.digitalCount} {shiftSummary.digitalCount === 1 ? 'fare' : 'fares'}
          </Text>
        </AppCard>
      </View>

      <Text style={[typography.sectionHeading, styles.mutedText]}>
        {SHIFT_MESSAGES.recentHeading}
      </Text>

      {recentTransactions.length === 0 ? (
        <Text style={[typography.bodySmall, styles.mutedText]}>
          {SHIFT_MESSAGES.noTransactions}
        </Text>
      ) : (
        <AppCard>
          {recentTransactions.map((transaction, transactionIndex) => (
            <View
              key={transaction.id}
              style={[
                styles.transactionRow,
                transactionIndex > 0 && styles.transactionRowDivided,
              ]}
            >
              <View style={[styles.splitBadge, transaction.isCash ? styles.cashBadge : styles.digitalBadge]}>
                <Ionicons
                  name={transaction.isCash ? 'cash-outline' : 'card-outline'}
                  size={sizes.iconMedium}
                  color={transaction.isCash ? colors.success.dark : colors.primary[600]}
                />
              </View>
              <View style={styles.transactionText}>
                <Text style={typography.bodyMedium}>{transaction.ticketKey}</Text>
                <Text style={[typography.caption, styles.mutedText]}>
                  {transaction.boardingStopName} &#8594; {transaction.alightingStopName},{' '}
                  {formatSyncTime(transaction.paidAt)}
                </Text>
              </View>
              <View style={styles.transactionAmountBlock}>
                <Text style={typography.bodyLarge}>{formatFare(transaction.amount)}</Text>
                <Text style={[typography.caption, styles.mutedText]}>
                  {transaction.isCash ? 'Cash' : 'Digital'}
                </Text>
              </View>
            </View>
          ))}
        </AppCard>
      )}

      {transactionCount > SHIFT_RECENT_LIMIT && (
        <Text style={[typography.caption, styles.centredMutedText]}>
          Showing the latest {recentTransactions.length} of {transactionCount} transactions
        </Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  centredMutedText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  totalCard: {
    backgroundColor: colors.primary[600],
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  totalBlock: {
    gap: spacing.xxs,
  },
  totalBlockRight: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  onColorText: {
    color: colors.text.onColor,
  },
  onColorMuted: {
    color: colors.primary[100],
  },
  splitRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  splitCard: {
    flex: 1,
    gap: spacing.xxs,
  },
  splitBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  splitBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashBadge: {
    backgroundColor: colors.success.light,
  },
  digitalBadge: {
    backgroundColor: colors.primary[100],
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  transactionRowDivided: {
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
  },
  transactionText: {
    flex: 1,
    gap: spacing.xxs,
  },
  transactionAmountBlock: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
});
