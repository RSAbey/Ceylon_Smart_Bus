// Admin notification management on mobile: the list of announcements with everything an
// administrator can do to one. A draft can be edited, published or deleted; a published
// announcement can only be archived, because the alerts it sent have already reached passengers
// and deleting the record would leave those alerts with nothing behind them.
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/ToastMessage';
import { colors, typography } from '../../../theme';
import useAdminCollection from '../hooks/useAdminCollection';
import FilterChipRow from '../components/FilterChipRow';
import AdminRecordCard from '../components/AdminRecordCard';
import {
  ADMIN_MESSAGES,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_STATUS_TONES,
  SEVERITY_LABELS,
  SEVERITY_TONES,
} from '../constants';
import {
  archiveAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  publishAnnouncement,
} from '../services/adminNotificationApi';

/** The "no filter" chip key. The API wants the parameter left out, not an empty string. */
const ALL_STATUSES = 'all';

/**
 * Formats a date as "8 Oct 2026".
 * @param {string} [isoDate] - ISO date from the API.
 * @returns {string} The short date, or an empty string.
 */
function formatShortDate(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Admin notification list.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AdminNotificationsScreen() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToast();
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const [isWorking, setIsWorking] = useState(false);

  const loadAnnouncements = useCallback(
    () => fetchAnnouncements({ status: statusFilter === ALL_STATUSES ? undefined : statusFilter }),
    [statusFilter]
  );
  const { collection, isLoading, loadErrorMessage, reload } = useAdminCollection(loadAnnouncements);

  const filterChips = useMemo(() => {
    const statusCounts = collection?.statusCounts || {};
    return [
      { key: ALL_STATUSES, label: ADMIN_MESSAGES.allFilterLabel, count: statusCounts.total },
      { key: ANNOUNCEMENT_STATUSES.DRAFT, label: 'Drafts', count: statusCounts.draft },
      { key: ANNOUNCEMENT_STATUSES.PUBLISHED, label: 'Published', count: statusCounts.published },
      { key: ANNOUNCEMENT_STATUSES.ARCHIVED, label: 'Archived', count: statusCounts.archived },
    ];
  }, [collection]);

  /**
   * Runs one action on an announcement and reloads the list.
   * @param {Function} runAction - The API call to make.
   * @param {string} successMessage - What to tell the administrator afterwards.
   * @returns {Promise<void>} Resolves once the list has been reloaded.
   */
  const runAnnouncementAction = async (runAction, successMessage) => {
    setIsWorking(true);
    try {
      await runAction();
      showSuccessToast(successMessage);
      reload();
    } catch (actionError) {
      showErrorToast(actionError.message);
    } finally {
      setIsWorking(false);
    }
  };

  const confirmDeletion = async () => {
    const announcementToDelete = pendingDeletion;
    setPendingDeletion(null);
    await runAnnouncementAction(
      () => deleteAnnouncement(announcementToDelete.id),
      'Draft deleted.'
    );
  };

  /**
   * The buttons for one announcement, which depend on where it is in its life.
   * @param {object} announcement - The ANNOUNCEMENT record.
   * @returns {Array<object>} Action descriptors for AdminRecordCard.
   */
  const buildActions = (announcement) => {
    const isDraft = announcement.status === ANNOUNCEMENT_STATUSES.DRAFT;
    const isPublished = announcement.status === ANNOUNCEMENT_STATUSES.PUBLISHED;
    const announcementActions = [];

    if (isDraft) {
      announcementActions.push({
        key: 'edit',
        label: 'Edit',
        iconName: 'create-outline',
        onPress: () =>
          router.push(`/(admin)/notification-form?announcementId=${announcement.id}`),
      });
      announcementActions.push({
        key: 'publish',
        label: 'Publish',
        iconName: 'send-outline',
        variant: 'primary',
        isDisabled: isWorking,
        onPress: () =>
          runAnnouncementAction(
            () => publishAnnouncement(announcement.id),
            'Published. Passengers have been notified.'
          ),
      });
      announcementActions.push({
        key: 'delete',
        label: 'Delete',
        iconName: 'trash-outline',
        variant: 'error',
        isDisabled: isWorking,
        onPress: () => setPendingDeletion(announcement),
      });
    }

    if (isPublished) {
      announcementActions.push({
        key: 'archive',
        label: 'Archive',
        iconName: 'archive-outline',
        isDisabled: isWorking,
        onPress: () =>
          runAnnouncementAction(
            () => archiveAnnouncement(announcement.id),
            'Archived. Alerts already sent are untouched.'
          ),
      });
    }

    return announcementActions;
  };

  const screenHeader = <AppHeader title="Notifications" />;

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading notifications..." />
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

  const announcementRows = collection?.announcements || [];

  return (
    <ScreenContainer header={screenHeader} isScrollable>
      <AppButton
        label="New notification"
        iconName="add-circle-outline"
        size="large"
        isFullWidth
        onPress={() => router.push('/(admin)/notification-form')}
      />

      <AppCard>
        <Text style={typography.sectionHeading}>Reach so far</Text>
        <Text style={[typography.bodyMedium, styles.mutedText]}>
          {`${collection?.deliveredTotal || 0} alerts delivered · ${collection?.readTotal || 0} read`}
        </Text>
      </AppCard>

      <FilterChipRow chips={filterChips} selectedKey={statusFilter} onSelect={setStatusFilter} />

      {announcementRows.length === 0 ? (
        <EmptyState
          iconName="megaphone-outline"
          title="Nothing here yet"
          message="Write a notification and it will appear here as a draft until you publish it."
        />
      ) : (
        announcementRows.map((announcementRow) => {
          const { announcement } = announcementRow;
          return (
            <AdminRecordCard
              key={announcement.id}
              title={announcement.title}
              subtitle={announcement.message}
              chips={[
                {
                  key: 'severity',
                  label: SEVERITY_LABELS[announcement.severity] || announcement.severity,
                  tone: SEVERITY_TONES[announcement.severity],
                },
                {
                  key: 'status',
                  label: announcement.status,
                  tone: ANNOUNCEMENT_STATUS_TONES[announcement.status],
                },
              ]}
              detailLines={[
                {
                  key: 'target',
                  label: announcement.targetRouteId
                    ? `Route ${announcement.targetRouteId.routeNumber}`
                    : 'Every passenger',
                },
                {
                  key: 'delivery',
                  label: `${announcementRow.deliveredCount} delivered · ${announcementRow.readCount} read`,
                },
                {
                  key: 'created',
                  label: `Written ${formatShortDate(announcement.createdAt)} by ${
                    announcement.adminId?.fullName || 'an administrator'
                  }`,
                },
              ]}
              actions={buildActions(announcement)}
            />
          );
        })
      )}

      <ConfirmDialog
        isVisible={Boolean(pendingDeletion)}
        title="Delete this draft?"
        message="It has not been published, so no passenger has seen it. This cannot be undone."
        confirmLabel={ADMIN_MESSAGES.deleteConfirmLabel}
        isDestructive
        isConfirming={isWorking}
        onConfirm={confirmDeletion}
        onCancel={() => setPendingDeletion(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
});
