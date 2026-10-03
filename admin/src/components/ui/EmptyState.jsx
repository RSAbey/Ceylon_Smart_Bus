// "Nothing here yet" block with icon, explanation and an optional next action.
import { Inbox } from 'lucide-react';
import { ICON_SIZES } from '../../theme/iconSizes';

/**
 * Empty state for tables and pages.
 * @param {object} props - Component props.
 * @param {string} props.title - Short headline.
 * @param {string} [props.message] - What the admin can do next.
 * @param {import('react').ComponentType} [props.icon] - lucide icon component.
 * @param {import('react').ReactNode} [props.action] - Optional button.
 * @returns {import('react').JSX.Element} Empty state.
 */
export default function EmptyState({ title, message, icon: IconComponent = Inbox, action }) {
  return (
    <div className="feedback-state">
      <span className="feedback-state__icon" aria-hidden="true">
        <IconComponent size={ICON_SIZES.feedback} />
      </span>
      <h3 className="text-heading3">{title}</h3>
      {message && <p className="text-muted">{message}</p>}
      {action}
    </div>
  );
}
