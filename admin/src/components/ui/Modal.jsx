// Accessible modal dialog: overlay, title bar with close button, body and optional footer; Escape closes it.
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { ICON_SIZES } from '../../theme/iconSizes';

const ESCAPE_KEY = 'Escape';

/**
 * Generic modal used for forms (create/edit) and by ConfirmDialog.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the modal is shown.
 * @param {string} props.title - Dialog title.
 * @param {Function} props.onClose - Called on close button, backdrop click or Escape.
 * @param {import('react').ReactNode} props.children - Body content.
 * @param {import('react').ReactNode} [props.footer] - Action buttons.
 * @returns {import('react').JSX.Element | null} The modal, or null when closed.
 */
export default function Modal({ isOpen, title, onClose, children, footer }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (keyboardEvent) => {
      if (keyboardEvent.key === ESCAPE_KEY) onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="modal-title" className="text-heading3">
            {title}
          </h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={ICON_SIZES.medium} aria-hidden="true" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </section>
    </div>
  );
}
