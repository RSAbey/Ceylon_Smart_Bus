// Labelled input with an icon + text error message, shared by every admin form.
import { CircleAlert } from 'lucide-react';
import { ICON_SIZES } from '../../theme/iconSizes';

/**
 * One controlled form field.
 * @param {object} props - Component props.
 * @param {string} props.fieldId - Input id, used to link the label and the error text.
 * @param {string} props.label - Visible label.
 * @param {string} props.fieldText - Current text in the input.
 * @param {Function} props.onFieldTextChange - Called with the new text.
 * @param {string} [props.errorText] - Error shown under the field.
 * @param {string} [props.helperText] - Hint shown when there is no error.
 * @param {string} [props.inputType] - HTML input type (default "text").
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {string} [props.autoComplete] - Browser autofill hint.
 * @param {boolean} [props.isDisabled] - Greys the field out.
 * @returns {import('react').JSX.Element} The field.
 */
export default function FormField({
  fieldId,
  label,
  fieldText,
  onFieldTextChange,
  errorText,
  helperText,
  inputType = 'text',
  placeholder,
  autoComplete,
  isDisabled = false,
}) {
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  return (
    <div className="form-field">
      <label htmlFor={fieldId} className="text-label text-muted">
        {label}
      </label>
      <input
        id={fieldId}
        type={inputType}
        value={fieldText}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={isDisabled}
        onChange={(changeEvent) => onFieldTextChange(changeEvent.target.value)}
        className={errorText ? 'form-field__input form-field__input--invalid' : 'form-field__input'}
        aria-invalid={Boolean(errorText)}
        aria-describedby={errorText ? errorId : helperText ? helperId : undefined}
      />
      {errorText && (
        <p id={errorId} className="form-field__error">
          <CircleAlert size={ICON_SIZES.small} aria-hidden="true" />
          {errorText}
        </p>
      )}
      {!errorText && helperText && (
        <p id={helperId} className="text-caption text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
