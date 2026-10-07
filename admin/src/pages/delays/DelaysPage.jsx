// Delays page (Member 04, FR-08): every delay a driver has reported, so the office can acknowledge
// it, add a note the driver will see, or close it.
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, MessageSquarePlus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { fetchDelayReports, reviewDelayReport } from '../overview/dashboardApi';

/** Must match server/src/modules/delays/delay.constants.js. */
const DELAY_REPORT_STATUSES = Object.freeze({
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
});

const DELAY_BADGES = Object.freeze({
  [DELAY_REPORT_STATUSES.ACTIVE]: { status: 'delayed', label: 'Active' },
  [DELAY_REPORT_STATUSES.RESOLVED]: { status: 'onTime', label: 'Resolved' },
  [DELAY_REPORT_STATUSES.CANCELLED]: { status: 'cancelled', label: 'Withdrawn' },
});

const DELAY_REASON_LABELS = Object.freeze({
  heavy_traffic: 'Heavy traffic',
  road_closure: 'Road closure',
  mechanical: 'Mechanical',
  weather: 'Bad weather',
  other: 'Other',
});

const STATUS_FILTERS = Object.freeze([
  { label: 'All', status: '' },
  { label: 'Active', status: DELAY_REPORT_STATUSES.ACTIVE },
  { label: 'Resolved', status: DELAY_REPORT_STATUSES.RESOLVED },
  { label: 'Withdrawn', status: DELAY_REPORT_STATUSES.CANCELLED },
]);

/**
 * Admin delay monitoring.
 * @returns {import('react').JSX.Element} The page.
 */
export default function DelaysPage() {
  const { showSuccessToast, showErrorToast } = useToast();

  const [delayReports, setDelayReports] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [reportBeingAnnotated, setReportBeingAnnotated] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [reportPendingClose, setReportPendingClose] = useState(null);

  const [reloadCounter, setReloadCounter] = useState(0);
  const loadDelayReports = useCallback(
    () => setReloadCounter((previousCount) => previousCount + 1),
    []
  );

  useEffect(() => {
    let isEffectActive = true;
    fetchDelayReports(selectedStatus ? { status: selectedStatus } : {})
      .then((loadedReports) => {
        if (isEffectActive) {
          setDelayReports(loadedReports);
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
  }, [selectedStatus, reloadCounter]);

  /**
   * Switches filter. The spinner is set here rather than in an effect, because React 19 treats a
   * synchronous setState inside an effect as a cascading render.
   * @param {string} tabStatus - The chosen status, or an empty string for All.
   * @returns {void}
   */
  function showReportsWithStatus(tabStatus) {
    setIsLoading(true);
    setSelectedStatus(tabStatus);
  }

  const openNoteForm = (reportRow) => {
    setReportBeingAnnotated(reportRow);
    setAdminNote(reportRow.delayReport.adminNote || '');
  };

  const saveAdminNote = async () => {
    setIsSaving(true);
    try {
      await reviewDelayReport(reportBeingAnnotated.delayReport.id, { adminNote: adminNote.trim() });
      showSuccessToast('Note saved. The driver will see it in their history.');
      setReportBeingAnnotated(null);
      loadDelayReports();
    } catch (saveError) {
      showErrorToast(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmClose = async () => {
    setIsSaving(true);
    try {
      await reviewDelayReport(reportPendingClose.delayReport.id, {
        status: DELAY_REPORT_STATUSES.RESOLVED,
      });
      showSuccessToast('Delay closed.');
      setReportPendingClose(null);
      loadDelayReports();
    } catch (closeError) {
      showErrorToast(closeError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const delayColumns = [
    {
      key: 'route',
      header: 'Route and bus',
      renderCell: (reportRow) => (
        <>
          <div>Route {reportRow.route?.routeNumber || 'unknown'}</div>
          <div className="text-caption text-muted">{reportRow.bus?.plateNumber || 'No bus'}</div>
        </>
      ),
    },
    {
      key: 'driver',
      header: 'Driver',
      renderCell: (reportRow) => reportRow.driverName || 'Unknown',
    },
    {
      key: 'delayMinutes',
      header: 'Late by',
      renderCell: (reportRow) => `${reportRow.delayReport.delayMinutes} min`,
    },
    {
      key: 'reason',
      header: 'Reason',
      renderCell: (reportRow) => (
        <>
          <div>{DELAY_REASON_LABELS[reportRow.delayReport.reason] || reportRow.delayReport.reason}</div>
          {reportRow.delayReport.reasonNote && (
            <div className="text-caption text-muted">{reportRow.delayReport.reasonNote}</div>
          )}
        </>
      ),
    },
    {
      key: 'reportedAt',
      header: 'Reported',
      renderCell: (reportRow) => new Date(reportRow.delayReport.createdAt).toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      renderCell: (reportRow) => {
        const reportBadge = DELAY_BADGES[reportRow.delayReport.status];
        return <StatusBadge status={reportBadge.status} label={reportBadge.label} />;
      },
    },
  ];

  const rowActions = [
    {
      label: 'Add note',
      icon: MessageSquarePlus,
      onClick: openNoteForm,
      buildAriaLabel: (reportRow) =>
        `Add a note to the delay on route ${reportRow.route?.routeNumber}`,
    },
    {
      label: 'Close',
      icon: CheckCircle2,
      variant: 'text',
      onClick: (reportRow) => setReportPendingClose(reportRow),
      buildAriaLabel: (reportRow) => `Close the delay on route ${reportRow.route?.routeNumber}`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Delays"
        subtitle="Delays reported by drivers, and what the office did about them"
        actions={
          <div className="button-row">
            {STATUS_FILTERS.map((statusFilter) => (
              <Button
                key={statusFilter.label}
                label={statusFilter.label}
                variant={statusFilter.status === selectedStatus ? 'primary' : 'outline'}
                onClick={() => showReportsWithStatus(statusFilter.status)}
              />
            ))}
          </div>
        }
      />

      <DataTable
        caption="Delay reports with their route, driver, reason and status"
        columns={delayColumns}
        rows={delayReports}
        getRowKey={(reportRow) => reportRow.delayReport.id}
        isLoading={isLoading}
        errorMessage={loadErrorMessage}
        onRetry={loadDelayReports}
        emptyTitle="No delays reported"
        emptyMessage="Delays drivers report from the bus will appear here."
        rowActions={rowActions}
      />

      <Modal
        isOpen={Boolean(reportBeingAnnotated)}
        title="Note for the driver"
        onClose={() => setReportBeingAnnotated(null)}
        footer={
          <>
            <Button label="Cancel" variant="outline" onClick={() => setReportBeingAnnotated(null)} />
            <Button label="Save note" isLoading={isSaving} onClick={saveAdminNote} />
          </>
        }
      >
        <FormField
          fieldId="adminNote"
          label="Note"
          fieldText={adminNote}
          onFieldTextChange={setAdminNote}
          helperText="The driver sees this against the report in their delay history."
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(reportPendingClose)}
        title="Close this delay?"
        message="Mark the hold-up as dealt with. The driver keeps the report in their history."
        confirmLabel="Close delay"
        isConfirming={isSaving}
        onConfirm={confirmClose}
        onCancel={() => setReportPendingClose(null)}
      />
    </>
  );
}
