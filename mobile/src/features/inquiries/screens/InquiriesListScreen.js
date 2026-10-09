// Inquiries (Member 03, FR-08): the passenger's or driver's own support inquiries with status tabs.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
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
import { fetchMyInquiries } from '../services/inquiryApi';
import {
  INQUIRIES_EMPTY,
  INQUIRY_BADGES,
  INQUIRY_FILTER_TABS,
  INQUIRY_TAG_OPTIONS,
} from '../constants';

/** Both roles reach this screen, and each must stay inside its own Expo Router group. */
const ROUTE_GROUPS = Object.freeze({ driver: '/(driver)', passenger: '/(passenger)' });

/**
 * The signed-in user's inquiry list.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function InquiriesListScreen() {
  const router = useRouter();
  const currentPath = usePathname();
  const drawer = useDrawer();

  const [inquiries, setInquiries] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadInquiries = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);
  const routeGroup = currentPath.includes('driver') ? ROUTE_GROUPS.driver : ROUTE_GROUPS.passenger;

  // Writing and editing happen on other screens, so refresh whenever this screen comes back into view.
  useFocusEffect(reloadInquiries);

  useEffect(() => {
    let isEffectActive = true;
    fetchMyInquiries(selectedStatus)
      .then((loadedInquiries) => {
        if (!isEffectActive) return;
        setInquiries(loadedInquiries);
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
   * @param {string} tabStatus - The tab's INQUIRY_STATUSES value, or an empty string for All.
   * @returns {void}
   */
  function showInquiriesForStatus(tabStatus) {
    setIsLoading(true);
    setSelectedStatus(tabStatus);
  }

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Support"
      onBackPress={router.canGoBack() ? router.back : undefined}
      onMenuPress={drawer ? drawer.openDrawer : undefined}
    />
  );

  const statusTabs = (
    <View style={styles.tabRow}>
      {INQUIRY_FILTER_TABS.map((filterTab) => {
        const isSelectedTab = filterTab.status === selectedStatus;
        return (
          <Pressable
            key={filterTab.label}
            onPress={() => showInquiriesForStatus(filterTab.status)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelectedTab }}
            accessibilityLabel={`Show ${filterTab.label} inquiries`}
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
        <LoadingState message="Loading your inquiries..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        {statusTabs}
        <ErrorState message={loadErrorMessage} onRetry={reloadInquiries} />
      </ScreenContainer>
    );
  }
  if (inquiries.length === 0) {
    return (
      <ScreenContainer header={screenHeader}>
        {statusTabs}
        <EmptyState
          iconName="chatbubble-ellipses-outline"
          title={INQUIRIES_EMPTY.title}
          message={INQUIRIES_EMPTY.message}
          actionLabel={INQUIRIES_EMPTY.actionLabel}
          onActionPress={() => router.push(`${routeGroup}/inquiries/new`)}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      {statusTabs}

      <AppButton
        label="Write an inquiry"
        isFullWidth
        iconName="add"
        onPress={() => router.push(`${routeGroup}/inquiries/new`)}
      />

      {inquiries.map((inquiryEntry) => {
        const inquiryBadge = INQUIRY_BADGES[inquiryEntry.inquiry.status];
        const tagOption = INQUIRY_TAG_OPTIONS.find(
          (tagEntry) => tagEntry.tag === inquiryEntry.inquiry.tag
        );
        return (
          <AppCard
            key={inquiryEntry.inquiry.id}
            onPress={() => router.push(`${routeGroup}/inquiries/${inquiryEntry.inquiry.id}`)}
            accessibilityLabel={`Inquiry: ${inquiryEntry.inquiry.subject}, ${inquiryBadge.label}, ${inquiryEntry.replyCount} replies`}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={[typography.heading3, styles.subjectText]}>
                {inquiryEntry.inquiry.subject}
              </Text>
              <StatusBadge status={inquiryBadge.status} label={inquiryBadge.label} />
            </View>

            <Text style={[typography.bodyMedium, styles.mutedText]} numberOfLines={2}>
              {inquiryEntry.inquiry.message}
            </Text>

            <View style={styles.metaRow}>
              <Ionicons name="pricetag-outline" size={sizes.iconSmall} color={colors.text.secondary} />
              <Text style={[typography.caption, styles.mutedText]}>{tagOption?.label}</Text>
              <Ionicons
                name="chatbubble-outline"
                size={sizes.iconSmall}
                color={colors.text.secondary}
              />
              <Text style={[typography.caption, styles.mutedText]}>
                {inquiryEntry.replyCount} {inquiryEntry.replyCount === 1 ? 'reply' : 'replies'}
              </Text>
            </View>
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
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  subjectText: {
    flex: 1,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});
