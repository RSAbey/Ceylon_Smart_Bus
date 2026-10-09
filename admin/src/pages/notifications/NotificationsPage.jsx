// Notifications (Member 04, FR-07): service news sent to passengers. A row is an ANNOUNCEMENT;
// publishing it is the moment one NOTIFICATION per targeted passenger is created, and the delivered
// and read figures on each row are counted from those rows rather than from what was intended.
import { useEffect, useState } from 'react';
import { Archive, BellRing, CheckCheck, FileText, Megaphone, Pencil, Send, Trash2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import NotificationComposerModal from './NotificationComposerModal';
import {
  archiveAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  fetchAudienceSize,
  fetchRoutesForPicker,
  publishAnnouncement,
  updateAnnouncement,
} from './notificationApi';
import {
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_STATUS_BADGES,
  ANNOUNCEMENT_STATUS_FILTERS,
  NOTIFICATION_MESSAGES,
  SEVERITY_BADGES,
} from './notificationConstants';

const NO_FIGURE_YET = '—';

/**
 * Who this notification is about to reach, as a sentence for the send confirmation.
 * @param {number | null} audienceCount - Passengers counted, or null when the count failed.
 * @param {object | null} targetRoute - The route being targeted, or null for everyone.
 * @returns {string} For example "One passenger following route 154 gets an alert straight away."
 */
function describeAudience(audienceCount, targetRoute) {
  const whoFollows = targetRoute ? ` following route ${targetRoute.routeNumber}` : '';
  if (audienceCount === null) {
    return targetRoute
      ? `Passengers${whoFollows} get an alert straight away.`
      : 'Every active passenger gets an alert straight away.';
  }
  if (audienceCount === 1) {
    return `One passenger${whoFollows} gets an alert straight away.`;
  }
  return `${audienceCount} passengers${whoFollows} get an alert straight away.`;
}

/**
 * Admin notification management.
 * @returns {import('react').JSX.Element} The page.
 */
export default function NotificationsPage() {
  const { showSuccessToast, showErrorToast } = useToast();

  const [announcementList, setAnnouncementList] = useState(null);
  const [routeOptions, setRouteOptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [announcementBeingEdited, setAnnouncementBeingEdited] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [announcementPendingPublish, setAnnouncementPendingPublish] = useState(null);
  const [publishAudienceCount, setPublishAudienceCount] = useState(null);
  const [announcementPendingDeletion, setAnnouncementPendingDeletion] = useState(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isEffectActive = true;
    Promise.all([fetchAnnouncements({ status: statusFilter }), fetchRoutesForPicker()])
      .then(([loadedList, loadedRoutes]) => {
        if (!isEffectActive) return;
        setAnnouncementList(loadedList);
        setRouteOptions(loadedRoutes);
        setLoadErrorMessage('');
      })
      .catch((loadError) => {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
      });
    // Ignore a reply that arrives after the page has moved on.
    return () => {
      isEffectActive = false;
    };
  }, [statusFilter, reloadCounter]);

  const reloadAnnouncements = () => setReloadCounter((previousCount) => previousCount + 1);

  /**
   * Switches filter. The spinner is set here rather than in an effect, because React 19 treats a
   * synchronous setState inside an effect as a cascading render.
   * @param {Function} applyFilter - Sets the chosen filter state.
   * @returns {void}
   */
  function changeFilter(applyFilter) {
    setIsLoading(true);
    applyFilter();
  }

  const openComposer = (announcementRow) => {
    setAnnouncementBeingEdited(announcementRow || null);
    setServerFieldErrors({});
    setIsComposerOpen(true);
  };

  /**
   * Opens the send confirmation, counting the audience first so the dialog names a real number.
   * @param {object} announcementRow - Announcement about to be sent.
   * @returns {Promise<void>} Resolves once the dialog is ready.
   */
  async function askToPublish(announcementRow) {
    setPublishAudienceCount(null);
    setAnnouncementPendingPublish(announcementRow);
    try {
      setPublishAudienceCount(await fetchAudienceSize(announcementRow.targetRouteId?.id));
    } catch {
      // The confirmation still works without the figure; it just does not promise a number.
      setPublishAudienceCount(null);
    }
  }

  const saveAnnouncement = async (announcementForm) => {
    setIsSaving(true);
    setServerFieldErrors({});
    try {
      if (announcementBeingEdited) {
        await updateAnnouncement(announcementBeingEdited.id, announcementForm);
        showSuccessToast('Draft updated.');
      } else {
        await createAnnouncement(announcementForm);
        showSuccessToast('Draft saved. Send it when you are ready.');
      }
      setIsComposerOpen(false);
      reloadAnnouncements();
    } catch (saveError) {
      setServerFieldErrors(saveError.fieldErrors || {});
      // Field-level problems are shown inside the form, so only surface anything else as a toast.
      if (Object.keys(saveError.fieldErrors || {}).length === 0) showErrorToast(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmPublish = async () => {
    setIsSaving(true);
    try {
      const { notifiedCount } = await publishAnnouncement(announcementPendingPublish.id);
      showSuccessToast(
        `Sent to ${notifiedCount} ${notifiedCount === 1 ? 'passenger' : 'passengers'}.`
      );
      setAnnouncementPendingPublish(null);
      reloadAnnouncements();
    } catch (publishError) {
      showErrorToast(publishError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const archiveRow = async (announcementRow) => {
    try {
      await archiveAnnouncement(announcementRow.id);
      showSuccessToast('Archived. Alerts already sent stay in the passengers’ feeds.');
      reloadAnnouncements();
    } catch (archiveError) {
      showErrorToast(archiveError.message);
    }
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
      await deleteAnnouncement(announcementPendingDeletion.id);
      showSuccessToast('Draft deleted.');
      setAnnouncementPendingDeletion(null);
      reloadAnnouncements();
    } catch (deleteError) {
      showErrorToast(deleteError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const announcementColumns = [
    {
      key: 'title',
      header: 'Notification',
      renderCell: (announcementRow) => (
        <>
          <div>{announcementRow.announcement.title}</div>
          <div className="text-caption text-muted">{announcementRow.announcement.message}</div>
        </>
      ),
    },
    {
      key: 'target',
      header: 'Goes to',
      renderCell: (announcementRow) =>
        announcementRow.announcement.targetRouteId
          ? `Route ${announcementRow.announcement.targetRouteId.routeNumber} followers`
          : 'All passengers',
    },
    {
      key: 'severity',
      header: 'Severity',
      renderCell: (announcementRow) => {
        const severityBadge = SEVERITY_BADGES[announcementRow.announcement.severity];
        return <StatusBadge status={severityBadge.status} label={severityBadge.label} />;
      },
    },
    {
      key: 'delivered',
      header: 'Delivered',
      renderCell: (announcementRow) =>
        announcementRow.announcement.publishedAt ? (
          <>
            <div>
              {announcementRow.deliveredCount}{' '}
              {announcementRow.deliveredCount === 1 ? 'alert' : 'alerts'}
            </div>
            <div className="text-caption text-muted">
              {announcementRow.readCount} read ·{' '}
              {new Date(announcementRow.announcement.publishedAt).toLocaleDateString()}
            </div>
          </>
        ) : (
          NOTIFICATION_MESSAGES.notSentYet
        ),
    },
    {
      key: 'status',
      header: 'Status',
      renderCell: (announcementRow) => {
        const statusBadge = ANNOUNCEMENT_STATUS_BADGES[announcementRow.announcement.status];
        return <StatusBadge status={statusBadge.status} label={statusBadge.label} />;
      },
    },
  ];

  // Each action is offered only where the server would accept it: a sent notification cannot be
  // edited or deleted, because its alerts are already in people's feeds.
  const isDraft = (announcementRow) =>
    announcementRow.announcement.status === ANNOUNCEMENT_STATUSES.DRAFT;
  const rowActions = [
    {
      label: 'Send',
      icon: Send,
      isAvailable: isDraft,
      onClick: (announcementRow) => askToPublish(announcementRow.announcement),
      buildAriaLabel: (announcementRow) => `Send ${announcementRow.announcement.title}`,
    },
    {
      label: 'Edit',
      icon: Pencil,
      isAvailable: isDraft,
      onClick: (announcementRow) => openComposer(announcementRow.announcement),
      buildAriaLabel: (announcementRow) => `Edit ${announcementRow.announcement.title}`,
    },
    {
      label: 'Archive',
      icon: Archive,
      variant: 'text',
      isAvailable: (announcementRow) =>
        announcementRow.announcement.status === ANNOUNCEMENT_STATUSES.PUBLISHED,
      onClick: (announcementRow) => archiveRow(announcementRow.announcement),
      buildAriaLabel: (announcementRow) => `Archive ${announcementRow.announcement.title}`,
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'text',
      isAvailable: isDraft,
      onClick: (announcementRow) => setAnnouncementPendingDeletion(announcementRow.announcement),
      buildAriaLabel: (announcementRow) => `Delete ${announcementRow.announcement.title}`,
    },
  ];

  const publishMessage = announcementPendingPublish
    ? `${describeAudience(publishAudienceCount, announcementPendingPublish.targetRouteId)} Once sent it cannot be edited or taken back.`
    : '';

  return (
    <>
      <PageHeader
        title={NOTIFICATION_MESSAGES.title}
        subtitle={NOTIFICATION_MESSAGES.subtitle}
        actions={
          <Button
            label={NOTIFICATION_MESSAGES.composeLabel}
            icon={Megaphone}
            onClick={() => openComposer(null)}
          />
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Sent"
          statValue={announcementList?.statusCounts?.published ?? NO_FIGURE_YET}
          icon={Send}
          helperText="Notifications passengers have received"
        />
        <StatCard
          label="Drafts"
          statValue={announcementList?.statusCounts?.draft ?? NO_FIGURE_YET}
          icon={FileText}
          helperText="Written but not sent to anyone"
        />
        <StatCard
          label="Alerts delivered"
          statValue={announcementList?.deliveredTotal ?? NO_FIGURE_YET}
          icon={BellRing}
          helperText="One per passenger, across every notification"
        />
        <StatCard
          label="Alerts read"
          statValue={announcementList?.readTotal ?? NO_FIGURE_YET}
          icon={CheckCheck}
          helperText="Opened in the passenger app"
        />
      </div>

      <div className="button-row">
        {ANNOUNCEMENT_STATUS_FILTERS.map((announcementFilter) => {
          const chipCount =
            announcementFilter.status === ''
              ? announcementList?.statusCounts?.total
              : announcementList?.statusCounts?.[announcementFilter.status];
          return (
            <Button
              key={announcementFilter.label}
              label={
                chipCount === undefined
                  ? announcementFilter.label
                  : `${announcementFilter.label} (${chipCount})`
              }
              variant={announcementFilter.status === statusFilter ? 'primary' : 'outline'}
              onClick={() => changeFilter(() => setStatusFilter(announcementFilter.status))}
            />
          );
        })}
      </div>

      <DataTable
        caption="Notifications with who they reach, how many alerts they delivered and how many were read"
        columns={announcementColumns}
        rows={announcementList?.announcements || []}
        getRowKey={(announcementRow) => announcementRow.announcement.id}
        isLoading={isLoading}
        errorMessage={loadErrorMessage}
        onRetry={reloadAnnouncements}
        emptyTitle={NOTIFICATION_MESSAGES.emptyTitle}
        emptyMessage={NOTIFICATION_MESSAGES.emptyMessage}
        rowActions={rowActions}
      />

      <NotificationComposerModal
        key={`${isComposerOpen}-${announcementBeingEdited?.id || 'new'}`}
        isOpen={isComposerOpen}
        announcementBeingEdited={announcementBeingEdited}
        routeOptions={routeOptions}
        serverFieldErrors={serverFieldErrors}
        isSaving={isSaving}
        onSubmit={saveAnnouncement}
        onClose={() => setIsComposerOpen(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(announcementPendingPublish)}
        title={NOTIFICATION_MESSAGES.publishTitle}
        message={publishMessage}
        confirmLabel={NOTIFICATION_MESSAGES.publishLabel}
        isConfirming={isSaving}
        onConfirm={confirmPublish}
        onCancel={() => setAnnouncementPendingPublish(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(announcementPendingDeletion)}
        title={NOTIFICATION_MESSAGES.deleteTitle}
        message={NOTIFICATION_MESSAGES.deleteMessage}
        confirmLabel={NOTIFICATION_MESSAGES.deleteLabel}
        isDestructive
        isConfirming={isSaving}
        onConfirm={confirmDelete}
        onCancel={() => setAnnouncementPendingDeletion(null)}
      />
    </>
  );
}
