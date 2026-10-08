// Passenger record (Member 01): what support reads before answering a call about an account —
// how to reach them, what they have spent, their last journeys and anything still unanswered.
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  PASSENGER_MESSAGES,
  PASSENGER_STATUS_BADGES,
  USER_STATUSES,
  formatDate,
  formatRupees,
} from './passengerConstants';

/** Plain wording for a ticket state, so the list reads without knowing the enum. */
const TICKET_STATUS_LABELS = Object.freeze({
  active: 'Active',
  used: 'Used on the bus',
  cancelled: 'Cancelled',
  expired: 'Expired',
});

/** The same for an inquiry, which is shown here only as a line of context. */
const INQUIRY_STATUS_LABELS = Object.freeze({
  open: 'Not answered yet',
  replied: 'Answered, still open',
});

const INQUIRY_PRIORITY_LABELS = Object.freeze({
  high: 'High',
  medium: 'Medium',
  low: 'Low',
});

/**
 * One passenger's record.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object | null} props.passengerProfile - The passenger and their activity.
 * @param {boolean} props.isSaving - Shows the loading state on the block button.
 * @param {Function} props.onChangeStatus - Called with the status to set.
 * @param {Function} props.onDismiss - Called when the dialog is dismissed.
 * @returns {import('react').JSX.Element} The dialog.
 */
export default function PassengerDetailModal({
  isOpen,
  passengerProfile,
  isSaving,
  onChangeStatus,
  onDismiss,
}) {
  const account = passengerProfile?.account;
  const isBlocked = account?.status === USER_STATUSES.BLOCKED;
  const statusBadge = PASSENGER_STATUS_BADGES[account?.status] || PASSENGER_STATUS_BADGES.active;

  return (
    <Modal
      isOpen={isOpen}
      title={account?.fullName || 'Passenger'}
      onClose={onDismiss}
      size="wide"
      footer={
        <>
          <Button
            label={isBlocked ? PASSENGER_MESSAGES.unblockLabel : PASSENGER_MESSAGES.blockLabel}
            variant={isBlocked ? 'success' : 'error'}
            isLoading={isSaving}
            onClick={() =>
              onChangeStatus(isBlocked ? USER_STATUSES.ACTIVE : USER_STATUSES.BLOCKED)
            }
          />
          <Button label="Done" variant="outline" onClick={onDismiss} />
        </>
      }
    >
      <div className="button-row">
        <StatusBadge status={statusBadge.status} label={statusBadge.label} />
      </div>

      <p className="text-caption text-muted">
        {account?.email || 'no email on file'} · {account?.mobile || 'no mobile on file'} · joined{' '}
        {formatDate(account?.createdAt)}
      </p>

      <div className="form-grid">
        <div>
          <p className="text-label text-muted">Tickets bought</p>
          <p className="text-heading3">{passengerProfile?.ticketCount}</p>
          <p className="text-caption text-muted">
            {passengerProfile?.activeTicketCount} still active · last{' '}
            {formatDate(passengerProfile?.lastTicketAt)}
          </p>
        </div>
        <div>
          <p className="text-label text-muted">Fares paid</p>
          <p className="text-heading3">{formatRupees(passengerProfile?.totalPaid)}</p>
          <p className="text-caption text-muted">Payments that were not refunded</p>
        </div>
        <div>
          <p className="text-label text-muted">Wallet balance</p>
          <p className="text-heading3">
            {passengerProfile?.walletBalance === null
              ? PASSENGER_MESSAGES.noWallet
              : formatRupees(passengerProfile?.walletBalance)}
          </p>
          <p className="text-caption text-muted">
            {passengerProfile?.savedRouteCount} saved{' '}
            {passengerProfile?.savedRouteCount === 1 ? 'route' : 'routes'}
          </p>
        </div>
      </div>

      <h3 className="text-heading3">{PASSENGER_MESSAGES.recentTicketsHeading}</h3>
      {passengerProfile?.recentTickets?.length ? (
        <ul className="record-list">
          {passengerProfile.recentTickets.map((ticket) => (
            <li key={ticket.id} className="record-list__entry">
              <span>
                {ticket.ticketKey} · route {ticket.routeId?.routeNumber || 'unknown'} ·{' '}
                {formatRupees(ticket.fareAmount)}
              </span>
              <span className="text-caption text-muted">
                {TICKET_STATUS_LABELS[ticket.status] || ticket.status} ·{' '}
                {formatDate(ticket.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-medium text-muted">{PASSENGER_MESSAGES.noTickets}</p>
      )}

      <h3 className="text-heading3">{PASSENGER_MESSAGES.openInquiriesHeading}</h3>
      {passengerProfile?.openInquiries?.length ? (
        <ul className="record-list">
          {passengerProfile.openInquiries.map((inquiry) => (
            <li key={inquiry.id} className="record-list__entry">
              <span>{inquiry.subject}</span>
              <span className="text-caption text-muted">
                {INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status} ·{' '}
                {INQUIRY_PRIORITY_LABELS[inquiry.priority] || inquiry.priority} priority ·{' '}
                {formatDate(inquiry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-medium text-muted">{PASSENGER_MESSAGES.noInquiries}</p>
      )}

      {!isBlocked && passengerProfile?.activeTicketCount > 0 && (
        <p className="form-notice form-notice--warning">
          Blocking this account stops them signing in. It does not cancel the{' '}
          {passengerProfile.activeTicketCount} active{' '}
          {passengerProfile.activeTicketCount === 1 ? 'ticket' : 'tickets'} they hold, and a ticket
          already saved on their phone still shows offline, so refund it here first if that is what
          you mean to do.
        </p>
      )}
    </Modal>
  );
}
