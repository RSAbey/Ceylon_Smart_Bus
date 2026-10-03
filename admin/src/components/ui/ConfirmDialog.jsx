// Yes/no confirmation built on Modal; destructive actions (delete, logout) use the error button style.
import { Trash2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * Confirmation dialog, for example "Delete this announcement?".
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {string} props.title - Question.
 * @param {string} [props.message] - Consequence of the action.
 * @param {string} [props.confirmLabel] - Confirm button text.
 * @param {string} [props.cancelLabel] - Cancel button text.
 * @param {boolean} [props.isDestructive] - Red confirm button with a trash icon.
 * @param {boolean} [props.isConfirming] - Loading state on the confirm button.
 * @param {Function} props.onConfirm - Called on confirm.
 * @param {Function} props.onCancel - Called on cancel / close.
 * @returns {import('react').JSX.Element} The dialog.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button label={cancelLabel} variant="outline" onClick={onCancel} isDisabled={isConfirming} />
          <Button
            label={confirmLabel}
            variant={isDestructive ? 'error' : 'primary'}
            icon={isDestructive ? Trash2 : undefined}
            onClick={onConfirm}
            isLoading={isConfirming}
          />
        </>
      }
    >
      {message && <p className="text-muted">{message}</p>}
    </Modal>
  );
}
