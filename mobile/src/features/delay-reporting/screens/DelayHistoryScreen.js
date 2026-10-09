// Delay History (Member 04): the delays this driver has reported, so they can see what passengers
// were told and when.
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
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchMyDelayReports } from '../services/delayApi';
import { DELAY_BADGES, DELAY_HISTORY_EMPTY, DELAY_REASON_OPTIONS } from '../constants';

/**
 * The driver's past delay reports.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DelayHistoryScreen() {
  const router = useRouter();

  const [delayReports, setDelayReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadHistory = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    fetchMyDelayReports()
      .then((loadedReports) => {
        if (!isEffectActive) return;
        setDelayReports(loadedReports);
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
      title="Delay History"
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your reports..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadHistory} />
      </ScreenContainer>
    );
  }
  if (delayReports.length === 0) {
    return (
      <ScreenContainer header={screenHeader}>
        <EmptyState
          iconName="time-outline"
          title={DELAY_HISTORY_EMPTY.title}
          message={DELAY_HISTORY_EMPTY.message}
          actionLabel="Report a delay"
          onActionPress={() => router.push('/(driver)/delay-report')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <Text style={[typography.sectionHeading, styles.mutedText]}>
        {delayReports.length} {delayReports.length === 1 ? 'report' : 'reports'}
      </Text>

      {delayReports.map((reportEntry) => {
        const { delayReport, route } = reportEntry;
        const reportBadge = DELAY_BADGES[delayReport.status];
        const reasonOption = DELAY_REASON_OPTIONS.find(
          (candidateReason) => candidateReason.reason === delayReport.reason
        );
        return (
          <AppCard key={delayReport.id}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.reasonBadge}>
                <Ionicons
                  name={reasonOption?.iconName || 'alert-circle'}
                  size={sizes.iconMedium}
                  color={colors.primary[600]}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={typography.heading3}>{delayReport.delayMinutes} min late</Text>
                <Text style={[typography.caption, styles.mutedText]}>{reasonOption?.label}</Text>
              </View>
              <StatusBadge status={reportBadge.status} label={reportBadge.label} />
            </View>

            {route && (
              <Text style={typography.bodyMedium}>
                Route {route.routeNumber} &#183; {route.origin} &#8594; {route.destination}
              </Text>
            )}
            {delayReport.reasonNote && (
              <Text style={[typography.bodySmall, styles.mutedText]}>{delayReport.reasonNote}</Text>
            )}

            <View style={styles.footerRow}>
              <Ionicons name="calendar-outline" size={sizes.iconSmall} color={colors.text.secondary} />
              <Text style={[typography.caption, styles.mutedText]}>
                Reported {new Date(delayReport.createdAt).toLocaleString()}
              </Text>
            </View>
            {delayReport.resolvedAt && (
              <View style={styles.footerRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={sizes.iconSmall}
                  color={colors.success.dark}
                />
                <Text style={[typography.caption, styles.mutedText]}>
                  Back on time {new Date(delayReport.resolvedAt).toLocaleString()}
                </Text>
              </View>
            )}
            {delayReport.adminNote && (
              <View style={styles.adminNoteBlock}>
                <Text style={[typography.caption, styles.mutedText]}>Note from the office</Text>
                <Text style={typography.bodySmall}>{delayReport.adminNote}</Text>
              </View>
            )}
          </AppCard>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  reasonBadge: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  adminNoteBlock: {
    gap: spacing.xxs,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
});
