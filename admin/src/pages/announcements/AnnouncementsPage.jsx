// Announcements page (Member 04): write a message, keep it as a draft, then publish it, which is
// the moment every targeted passenger gets a notification.
import { useCallback, useEffect, useState } from 'react';
import { Archive, Megaphone, Pencil, Send, Trash2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import AnnouncementFormModal from './AnnouncementFormModal';
import {
  archiveAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  fetchRoutesForPicker,
  publishAnnouncement,
  updateAnnouncement,
} from '../overview/dashboardApi';

/** Must match server/src/modules/announcements/announcement.constants.js. */
const ANNOUNCEMENT_STATUSES = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

const ANNOUNCEMENT_BADGES = Object.freeze({
  [ANNOUNCEMENT_STATUSES.DRAFT]: { status: 'cancelled', label: 'Draft' },
  [ANNOUNCEMENT_STATUSES.PUBLISHED]: { status: 'active', label: 'Published' },
  [ANNOUNCEMENT_STATUSES.ARCHIVED]: { status: 'disrupted', label: 'Archived' },
});

const ANNOUNCEMENT_SEVERITIES = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
});

const SEVERITY_BADGES = Object.freeze({
  [ANNOUNCEMENT_SEVERITIES.INFO]: { status: 'onTime', label: 'Info' },
  [ANNOUNCEMENT_SEVERITIES.WARNING]: { status: 'delayed', label: 'Warning' },
  [ANNOUNCEMENT_SEVERITIES.CRITICAL]: { status: 'invalid', label: 'Critical' },
});

/**
 * Admin announcement management.
 * @returns {import('react').JSX.Element} The page.
 */
