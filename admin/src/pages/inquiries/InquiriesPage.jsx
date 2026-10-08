// Inquiries (Member 03, FR-08): the support inbox. Who asked what, who is dealing with it, how long
// it has waited, and the conversation an administrator answers in.
import { useEffect, useState } from 'react';
import { CircleAlert, Inbox, MailOpen, UserPlus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import InquiryDetailModal from './InquiryDetailModal';
import {
  assignInquiry,
  closeInquiry,
  fetchAdmins,
  fetchInquiryDetails,
  fetchInquiryInbox,
  replyToInquiry,
  reopenInquiry,
} from './inquiryApi';
import {
  INQUIRY_MESSAGES,
  INQUIRY_PRIORITIES,
  INQUIRY_PRIORITY_BADGES,
  INQUIRY_STATUS_BADGES,
  INQUIRY_STATUS_FILTERS,
  INQUIRY_TAG_LABELS,
  UNASSIGNED_FILTER,
  describeWait,
} from './inquiryConstants';

const NO_FIGURE_YET = '—';

/**
 * Admin support inbox.
 * @returns {import('react').JSX.Element} The page.
 */
export default function InquiriesPage() {
  const { showSuccessToast, showErrorToast } = useToast();

  const [inbox, setInbox] = useState(null);
  const [adminOptions, setAdminOptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [inquiryDetails, setInquiryDetails] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isEffectActive = true;
    Promise.all([
      fetchInquiryInbox({
        status: statusFilter,
        tag: tagFilter,
        priority: priorityFilter,
        assigneeId: assigneeFilter,
        searchText,
      }),
      fetchAdmins(),
    ])
      .then(([loadedInbox, loadedAdmins]) => {
        if (!isEffectActive) return;
        setInbox(loadedInbox);
        setAdminOptions(loadedAdmins);
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
  }, [statusFilter, tagFilter, priorityFilter, assigneeFilter, searchText, reloadCounter]);

  const reloadInbox = () => setReloadCounter((previousCount) => previousCount + 1);

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

  /**
   * Opens the conversation, loading the replies first so the thread is complete when it appears.
   * @param {object} inboxRow - Row the admin clicked Open on.
   * @returns {Promise<void>} Resolves once the dialog is ready.
   */
  async function openConversation(inboxRow) {
    try {
      setServerFieldErrors({});
      setInquiryDetails(await fetchInquiryDetails(inboxRow.inquiry.id));
    } catch (loadError) {
      showErrorToast(loadError.message);
    }
  }

  /**
   * Reloads the open conversation after an action, so the thread and the badges stay truthful.
   * @returns {Promise<void>} Resolves once reloaded.
   */
  async function refreshConversation() {
    setInquiryDetails(await fetchInquiryDetails(inquiryDetails.inquiry.id));
    reloadInbox();
  }

  const sendReply = async (message) => {
    setIsSaving(true);
    setServerFieldErrors({});
    try {
      await replyToInquiry(inquiryDetails.inquiry.id, message);
      showSuccessToast('Reply sent. The author has been alerted in the app.');
      await refreshConversation();
    } catch (replyError) {
      setServerFieldErrors(replyError.fieldErrors || {});
      if (Object.keys(replyError.fieldErrors || {}).length === 0) showErrorToast(replyError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const changeAssignee = async (assigneeId) => {
    try {
      await assignInquiry(inquiryDetails.inquiry.id, assigneeId);
      showSuccessToast(assigneeId ? 'Inquiry assigned.' : 'Inquiry put back in the queue.');
      await refreshConversation();
    } catch (assignError) {
      showErrorToast(assignError.message);
    }
  };

  const finishInquiry = async () => {
    try {
      await closeInquiry(inquiryDetails.inquiry.id);
      showSuccessToast('Inquiry closed.');
      await refreshConversation();
    } catch (closeError) {
      showErrorToast(closeError.message);
    }
  };

  const restartInquiry = async () => {
    try {
      await reopenInquiry(inquiryDetails.inquiry.id);
      showSuccessToast('Inquiry reopened. You can reply again.');
      await refreshConversation();
    } catch (reopenError) {
      showErrorToast(reopenError.message);
    }
  };

  const inquiryColumns = [
    {
      key: 'subject',
      header: 'Subject',
      renderCell: (inboxRow) => (
        <>
          <div>{inboxRow.inquiry.subject}</div>
          <div className="text-caption text-muted">
            {inboxRow.inquiry.userId?.fullName} ({inboxRow.inquiry.userId?.role})
          </div>
        </>
      ),
    },
    {
      key: 'tag',
      header: 'About',
      renderCell: (inboxRow) => INQUIRY_TAG_LABELS[inboxRow.inquiry.tag] || inboxRow.inquiry.tag,
    },
    {
      key: 'priority',
      header: 'Priority',
      renderCell: (inboxRow) => {
        const priorityBadge = INQUIRY_PRIORITY_BADGES[inboxRow.inquiry.priority];
        return <StatusBadge status={priorityBadge.status} label={priorityBadge.label} />;
      },
    },
    {
      key: 'assignee',
      header: 'Assigned to',
      renderCell: (inboxRow) =>
        inboxRow.inquiry.assigneeId?.fullName || INQUIRY_MESSAGES.unassignedLabel,
    },
    {
      key: 'waiting',
      header: 'Waiting',
      renderCell: (inboxRow) => {
        const waitLabel = describeWait(inboxRow.waitingHours);
        const replyLabel = `${inboxRow.replyCount} ${inboxRow.replyCount === 1 ? 'reply' : 'replies'}`;
        // A late inquiry is named as late, not only coloured (NFR-09).
        return (
          <>
            <div className={inboxRow.isWaitingTooLong ? 'cell-emphasis' : undefined}>
              {waitLabel}
              {inboxRow.isWaitingTooLong ? ' · no answer yet' : ''}
            </div>
            <div className="text-caption text-muted">{replyLabel}</div>
          </>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      renderCell: (inboxRow) => {
        const statusBadge = INQUIRY_STATUS_BADGES[inboxRow.inquiry.status];
        return <StatusBadge status={statusBadge.status} label={statusBadge.label} />;
      },
    },
  ];

  const rowActions = [
    {
      label: 'Open',
      icon: MailOpen,
      onClick: openConversation,
      buildAriaLabel: (inboxRow) => `Open the inquiry "${inboxRow.inquiry.subject}"`,
    },
  ];

  return (
    <>
      <PageHeader title={INQUIRY_MESSAGES.title} subtitle={INQUIRY_MESSAGES.subtitle} />

      <div className="stat-grid">
        <StatCard
          label="Open"
          statValue={inbox?.statusCounts?.open ?? NO_FIGURE_YET}
          icon={Inbox}
          helperText="Waiting for a first answer"
        />
        <StatCard
          label="Replied"
          statValue={inbox?.statusCounts?.replied ?? NO_FIGURE_YET}
          icon={MailOpen}
          helperText="Answered, not yet closed"
        />
        <StatCard
          label="Unassigned"
          statValue={inbox?.unassignedOpenCount ?? NO_FIGURE_YET}
          icon={UserPlus}
          helperText="Open and nobody has picked them up"
        />
        <StatCard
          label="High priority"
          statValue={inbox?.highPriorityOpenCount ?? NO_FIGURE_YET}
          icon={CircleAlert}
          helperText="Open and marked high by the author"
        />
      </div>

      <div className="filter-row">
        <div className="button-row">
          {INQUIRY_STATUS_FILTERS.map((inquiryFilter) => {
            const chipCount =
              inquiryFilter.status === ''
                ? inbox?.statusCounts?.total
                : inbox?.statusCounts?.[inquiryFilter.status];
            return (
              <Button
                key={inquiryFilter.label}
                label={chipCount === undefined ? inquiryFilter.label : `${inquiryFilter.label} (${chipCount})`}
                variant={inquiryFilter.status === statusFilter ? 'primary' : 'outline'}
                onClick={() => changeFilter(() => setStatusFilter(inquiryFilter.status))}
              />
            );
          })}
        </div>
        <input
          type="search"
          className="form-field__input filter-row__search"
          placeholder="Search subject or message..."
          aria-label="Search inquiries"
          value={searchText}
          onChange={(changeEvent) => changeFilter(() => setSearchText(changeEvent.target.value))}
        />
      </div>

      <div className="filter-row">
        <select
          className="form-field__input filter-row__select"
          aria-label="Filter by what the inquiry is about"
          value={tagFilter}
          onChange={(changeEvent) => changeFilter(() => setTagFilter(changeEvent.target.value))}
        >
          <option value="">Anything it is about</option>
          {Object.entries(INQUIRY_TAG_LABELS).map(([tagValue, tagLabel]) => (
            <option key={tagValue} value={tagValue}>
              {tagLabel}
            </option>
          ))}
        </select>
        <select
          className="form-field__input filter-row__select"
          aria-label="Filter by priority"
          value={priorityFilter}
          onChange={(changeEvent) => changeFilter(() => setPriorityFilter(changeEvent.target.value))}
        >
          <option value="">Any priority</option>
          {Object.values(INQUIRY_PRIORITIES).map((priorityValue) => (
            <option key={priorityValue} value={priorityValue}>
              {INQUIRY_PRIORITY_BADGES[priorityValue].label}
            </option>
          ))}
        </select>
        <select
          className="form-field__input filter-row__select"
          aria-label="Filter by who it is assigned to"
          value={assigneeFilter}
          onChange={(changeEvent) => changeFilter(() => setAssigneeFilter(changeEvent.target.value))}
        >
          <option value="">Anyone</option>
          <option value={UNASSIGNED_FILTER}>{INQUIRY_MESSAGES.unassignedLabel}</option>
          {adminOptions.map((adminOption) => (
            <option key={adminOption.id} value={adminOption.id}>
              {adminOption.fullName}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        caption="Inquiries with who raised them, who is dealing with them and how long they have waited"
        columns={inquiryColumns}
        rows={inbox?.inquiries || []}
        getRowKey={(inboxRow) => inboxRow.inquiry.id}
        isLoading={isLoading}
        errorMessage={loadErrorMessage}
        onRetry={reloadInbox}
        emptyTitle={INQUIRY_MESSAGES.emptyTitle}
        emptyMessage={INQUIRY_MESSAGES.emptyMessage}
        rowActions={rowActions}
      />

      <InquiryDetailModal
        // The reply count is part of the key, so a sent reply remounts the dialog with an empty box.
        key={`inquiry-${inquiryDetails?.inquiry?.id || 'none'}-${inquiryDetails?.replies?.length || 0}`}
        isOpen={Boolean(inquiryDetails)}
        inquiryDetails={inquiryDetails}
        adminOptions={adminOptions}
        serverFieldErrors={serverFieldErrors}
        isSaving={isSaving}
        onReply={sendReply}
        onAssign={changeAssignee}
        onCloseInquiry={finishInquiry}
        onReopenInquiry={restartInquiry}
        onDismiss={() => setInquiryDetails(null)}
      />
    </>
  );
}
