// Shared admin button: same variants, sizes and states as the mobile AppButton (styles in theme/global.css).
import { LoaderCircle } from 'lucide-react';
import { ICON_SIZES } from '../../theme/iconSizes';

const LOADING_LABEL = 'Loading...';

/**
 * Accessible button. Hover, pressed (:active), focused (:focus-visible) and disabled states come from CSS.
 * @param {object} props - Component props.
 * @param {string} props.label - Visible text.
 * @param {Function} [props.onClick] - Click handler.
 * @param {'primary'|'secondary'|'outline'|'text'|'success'|'error'|'warning'|'information'} [props.variant] - Style.
 * @param {'small'|'medium'|'large'} [props.size] - Height 36 / 44 / 52.
 * @param {import('react').ComponentType} [props.icon] - Optional lucide icon component shown before the label.
 * @param {'button'|'submit'} [props.type] - HTML button type.
 * @param {boolean} [props.isDisabled] - Disables the button.
 * @param {boolean} [props.isLoading] - Shows a spinner + "Loading..." and disables the button.
 * @param {boolean} [props.isFullWidth] - Stretch to the container width.
 * @param {string} [props.ariaLabel] - Screen-reader text when it differs from the label.
 * @returns {import('react').JSX.Element} The button.
 */
export default function Button({
  label,
  onClick,
  variant = 'primary',
  size = 'medium',
  icon: IconComponent,
  type = 'button',
  isDisabled = false,
  isLoading = false,
  isFullWidth = false,
  ariaLabel,
}) {
  const buttonClassNames = ['button', `button--${variant}`, `button--${size}`, isFullWidth && 'button--full-width']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClassNames}
      onClick={onClick}
      disabled={isDisabled || isLoading}
      aria-busy={isLoading}
      aria-label={ariaLabel}
    >
      {isLoading ? (
        <LoaderCircle className="spinner" size={ICON_SIZES.button} aria-hidden="true" />
      ) : (
        IconComponent && <IconComponent size={ICON_SIZES.button} aria-hidden="true" />
      )}
      <span>{isLoading ? LOADING_LABEL : label}</span>
    </button>
  );
}
