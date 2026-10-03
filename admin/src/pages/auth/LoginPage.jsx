// Admin login page (Member 01): email or mobile + password; only admins are let in. Built in the foundation.
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ICON_SIZES } from '../../theme/iconSizes';

const LOGIN_MESSAGES = Object.freeze({
  identifierRequired: 'Enter your email or mobile number.',
  passwordRequired: 'Enter your password.',
});

/**
 * Client-side check for instant feedback; the server validates again.
 * @param {string} identifier - Email or mobile number.
 * @param {string} password - Password.
 * @returns {Object<string, string>} Field name -> error text.
 */
function validateLoginForm(identifier, password) {
  const formErrors = {};
  if (!identifier.trim()) formErrors.identifier = LOGIN_MESSAGES.identifierRequired;
  if (!password) formErrors.password = LOGIN_MESSAGES.passwordRequired;
  return formErrors;
}

/**
 * One labelled input with an icon + text error message.
 * @param {object} props - Component props.
 * @param {string} props.fieldId - Input id (links label and error).
 * @param {string} props.label - Visible label.
 * @param {string} [props.errorText] - Error under the field.
 * @param {object} props.inputProps - Props passed to <input>.
 * @returns {import('react').JSX.Element} Form field.
 */
function LoginField({ fieldId, label, errorText, inputProps }) {
  const errorId = `${fieldId}-error`;
  return (
    <div className="form-field">
      <label htmlFor={fieldId} className="text-label text-muted">
        {label}
      </label>
      <input
        id={fieldId}
        className={errorText ? 'form-field__input form-field__input--invalid' : 'form-field__input'}
        aria-invalid={Boolean(errorText)}
        aria-describedby={errorText ? errorId : undefined}
        {...inputProps}
      />
      {errorText && (
        <p id={errorId} className="form-field__error">
          <CircleAlert size={ICON_SIZES.small} aria-hidden="true" />
          {errorText}
        </p>
      )}
    </div>
  );
}

/**
 * Sign-in page. After a successful login the admin returns to the page they wanted (or Overview).
 * @returns {import('react').JSX.Element} Login page.
 */
export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const redirectTo = currentLocation.state?.redirectTo || '/';

  if (user) return <Navigate to={redirectTo} replace />;

  const submitLogin = async (submitEvent) => {
    submitEvent.preventDefault();
    const formErrors = validateLoginForm(identifier, password);
    setFieldErrors(formErrors);
    setLoginErrorMessage('');
    if (Object.keys(formErrors).length > 0) return;

    setIsSigningIn(true);
    try {
      await login(identifier.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setFieldErrors(loginError.fieldErrors || {});
      setLoginErrorMessage(loginError.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <main className="login-page">
      <form className="card login-card" onSubmit={submitLogin} noValidate>
        <div className="login-card__brand">
          <img src="/logo.png" alt="Ceylon Smart Bus logo" className="login-card__logo" />
          <h1 className="text-display">Admin sign in</h1>
          <p className="text-muted">Manage routes, buses, delays and announcements.</p>
        </div>

        <LoginField
          fieldId="login-identifier"
          label="Email or mobile number"
          errorText={fieldErrors.identifier}
          inputProps={{
            type: 'text',
            autoComplete: 'username',
            placeholder: 'admin@ceylonsmartbus.lk',
            onChange: (changeEvent) => setIdentifier(changeEvent.target.value),
          }}
        />
        <LoginField
          fieldId="login-password"
          label="Password"
          errorText={fieldErrors.password}
          inputProps={{
            type: 'password',
            autoComplete: 'current-password',
            placeholder: 'Your password',
            onChange: (changeEvent) => setPassword(changeEvent.target.value),
          }}
        />

        {loginErrorMessage && (
          <p className="alert-banner" role="alert">
            <CircleAlert size={ICON_SIZES.medium} aria-hidden="true" />
            {loginErrorMessage}
          </p>
        )}

        <Button label="Sign in" type="submit" size="large" isFullWidth isLoading={isSigningIn} />
      </form>
    </main>
  );
}
