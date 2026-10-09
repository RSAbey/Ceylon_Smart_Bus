// Inquiry detail (Member 03): the whole conversation in one place, so an administrator can read
// what was asked, see who is dealing with it, and answer without leaving the inbox.
import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  INQUIRY_MESSAGES,
  INQUIRY_PRIORITY_BADGES,
  INQUIRY_STATUSES,
  INQUIRY_STATUS_BADGES,
  INQUIRY_TAG_LABELS,
  MAX_REPLY_LENGTH,
  MIN_REPLY_LENGTH,
  REPLY_ROW_COUNT,
} from './inquiryConstants';

/**
 * Writes a stored date as "8 Oct 2026, 09:15".
 * @param {string} storedDate - ISO date from the API.
 * @returns {string} Date and time for the thread.
 */
function formatMoment(storedDate) {
  return new Date(storedDate).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Inquiry conversation dialog.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object | null} props.inquiryDetails - The inquiry and its replies.
 * @param {object[]} props.adminOptions - Administrators the inquiry can be assigned to.
 * @param {object} props.serverFieldErrors - Field errors returned by the API.
 * @param {boolean} props.isSaving - Shows the loading state on the reply button.
 * @param {Function} props.onReply - Called with the reply text.
 * @param {Function} props.onAssign - Called with an admin id, or null to unassign.
 * @param {Function} props.onCloseInquiry - Called when the admin closes the inquiry.
 * @param {Function} props.onReopenInquiry - Called when the admin reopens it.
 * @param {Function} props.onDismiss - Called when the dialog is dismissed.
 * @returns {import('react').JSX.Element} The dialog.
 */
export default function InquiryDetailModal({
  isOpen,
  inquiryDetails,
  adminOptions,
  serverFieldErrors,
  isSaving,
  onReply,
  onAssign,
  onCloseInquiry,
  onReopenInquiry,
  onDismiss,
}) {
  // The parent remounts this with a key, so the box starts empty each time an inquiry is opened.
  const [replyText, setReplyText] = useState('');
  const [localErrorMessage, setLocalErrorMessage] = useState('');

  const openInquiry = inquiryDetails?.inquiry;
  const replies = inquiryDetails?.replies || [];
  const isClosed = openInquiry?.status === INQUIRY_STATUSES.CLOSED;

  const sendReply = () => {
    const trimmedReply = replyText.trim();
    if (trimmedReply.length < MIN_REPLY_LENGTH || trimmedReply.length > MAX_REPLY_LENGTH) {
      setLocalErrorMessage(
        `Write a reply of ${MIN_REPLY_LENGTH} to ${MAX_REPLY_LENGTH} characters.`
      );
      return;
    }
    setLocalErrorMessage('');
    onReply(trimmedReply);
  };

  const statusBadge = INQUIRY_STATUS_BADGES[openInquiry?.status] || INQUIRY_STATUS_BADGES.open;
  const priorityBadge =
    INQUIRY_PRIORITY_BADGES[openInquiry?.priority] || INQUIRY_PRIORITY_BADGES.medium;

  return (
    <Modal
      isOpen={isOpen}
      title={openInquiry?.subject || 'Inquiry'}
      onClose={onDismiss}
      size="wide"
      footer={
        <>
          {isClosed ? (
            <Button label={INQUIRY_MESSAGES.reopenLabel} variant="outline" onClick={onReopenInquiry} />
          ) : (
            <Button label={INQUIRY_MESSAGES.closeLabel} variant="error" onClick={onCloseInquiry} />
          )}
          <Button label="Done" variant="outline" onClick={onDismiss} />
          <Button
            label={INQUIRY_MESSAGES.replyLabel}
            isLoading={isSaving}
            isDisabled={isClosed}
            onClick={sendReply}
          />
        </>
      }
    >
      <div className="button-row">
        <StatusBadge status={statusBadge.status} label={statusBadge.label} />
        <StatusBadge status={priorityBadge.status} label={`${priorityBadge.label} priority`} />
      </div>

      <p className="text-caption text-muted">
        {openInquiry?.userId?.fullName} ({openInquiry?.userId?.role}) ·{' '}
        {openInquiry?.userId?.email || 'no email on file'} ·{' '}
        {INQUIRY_TAG_LABELS[openInquiry?.tag] || openInquiry?.tag}
        {openInquiry?.routeId ? ` · route ${openInquiry.routeId.routeNumber}` : ''}
      </p>

      <div className="form-field">
        <label className="text-label" htmlFor="inquiryAssignee">
          {INQUIRY_MESSAGES.assigneeLabel}
        </label>
        <select
          id="inquiryAssignee"
          className="form-field__input"
          value={openInquiry?.assigneeId?.id || ''}
          onChange={(changeEvent) => onAssign(changeEvent.target.value || null)}
        >
          <option value="">{INQUIRY_MESSAGES.unassignedLabel}</option>
          {adminOptions.map((adminOption) => (
            <option key={adminOption.id} value={adminOption.id}>
              {adminOption.fullName}
            </option>
          ))}
        </select>
        <p className="text-caption text-muted">
          Assigning it takes it out of the unassigned queue so two people do not answer at once.
        </p>
      </div>

      <h3 className="text-heading3">{INQUIRY_MESSAGES.conversationHeading}</h3>
      <ol className="thread">
        <li className="thread__message">
          <p className="thread__meta text-caption text-muted">
            {openInquiry?.userId?.fullName} · {openInquiry ? formatMoment(openInquiry.createdAt) : ''}
          </p>
          <p>{openInquiry?.message}</p>
        </li>
        {replies.map((reply) => (
          <li key={reply.id} className="thread__message thread__message--admin">
            <p className="thread__meta text-caption text-muted">
              {reply.adminId?.fullName || 'Support'} · {formatMoment(reply.createdAt)}
            </p>
            <p>{reply.message}</p>
          </li>
        ))}
      </ol>

      {isClosed ? (
        <p className="form-notice">{INQUIRY_MESSAGES.closedNotice}</p>
      ) : (
        <FormField
          fieldId="inquiryReply"
          label="Your reply"
          fieldText={replyText}
          onFieldTextChange={(fieldText) => setReplyText(fieldText)}
          errorText={localErrorMessage || serverFieldErrors.message}
          helperText={`${replyText.trim().length} of ${MAX_REPLY_LENGTH} characters. The author is alerted in the app as soon as you send it.`}
          placeholder={INQUIRY_MESSAGES.replyPlaceholder}
          rowCount={REPLY_ROW_COUNT}
        />
      )}
    </Modal>
  );
}
