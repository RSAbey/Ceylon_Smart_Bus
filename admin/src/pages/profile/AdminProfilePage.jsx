// My profile (Member 01, FR-01 / NFR-07): the administrator's own account. Their details, the work
// the system can attribute to them, and the two things only they may change — contact details and
// their password.
import { useEffect, useState } from 'react';
import { BellRing, Inbox, MessageSquare } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { changeMyPassword, fetchMyActivity, updateMyProfile } from './profileApi';

const NO_FIGURE_YET = '—';
const MIN_PASSWORD_LENGTH = 8;
/** Sri Lankan mobile numbers, the same rule the server applies. */
const SRI_LANKA_MOBILE_PATTERN = /^(?:0\d{9}|\+94\d{9})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_PASSWORD_FORM = Object.freeze({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

/**
 * The initials shown in the avatar circle.
 * @param {string} [fullName] - The administrator's name.
 * @returns {string} One or two letters.
 */
function buildInitials(fullName) {
  const nameParts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  return nameParts
    .slice(0, 2)
    .map((namePart) => namePart[0].toUpperCase())
    .join('');
}

/**
 * The signed-in administrator's own profile.
 * @returns {import('react').JSX.Element} The page.
 */
export default function AdminProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();

  const [detailsForm, setDetailsForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
  });
  const [detailErrors, setDetailErrors] = useState({});
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [activity, setActivity] = useState(null);

  useEffect(() => {
    let isEffectActive = true;
    fetchMyActivity()
      .then((loadedActivity) => {
        if (isEffectActive) setActivity(loadedActivity);
      })
      .catch(() => {
        // The figures are context, not the point of the page: without them it still works.
        if (isEffectActive) setActivity(null);
      });
    return () => {
      isEffectActive = false;
    };
  }, []);

  /**
   * Updates one field of the details form.
   * @param {string} fieldName - Which field changed.
   * @param {string} fieldText - Its new text.
   * @returns {void}
   */
  function changeDetail(fieldName, fieldText) {
    setDetailsForm((previousForm) => ({ ...previousForm, [fieldName]: fieldText }));
  }

  /**
   * Updates one field of the password form.
   * @param {string} fieldName - Which field changed.
   * @param {string} fieldText - Its new text.
   * @returns {void}
   */
  function changePasswordField(fieldName, fieldText) {
    setPasswordForm((previousForm) => ({ ...previousForm, [fieldName]: fieldText }));
  }

  const saveDetails = async () => {
    const foundErrors = {};
    if (detailsForm.fullName.trim().length === 0) foundErrors.fullName = 'Enter your full name.';
    if (detailsForm.email.trim() && !EMAIL_PATTERN.test(detailsForm.email.trim())) {
      foundErrors.email = 'Please enter a valid email address (e.g. name@domain.com)';
    }
    if (detailsForm.mobile.trim() && !SRI_LANKA_MOBILE_PATTERN.test(detailsForm.mobile.trim())) {
      foundErrors.mobile = 'Enter a Sri Lankan mobile number, for example 0771234567.';
    }
    if (detailsForm.email.trim().length === 0 && detailsForm.mobile.trim().length === 0) {
      foundErrors.email = 'Keep at least an email address or a mobile number on the account.';
    }
    setDetailErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) return;

    setIsSavingDetails(true);
    try {
      await updateMyProfile({
        fullName: detailsForm.fullName.trim(),
        email: detailsForm.email.trim() || undefined,
        mobile: detailsForm.mobile.trim() || undefined,
      });
      // Re-read the session so the name in the top bar matches what was just saved.
      await refreshUser();
      showSuccessToast('Your details are saved.');
    } catch (saveError) {
      setDetailErrors(saveError.fieldErrors || {});
      if (Object.keys(saveError.fieldErrors || {}).length === 0) showErrorToast(saveError.message);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const savePassword = async () => {
    const foundErrors = {};
    if (passwordForm.currentPassword.length === 0) {
      foundErrors.currentPassword = 'Enter your current password.';
    }
    if (passwordForm.newPassword.length < MIN_PASSWORD_LENGTH) {
      foundErrors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      foundErrors.confirmPassword = 'Both new password boxes must match.';
    }
    setPasswordErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) return;

    setIsSavingPassword(true);
    try {
      await changeMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(EMPTY_PASSWORD_FORM);
      showSuccessToast('Password changed. Use the new one next time you sign in.');
    } catch (passwordError) {
      setPasswordErrors(passwordError.fieldErrors || {});
      if (Object.keys(passwordError.fieldErrors || {}).length === 0) {
        showErrorToast(passwordError.message);
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="Your account, and the two things only you can change" />

      <section className="card profile-card" aria-label="Account">
        <span className="avatar avatar--large" aria-hidden="true">
          {buildInitials(user?.fullName)}
        </span>
        <div className="stack-tight">
          <p className="text-heading2">{user?.fullName}</p>
          <div className="button-row">
            <StatusBadge status="valid" label="Administrator" />
          </div>
          <p className="text-caption text-muted">
            {user?.email || 'no email on file'} · {user?.mobile || 'no mobile on file'} · joined{' '}
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'unknown'}
          </p>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard
          label="Notifications you sent"
          statValue={activity?.notificationsSent ?? NO_FIGURE_YET}
          icon={BellRing}
          helperText="Published from this account"
        />
        <StatCard
          label="Replies you wrote"
          statValue={activity?.repliesWritten ?? NO_FIGURE_YET}
          icon={MessageSquare}
          helperText="Answers sent to passengers and drivers"
        />
        <StatCard
          label="Inquiries on your desk"
          statValue={activity?.assignedInquiryCount ?? NO_FIGURE_YET}
          icon={Inbox}
          helperText="Assigned to you and not yet closed"
        />
      </div>

      <section className="card page-section" aria-label="Your details">
        <h2 className="text-heading3">Your details</h2>
        <p className="text-caption text-muted">
          The name here is what passengers see on a reply you write, and what the team sees beside an
          inquiry you are handling.
        </p>
        <div className="form-grid">
          <FormField
            fieldId="profileFullName"
            label="Full name"
            fieldText={detailsForm.fullName}
            onFieldTextChange={(fieldText) => changeDetail('fullName', fieldText)}
            errorText={detailErrors.fullName}
          />
          <FormField
            fieldId="profileEmail"
            label="Email"
            fieldText={detailsForm.email}
            onFieldTextChange={(fieldText) => changeDetail('email', fieldText)}
            errorText={detailErrors.email}
            inputType="email"
            autoComplete="email"
            helperText="You sign in with this."
          />
          <FormField
            fieldId="profileMobile"
            label="Mobile"
            fieldText={detailsForm.mobile}
            onFieldTextChange={(fieldText) => changeDetail('mobile', fieldText)}
            errorText={detailErrors.mobile}
            autoComplete="tel"
            helperText="For example 0771234567."
          />
        </div>
        <div className="button-row">
          <Button label="Save details" isLoading={isSavingDetails} onClick={saveDetails} />
        </div>
      </section>

      <section className="card page-section" aria-label="Password">
        <h2 className="text-heading3">Password</h2>
        <p className="text-caption text-muted">
          Your current password is asked for every time, so a session left open on a shared computer
          cannot be used to lock you out of your own account.
        </p>
        <div className="form-grid">
          <FormField
            fieldId="profileCurrentPassword"
            label="Current password"
            fieldText={passwordForm.currentPassword}
            onFieldTextChange={(fieldText) => changePasswordField('currentPassword', fieldText)}
            errorText={passwordErrors.currentPassword}
            inputType="password"
            autoComplete="current-password"
          />
          <FormField
            fieldId="profileNewPassword"
            label="New password"
            fieldText={passwordForm.newPassword}
            onFieldTextChange={(fieldText) => changePasswordField('newPassword', fieldText)}
            errorText={passwordErrors.newPassword}
            inputType="password"
            autoComplete="new-password"
            helperText={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          />
          <FormField
            fieldId="profileConfirmPassword"
            label="New password again"
            fieldText={passwordForm.confirmPassword}
            onFieldTextChange={(fieldText) => changePasswordField('confirmPassword', fieldText)}
            errorText={passwordErrors.confirmPassword}
            inputType="password"
            autoComplete="new-password"
          />
        </div>
        <div className="button-row">
          <Button label="Change password" isLoading={isSavingPassword} onClick={savePassword} />
        </div>
      </section>
    </>
  );
}
