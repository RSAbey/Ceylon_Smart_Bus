// Passengers (Member 01, FR-01 / FR-10): the account roster. Support opens a passenger here to see
// what they have travelled on before answering them, and an account is blocked from the same place.
import { useEffect, useState } from 'react';
import { Ban, UserRound, UserRoundPlus, Wallet } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import PassengerDetailModal from './PassengerDetailModal';
import { fetchPassengerProfile, fetchPassengers, setPassengerStatus } from './passengerApi';
import {
  PASSENGER_MESSAGES,
  PASSENGER_STATUS_BADGES,
  PASSENGER_STATUS_FILTERS,
  USER_STATUSES,
  formatDate,
  formatRupees,
} from './passengerConstants';

const NO_FIGURE_YET = '—';

/**
 * Admin passenger accounts.
 * @returns {import('react').JSX.Element} The page.
 */
export default function PassengersPage() {
  const { showSuccessToast, showErrorToast } = useToast();

  const [passengerRows, setPassengerRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [passengerProfile, setPassengerProfile] = useState(null);
  const [statusChangePending, setStatusChangePending] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isEffectActive = true;
    fetchPassengers({ status: statusFilter, searchText })
      .then((passengerList) => {
        if (!isEffectActive) return;
        setPassengerRows(passengerList.passengers);
        setSummary(passengerList.summary);
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
  }, [statusFilter, searchText, reloadCounter]);

  const reloadPassengers = () => setReloadCounter((previousCount) => previousCount + 1);

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
   * Opens one passenger's record, loading their activity before the dialog appears.
   * @param {object} passengerRow - Row the admin clicked Open on.
   * @returns {Promise<void>} Resolves once the dialog is ready.
   */
  async function openPassenger(passengerRow) {
    try {
      setPassengerProfile(await fetchPassengerProfile(passengerRow.account.id));
    } catch (loadError) {
      showErrorToast(loadError.message);
    }
  }

  const confirmStatusChange = async () => {
    setIsSaving(true);
    try {
      await setPassengerStatus(statusChangePending.account.id, statusChangePending.nextStatus);
      showSuccessToast(
        statusChangePending.nextStatus === USER_STATUSES.BLOCKED
          ? `${statusChangePending.account.fullName} can no longer sign in.`
          : `${statusChangePending.account.fullName} can sign in again.`
      );
      setStatusChangePending(null);
      setPassengerProfile(null);
      reloadPassengers();
    } catch (statusError) {
      showErrorToast(statusError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const passengerColumns = [
    {
      key: 'fullName',
      header: 'Passenger',
      renderCell: (passengerRow) => (
        <>
          <div>{passengerRow.account.fullName}</div>
          <div className="text-caption text-muted">
            {passengerRow.account.email || passengerRow.account.mobile}
          </div>
        </>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      renderCell: (passengerRow) => formatDate(passengerRow.account.createdAt),
    },
    {
      key: 'tickets',
      header: 'Tickets',
      renderCell: (passengerRow) => (
        <>
          <div>{passengerRow.ticketCount}</div>
          <div className="text-caption text-muted">
            {passengerRow.activeTicketCount} active · last {formatDate(passengerRow.lastTicketAt)}
          </div>
        </>
      ),
    },
    {
      key: 'walletBalance',
      header: 'Wallet',
      renderCell: (passengerRow) =>
        passengerRow.walletBalance === null
          ? PASSENGER_MESSAGES.noWallet
          : formatRupees(passengerRow.walletBalance),
    },
    {
      key: 'openInquiryCount',
      header: 'Waiting on us',
      renderCell: (passengerRow) =>
        // A passenger with an unanswered inquiry is named as such, not only coloured (NFR-09).
        passengerRow.openInquiryCount > 0 ? (
          <span className="cell-emphasis">
            {passengerRow.openInquiryCount}{' '}
            {passengerRow.openInquiryCount === 1 ? 'inquiry' : 'inquiries'}
          </span>
        ) : (
          'Nothing open'
        ),
    },
    {
      key: 'status',
      header: 'Account',
      renderCell: (passengerRow) => {
        const statusBadge = PASSENGER_STATUS_BADGES[passengerRow.account.status];
        return <StatusBadge status={statusBadge.status} label={statusBadge.label} />;
      },
    },
  ];

  const rowActions = [
    {
      label: 'Open',
      icon: UserRound,
      onClick: openPassenger,
      buildAriaLabel: (passengerRow) => `Open the record of ${passengerRow.account.fullName}`,
    },
    {
      label: PASSENGER_MESSAGES.blockLabel,
      icon: Ban,
      isAvailable: (passengerRow) => passengerRow.account.status === USER_STATUSES.ACTIVE,
      onClick: (passengerRow) =>
        setStatusChangePending({ ...passengerRow, nextStatus: USER_STATUSES.BLOCKED }),
      buildAriaLabel: (passengerRow) => `Block the account of ${passengerRow.account.fullName}`,
    },
    {
      label: PASSENGER_MESSAGES.unblockLabel,
      icon: UserRoundPlus,
      isAvailable: (passengerRow) => passengerRow.account.status === USER_STATUSES.BLOCKED,
      onClick: (passengerRow) =>
        setStatusChangePending({ ...passengerRow, nextStatus: USER_STATUSES.ACTIVE }),
      buildAriaLabel: (passengerRow) => `Unblock the account of ${passengerRow.account.fullName}`,
    },
  ];

  const isBlocking = statusChangePending?.nextStatus === USER_STATUSES.BLOCKED;
  const activeTicketCount = statusChangePending?.activeTicketCount || 0;
  const statusChangeMessage = statusChangePending
    ? isBlocking
      ? `${statusChangePending.account.fullName} will be refused at sign-in, on the app and here, until the account is unblocked.` +
        (activeTicketCount > 0
          ? ` They hold ${activeTicketCount} active ${activeTicketCount === 1 ? 'ticket' : 'tickets'}, which this does not cancel; a ticket already saved on their phone still shows offline.`
          : '')
      : `${statusChangePending.account.fullName} will be able to sign in and travel again.`
    : '';

  return (
    <>
      <PageHeader title={PASSENGER_MESSAGES.title} subtitle={PASSENGER_MESSAGES.subtitle} />

      <div className="stat-grid">
        <StatCard
          label="Passengers"
          statValue={summary?.totalCount ?? NO_FIGURE_YET}
          icon={UserRound}
          helperText="Accounts with the passenger role"
        />
        <StatCard
          label="Active"
          statValue={summary?.activeCount ?? NO_FIGURE_YET}
          icon={Wallet}
          helperText="Able to sign in and buy a ticket"
        />
        <StatCard
          label="Blocked"
          statValue={summary?.blockedCount ?? NO_FIGURE_YET}
          icon={Ban}
          helperText="Refused at sign-in"
        />
        <StatCard
          label="New this week"
          statValue={summary?.newThisWeekCount ?? NO_FIGURE_YET}
          icon={UserRoundPlus}
          helperText={summary ? `Registered in the last ${summary.newWindowDays} days` : undefined}
        />
      </div>

      <div className="filter-row">
        <div className="button-row">
          {PASSENGER_STATUS_FILTERS.map((passengerFilter) => (
            <Button
              key={passengerFilter.label}
              label={passengerFilter.label}
              variant={passengerFilter.status === statusFilter ? 'primary' : 'outline'}
              onClick={() => changeFilter(() => setStatusFilter(passengerFilter.status))}
            />
          ))}
        </div>
        <input
          type="search"
          className="form-field__input filter-row__search"
          placeholder="Search name, email or mobile..."
          aria-label="Search passengers"
          value={searchText}
          onChange={(changeEvent) => changeFilter(() => setSearchText(changeEvent.target.value))}
        />
      </div>

      <DataTable
        caption="Passenger accounts with their travel history and anything they are waiting to hear"
        columns={passengerColumns}
        rows={passengerRows}
        getRowKey={(passengerRow) => passengerRow.account.id}
        isLoading={isLoading}
        errorMessage={loadErrorMessage}
        onRetry={reloadPassengers}
        emptyTitle={PASSENGER_MESSAGES.emptyTitle}
        emptyMessage={PASSENGER_MESSAGES.emptyMessage}
        rowActions={rowActions}
      />

      <PassengerDetailModal
        key={`passenger-${passengerProfile?.account?.id || 'none'}`}
        isOpen={Boolean(passengerProfile)}
        passengerProfile={passengerProfile}
        isSaving={isSaving}
        onChangeStatus={(nextStatus) =>
          setStatusChangePending({ ...passengerProfile, nextStatus })
        }
        onDismiss={() => setPassengerProfile(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(statusChangePending)}
        title={isBlocking ? PASSENGER_MESSAGES.blockTitle : PASSENGER_MESSAGES.unblockTitle}
        message={statusChangeMessage}
        confirmLabel={isBlocking ? PASSENGER_MESSAGES.blockLabel : PASSENGER_MESSAGES.unblockLabel}
        isDestructive={isBlocking}
        isConfirming={isSaving}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusChangePending(null)}
      />
    </>
  );
}