export default function AnnouncementsPage() {
  const { showSuccessToast, showErrorToast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [announcementBeingEdited, setAnnouncementBeingEdited] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [announcementPendingPublish, setAnnouncementPendingPublish] = useState(null);
  const [announcementPendingDeletion, setAnnouncementPendingDeletion] = useState(null);

  const [reloadCounter, setReloadCounter] = useState(0);
  const loadAnnouncements = useCallback(
    () => setReloadCounter((previousCount) => previousCount + 1),
    []
  );

  useEffect(() => {
    let isEffectActive = true;
    Promise.all([fetchAnnouncements(), fetchRoutesForPicker()])
      .then(([loadedAnnouncements, loadedRoutes]) => {
        if (isEffectActive) {
          setAnnouncements(loadedAnnouncements);
          setRouteOptions(loadedRoutes);
          setLoadErrorMessage('');
        }
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
  }, [reloadCounter]);

  const openWriteForm = () => {
    setAnnouncementBeingEdited(null);
    setServerFieldErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (announcementRow) => {
    setAnnouncementBeingEdited(announcementRow);
    setServerFieldErrors({});
    setIsFormOpen(true);
  };

  const saveAnnouncement = async (announcementForm) => {
    setIsSaving(true);
    setServerFieldErrors({});
    try {
      if (announcementBeingEdited) {
        await updateAnnouncement(announcementBeingEdited.id, announcementForm);
        showSuccessToast('Draft updated.');
      } else {
        await createAnnouncement(announcementForm);
        showSuccessToast('Draft saved. Publish it when you are ready.');
      }
      setIsFormOpen(false);
      loadAnnouncements();
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
      showSuccessToast(`Published to ${notifiedCount} passengers.`);
      setAnnouncementPendingPublish(null);
      loadAnnouncements();
    } catch (publishError) {
      showErrorToast(publishError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const archiveRow = async (announcementRow) => {
    try {
      await archiveAnnouncement(announcementRow.id);
      showSuccessToast('Announcement archived.');
      loadAnnouncements();
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
      loadAnnouncements();
    } catch (deleteError) {
      showErrorToast(deleteError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const announcementColumns = [
    {
      key: 'title',
      header: 'Announcement',
      renderCell: (announcementRow) => (
        <>
          <div>{announcementRow.title}</div>
          <div className="text-caption text-muted">{announcementRow.message}</div>
        </>
      ),
    },
    {
      key: 'target',
      header: 'Goes to',
      renderCell: (announcementRow) =>
        announcementRow.targetRouteId
          ? `Route ${announcementRow.targetRouteId.routeNumber} followers`
          : 'All passengers',
    },
    {
      key: 'severity',
      header: 'Severity',
      renderCell: (announcementRow) => {
        const severityBadge = SEVERITY_BADGES[announcementRow.severity];
        return <StatusBadge status={severityBadge.status} label={severityBadge.label} />;
      },
    },
    {
      key: 'status',
      header: 'Status',
      renderCell: (announcementRow) => {
        const statusBadge = ANNOUNCEMENT_BADGES[announcementRow.status];
        return <StatusBadge status={statusBadge.status} label={statusBadge.label} />;
      },
    },
    {
      key: 'publishedAt',
      header: 'Published',
      renderCell: (announcementRow) =>
        announcementRow.publishedAt
          ? new Date(announcementRow.publishedAt).toLocaleString()
          : 'Not yet',
    },
  ];

  // A published announcement cannot be edited or deleted, because its notifications are already out.
  const rowActions = [
    {
      label: 'Publish',
      icon: Send,
      onClick: (announcementRow) => setAnnouncementPendingPublish(announcementRow),
      buildAriaLabel: (announcementRow) => `Publish ${announcementRow.title}`,
    },
    {
      label: 'Edit',
      icon: Pencil,
      onClick: openEditForm,
      buildAriaLabel: (announcementRow) => `Edit ${announcementRow.title}`,
    },
    {
      label: 'Archive',
      icon: Archive,
      variant: 'text',
      onClick: archiveRow,
      buildAriaLabel: (announcementRow) => `Archive ${announcementRow.title}`,
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'text',
      onClick: (announcementRow) => setAnnouncementPendingDeletion(announcementRow),
      buildAriaLabel: (announcementRow) => `Delete ${announcementRow.title}`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Service news sent to passengers as an in-app alert"
        actions={<Button label="Write announcement" icon={Megaphone} onClick={openWriteForm} />}
      />

      <DataTable
        caption="Announcements with who they reach and whether they have been published"
        columns={announcementColumns}
        rows={announcements}
        isLoading={isLoading}
        errorMessage={loadErrorMessage}
        onRetry={loadAnnouncements}
        emptyTitle="No announcements yet"
        emptyMessage="Write one to tell passengers about service changes, diversions or disruption."
        rowActions={rowActions}
      />

      <AnnouncementFormModal
        key={`${isFormOpen}-${announcementBeingEdited?.id || 'new'}`}
        isOpen={isFormOpen}
        announcementBeingEdited={announcementBeingEdited}
        routeOptions={routeOptions}
        serverFieldErrors={serverFieldErrors}
        isSaving={isSaving}
        onSubmit={saveAnnouncement}
        onClose={() => setIsFormOpen(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(announcementPendingPublish)}
        title="Publish this announcement?"
        message={
          announcementPendingPublish?.targetRouteId
            ? `Passengers following route ${announcementPendingPublish.targetRouteId.routeNumber} get an alert straight away. Once published it cannot be edited.`
            : 'Every active passenger gets an alert straight away. Once published it cannot be edited.'
        }
        confirmLabel="Publish"
        isConfirming={isSaving}
        onConfirm={confirmPublish}
        onCancel={() => setAnnouncementPendingPublish(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(announcementPendingDeletion)}
        title="Delete this draft?"
        message="This cannot be undone. Published announcements are archived instead of deleted."
        confirmLabel="Delete draft"
        isDestructive
        isConfirming={isSaving}
        onConfirm={confirmDelete}
        onCancel={() => setAnnouncementPendingDeletion(null)}
      />
    </>
  );
}
