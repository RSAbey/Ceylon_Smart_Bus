// Error block with the API message and a Retry button.
import { CloudOff, RefreshCw } from 'lucide-react';
import { ICON_SIZES } from '../../theme/iconSizes';
import Button from './Button';

/**
 * Shown when loading failed.
 * @param {object} props - Component props.
 * @param {string} [props.title] - Headline.
 * @param {string} [props.message] - Normalised API error message.
 * @param {Function} [props.onRetry] - Retry handler; the button is hidden without it.
 * @returns {import('react').JSX.Element} Error state.
 */
export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="feedback-state" role="alert">
      <span className="feedback-state__icon feedback-state__icon--error" aria-hidden="true">
        <CloudOff size={ICON_SIZES.feedback} />
      </span>
      <h3 className="text-heading3">{title}</h3>
      {message && <p className="text-muted">{message}</p>}
      {onRetry && <Button label="Try again" variant="outline" icon={RefreshCw} onClick={onRetry} />}
    </div>
  );
}
