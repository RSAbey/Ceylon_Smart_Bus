// The admin inquiry inbox on mobile. The dashboard shows a table with the counts above it; here
// each inquiry is a card, and the two numbers an administrator works from — how many are waiting
// too long and how many nobody has taken — sit at the top where they cannot be missed.
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppTextInput from '../../../components/ui/AppTextInput';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { colors, spacing, typography } from '../../../theme';
import useAdminCollection from '../hooks/useAdminCollection';
import FilterChipRow from '../components/FilterChipRow';
import AdminRecordCard from '../components/AdminRecordCard';
import {
  ADMIN_MESSAGES,
  INQUIRY_PRIORITY_TONES,
  INQUIRY_STATUSES,
  INQUIRY_STATUS_TONES,
  INQUIRY_TAG_LABELS,
} from '../constants';
import { fetchInquiryInbox } from '../services/adminInquiryApi';

const ALL_STATUSES = 'all';
const ONE_HOUR = 1;

/**
 * Says how long an inquiry has been waiting, in words.
 * @param {number} waitingHours - Hours since it arrived.
 * @returns {string} For example "waiting 1 hour" or "waiting 32 hours".
 */
function describeWait(waitingHours) {
  const roundedHours = Math.round(waitingHours);
  return `Waiting ${roundedHours} hour${roundedHours === ONE_HOUR ? '' : 's'}`;
}

/**
 * Admin inquiry inbox.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AdminInquiriesScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [searchText, setSearchText] = useState('');

  const loadInbox = useCallback(
    () =>
      fetchInquiryInbox({
        status: statusFilter === ALL_STATUSES ? undefined : statusFilter,
        searchText: searchText.trim() || undefined,
      }),
    [statusFilter, searchText]
  );
  const { collection, isLoading, loadErrorMessage, reload } = useAdminCollection(loadInbox);

  const filterChips = useMemo(() => {
    const statusCounts = collection?.statusCounts || {};
    return [
      { key: ALL_STATUSES, label: ADMIN_MESSAGES.allFilterLabel, count: statusCounts.total },
      { key: INQUIRY_STATUSES.OPEN, label: 'Open', count: statusCounts.open },
      { key: INQUIRY_STATUSES.REPLIED, label: 'Replied', count: statusCounts.replied },
      { key: INQUIRY_STATUSES.CLOSED, label: 'Closed', count: statusCounts.closed },
    ];
  }, [collection]);

  const screenHeader = <AppHeader title="Inquiries" />;

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading the inbox..." />
      </ScreenContainer>
    );
  }

  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reload} />
      </ScreenContainer>
    );
  }

  const inquiryRows = collection?.inquiries || [];

  return (
    <ScreenContainer header={screenHeader} isScrollable>
      <AppCard>
        <Text style={typography.sectionHeading}>Needs attention</Text>
        <View style={styles.summaryRow}>
          <Text style={[typography.bodyMedium, styles.mutedText]}>
            {`${collection?.highPriorityOpenCount || 0} high priority open`}
          </Text>
          <Text style={[typography.bodyMedium, styles.mutedText]}>
            {`${collection?.unassignedOpenCount || 0} nobody has taken`}
          </Text>
        </View>
        <Text style={[typography.caption, styles.mutedText]}>
          {`The team aims to answer within ${collection?.replyTargetHours || 24} hours.`}
        </Text>
      </AppCard>

      <AppTextInput
        label="Search"
        placeholder="Subject or message"
        value={searchText}
        onChangeText={setSearchText}
        iconName="search-outline"
        autoCapitalize="none"
      />

      <FilterChipRow chips={filterChips} selectedKey={statusFilter} onSelect={setStatusFilter} />

      {inquiryRows.length === 0 ? (
        <EmptyState
          iconName="chatbubbles-outline"
          title="Nothing to answer"
          message="No inquiry matches this filter. Try another one, or clear the search."
        />
      ) : (
        inquiryRows.map((inquiryRow) => {
          const { inquiry } = inquiryRow;
          const inquiryChips = [
            {
              key: 'status',
              label: inquiry.status,
              tone: INQUIRY_STATUS_TONES[inquiry.status],
            },
            {
              key: 'priority',
              label: `${inquiry.priority} priority`,
              tone: INQUIRY_PRIORITY_TONES[inquiry.priority],
            },
          ];
          if (inquiryRow.isWaitingTooLong) {
            inquiryChips.push({ key: 'late', label: 'Past the target', tone: 'error' });
          }

          return (
            <AdminRecordCard
              key={inquiry.id}
              title={inquiry.subject}
              subtitle={inquiry.message}
              chips={inquiryChips}
              detailLines={[
                {
                  key: 'author',
                  label: `${inquiry.userId?.fullName || 'A passenger'} · ${
                    INQUIRY_TAG_LABELS[inquiry.tag] || inquiry.tag
                  }`,
                },
                {
                  key: 'wait',
                  label: `${describeWait(inquiryRow.waitingHours)} · ${inquiryRow.replyCount} ${
                    inquiryRow.replyCount === 1 ? 'reply' : 'replies'
                  }`,
                },
                {
                  key: 'assignee',
                  label: inquiry.assigneeId
                    ? `Taken by ${inquiry.assigneeId.fullName}`
                    : 'Nobody has taken this',
                },
              ]}
              actions={[
                {
                  key: 'open',
                  label: 'Open conversation',
                  iconName: 'arrow-forward-outline',
                  variant: 'primary',
                  onPress: () => router.push(`/(admin)/inquiry/${inquiry.id}`),
                },
              ]}
            />
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
  summaryRow: {
    gap: spacing.xxs,
  },
});
