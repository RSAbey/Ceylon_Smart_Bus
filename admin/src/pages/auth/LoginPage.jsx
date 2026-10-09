// Admin login (Member 01): email or mobile + password; only admins are let in. Two panels — the
// brand on the left, the form on the right — so the page says what the dashboard is for before
// anybody types anything.
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ICON_SIZES } from '../../theme/iconSizes';

const LOGIN_MESSAGES = Object.freeze({
  identifierRequired: 'Enter your email or mobile number.',
  passwordRequired: 'Enter your password.',
  headline: 'Real-time fleet control, one dashboard.',
  blurb:
    'Monitor live positions, manage routes and buses, and resolve delays reported by drivers — all in one place.',
  footer: 'Need access? Contact your system administrator.',
});

/** Where the route line in the brand panel bends, drawn in the panel's own 700 x 300 grid. */
const BRAND_ROUTE_STOPS = Object.freeze([
  { pointX: 40, pointY: 210 },
  { pointX: 220, pointY: 90 },
  { pointX: 420, pointY: 250 },
  { pointX: 560, pointY: 150 },
]);
/** The bus sits on the third point, which is where the line changes direction. */
const BRAND_BUS_POINT = Object.freeze({ pointX: 340, pointY: 170 });
const BRAND_STOP_RADIUS = 7;
const BRAND_BUS_RADIUS = 18;

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
 * Sign-in page. After a successful login the admin returns to the page they wanted (or Overview).
 * @returns {import('react').JSX.Element} Login page.
 */
export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordShown, setIsPasswordShown] = useState(false);
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
      <section className="login-brand" aria-label="Ceylon Smart Bus">
        <svg className="login-brand__art" viewBox="0 0 700 300" role="img" aria-label="A bus part way along a route">
          <polyline
            className="login-brand__line"
            points={BRAND_ROUTE_STOPS.map((stop) => `${stop.pointX},${stop.pointY}`).join(' ')}
          />
          {BRAND_ROUTE_STOPS.map((stop) => (
            <circle
              key={`${stop.pointX}-${stop.pointY}`}
              className="login-brand__stop"
              cx={stop.pointX}
              cy={stop.pointY}
              r={BRAND_STOP_RADIUS}
            />
          ))}
          <circle
            className="login-brand__bus"
            cx={BRAND_BUS_POINT.pointX}
            cy={BRAND_BUS_POINT.pointY}
            r={BRAND_BUS_RADIUS}
          />
        </svg>

        <div className="login-brand__words">
          <p className="text-section-heading login-brand__name">Ceylon Smart Bus</p>
          <p className="text-caption login-brand__subtitle">Admin console</p>
          <h1 className="text-display login-brand__headline">{LOGIN_MESSAGES.headline}</h1>
          <p className="login-brand__blurb">{LOGIN_MESSAGES.blurb}</p>
        </div>

        <p className="text-caption login-brand__footer">
          Ceylon Smart Bus · IT3060 group WE-133 · admin console
        </p>
      </section>

      <section className="login-form-panel">
        <form className="login-form" onSubmit={submitLogin} noValidate>
          <div>
            <h2 className="text-heading1">Admin sign in</h2>
            <p className="text-muted">Enter your credentials to open the dashboard.</p>
          </div>

          {loginErrorMessage && (
            <p className="alert-banner" role="alert">
              <CircleAlert size={ICON_SIZES.medium} aria-hidden="true" />
              {loginErrorMessage}
            </p>
          )}

          <div className="form-field">
            <label className="text-label text-muted" htmlFor="login-identifier">
              Email or mobile number
            </label>
            <div
              className={
                fieldErrors.identifier ? 'input-shell input-shell--invalid' : 'input-shell'
              }
            >
              <Mail size={ICON_SIZES.medium} aria-hidden="true" className="input-shell__icon" />
              <input
                id="login-identifier"
                type="text"
                className="input-shell__input"
                value={identifier}
                autoComplete="username"
                placeholder="admin@ceylonsmartbus.lk"
                aria-invalid={Boolean(fieldErrors.identifier)}
                aria-describedby={fieldErrors.identifier ? 'login-identifier-error' : undefined}
                onChange={(changeEvent) => setIdentifier(changeEvent.target.value)}
              />
            </div>
            {fieldErrors.identifier && (
              <p id="login-identifier-error" className="form-field__error">
                <CircleAlert size={ICON_SIZES.small} aria-hidden="true" />
                {fieldErrors.identifier}
              </p>
            )}
          </div>

          <div className="form-field">
            <label className="text-label text-muted" htmlFor="login-password">
              Password
            </label>
            <div
              className={fieldErrors.password ? 'input-shell input-shell--invalid' : 'input-shell'}
            >
              <Lock size={ICON_SIZES.medium} aria-hidden="true" className="input-shell__icon" />
              <input
                id="login-password"
                type={isPasswordShown ? 'text' : 'password'}
                className="input-shell__input"
                value={password}
                autoComplete="current-password"
                placeholder="Your password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                onChange={(changeEvent) => setPassword(changeEvent.target.value)}
              />
              <button
                type="button"
                className="input-shell__button"
                aria-label={isPasswordShown ? 'Hide password' : 'Show password'}
                onClick={() => setIsPasswordShown((wasShown) => !wasShown)}
              >
                {isPasswordShown ? (
                  <EyeOff size={ICON_SIZES.medium} aria-hidden="true" />
                ) : (
                  <Eye size={ICON_SIZES.medium} aria-hidden="true" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="login-password-error" className="form-field__error">
                <CircleAlert size={ICON_SIZES.small} aria-hidden="true" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          <Button label="Sign in" type="submit" size="large" isFullWidth isLoading={isSigningIn} />

          <p className="text-caption text-muted login-form__footer">{LOGIN_MESSAGES.footer}</p>
        </form>
      </section>
    </main>
  );
}
