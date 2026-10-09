// Driver form (Member 01): registering a driver account and editing one share this dialog.
// Drivers never self-register, so this is the only way a driver account comes into existence.
import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { DRIVER_DUTY_STATUSES, LICENSE_CLASSES } from './transportConstants';

const NIC_PATTERN = /^(\d{12}|\d{9}[VvXx])$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Builds the starting form values, empty for a new driver or filled from the one being edited.
 * @param {object | null} driverBeingEdited - The driver row to edit, or null to register one.
 * @returns {object} Form values.
 */
function buildInitialForm(driverBeingEdited) {
  const driverProfile = driverBeingEdited?.driver;
  return {
    fullName: driverProfile?.userId?.fullName || '',
    email: driverProfile?.userId?.email || '',
    mobile: driverProfile?.userId?.mobile || '',
    password: '',
    licenseNumber: driverProfile?.licenseNumber || '',
    nic: driverProfile?.nic || '',
    licenseClass: driverProfile?.licenseClass || LICENSE_CLASSES[0].licenseClass,
    dutyStatus: driverProfile?.dutyStatus || DRIVER_DUTY_STATUSES.ACTIVE,
  };
}

/**
 * Register / Edit Driver dialog.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object | null} props.driverBeingEdited - Driver row being edited, or null for a new one.
 * @param {object} props.serverFieldErrors - Field errors returned by the API.
 * @param {boolean} props.isSaving - Shows the loading state on the save button.
 * @param {Function} props.onSubmit - Called with the form values.
 * @param {Function} props.onSuspend - Called when the admin suspends the driver.
 * @param {Function} props.onClose - Called when the dialog is dismissed.
 * @returns {import('react').JSX.Element} The dialog.
 */
export default function DriverFormModal({
  isOpen,
  driverBeingEdited,
  serverFieldErrors,
  isSaving,
  onSubmit,
  onSuspend,
  onClose,
}) {
  // The parent remounts this with a key, so the starting values are read once per open.
  const [driverForm, setDriverForm] = useState(() => buildInitialForm(driverBeingEdited));
  const [localFieldErrors, setLocalFieldErrors] = useState({});

  /**
   * Updates one field without disturbing the others.
   * @param {string} fieldName - Which field changed.
   * @param {string} fieldText - Its new value.
   * @returns {void}
   */
  function changeField(fieldName, fieldText) {
    setDriverForm((previousForm) => ({ ...previousForm, [fieldName]: fieldText }));
  }

  /**
   * Checks the form the same way the server does, so a mistake is caught before a round trip.
   * @returns {boolean} True when the form can be sent.
   */
  function isFormValid() {
    const foundErrors = {};
    if (driverForm.fullName.trim().length === 0) {
      foundErrors.fullName = "Enter the driver's full name.";
    }
    if (driverForm.licenseNumber.trim().length === 0) {
      foundErrors.licenseNumber = 'Enter the driving licence number.';
    }
    if (!driverBeingEdited) {
      if (!NIC_PATTERN.test(driverForm.nic.trim())) {
        foundErrors.nic = 'Enter a valid NIC, for example 199007158812.';
      }
      if (driverForm.email.trim().length === 0 && driverForm.mobile.trim().length === 0) {
        foundErrors.email = 'Enter an email or a mobile number so the driver can sign in.';
      }
      if (driverForm.password.length < MIN_PASSWORD_LENGTH) {
        foundErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
      }
    }
    setLocalFieldErrors(foundErrors);
    return Object.keys(foundErrors).length === 0;
  }

  const submitForm = () => {
    if (!isFormValid()) return;
    if (driverBeingEdited) {
      onSubmit({
        fullName: driverForm.fullName.trim(),
        email: driverForm.email.trim() || undefined,
        mobile: driverForm.mobile.trim() || undefined,
        licenseNumber: driverForm.licenseNumber.trim(),
        nic: driverForm.nic.trim(),
        licenseClass: driverForm.licenseClass,
        dutyStatus: driverForm.dutyStatus,
      });
      return;
    }
    onSubmit({
      fullName: driverForm.fullName.trim(),
      email: driverForm.email.trim() || undefined,
      mobile: driverForm.mobile.trim() || undefined,
      password: driverForm.password,
      licenseNumber: driverForm.licenseNumber.trim(),
      nic: driverForm.nic.trim(),
      licenseClass: driverForm.licenseClass,
    });
  };

  const fieldErrors = { ...localFieldErrors, ...serverFieldErrors };
  const isSuspended = driverForm.dutyStatus === DRIVER_DUTY_STATUSES.SUSPENDED;

  return (
    <Modal
      isOpen={isOpen}
      title={driverBeingEdited ? 'Edit driver details' : 'Register driver'}
      onClose={onClose}
      size="wide"
      footer={
        <>
          {driverBeingEdited && !isSuspended && (
            <Button label="Suspend driver" variant="error" onClick={onSuspend} />
          )}
          <Button label="Cancel" variant="outline" onClick={onClose} />
          <Button
            label={driverBeingEdited ? 'Save changes' : 'Register driver'}
            isLoading={isSaving}
            onClick={submitForm}
          />
        </>
      }
    >
      {driverBeingEdited && (
        <p className="text-caption text-muted">
          {driverBeingEdited.bus
            ? `${driverBeingEdited.bus.busCode} · ${driverBeingEdited.delayReportCount} delay reports`
            : `No bus assigned · ${driverBeingEdited.delayReportCount} delay reports`}
        </p>
      )}

      <FormField
        fieldId="driverFullName"
        label="Full name"
        fieldText={driverForm.fullName}
        onFieldTextChange={(fieldText) => changeField('fullName', fieldText)}
        errorText={fieldErrors.fullName}
      />
      <FormField
        fieldId="driverMobile"
        label="Phone number"
        fieldText={driverForm.mobile}
        onFieldTextChange={(fieldText) => changeField('mobile', fieldText)}
        errorText={fieldErrors.mobile}
        helperText="For example 071 445 2210."
      />
      <FormField
        fieldId="driverEmail"
        label="Email address"
        fieldText={driverForm.email}
        onFieldTextChange={(fieldText) => changeField('email', fieldText)}
        errorText={fieldErrors.email}
        inputType="email"
      />
      <FormField
        fieldId="driverLicenseNumber"
        label="Driving licence number"
        fieldText={driverForm.licenseNumber}
        onFieldTextChange={(fieldText) => changeField('licenseNumber', fieldText)}
        errorText={fieldErrors.licenseNumber}
      />
      <FormField
        fieldId="driverNic"
        label="NIC"
        fieldText={driverForm.nic}
        onFieldTextChange={(fieldText) => changeField('nic', fieldText)}
        errorText={fieldErrors.nic}
        isDisabled={Boolean(driverBeingEdited)}
        helperText={
          driverBeingEdited
            ? 'The NIC identifies the driver and cannot be changed here.'
            : 'For example 199007158812.'
        }
      />

      <div className="form-field">
        <label className="text-label" htmlFor="driverLicenseClass">
          Licence class
        </label>
        <select
          id="driverLicenseClass"
          className="form-field__input"
          value={driverForm.licenseClass}
          onChange={(changeEvent) => changeField('licenseClass', changeEvent.target.value)}
        >
          {LICENSE_CLASSES.map((licenseOption) => (
            <option key={licenseOption.licenseClass} value={licenseOption.licenseClass}>
              {licenseOption.label}
            </option>
          ))}
        </select>
      </div>

      {driverBeingEdited && (
        <div className="form-field">
          <label className="text-label" htmlFor="driverDutyStatus">
            Duty status
          </label>
          <select
            id="driverDutyStatus"
            className="form-field__input"
            value={driverForm.dutyStatus}
            onChange={(changeEvent) => changeField('dutyStatus', changeEvent.target.value)}
          >
            <option value={DRIVER_DUTY_STATUSES.ACTIVE}>Active</option>
            <option value={DRIVER_DUTY_STATUSES.ON_LEAVE}>On leave</option>
            <option value={DRIVER_DUTY_STATUSES.SUSPENDED}>Suspended</option>
          </select>
          <p className="text-caption text-muted">
            On leave keeps their sign-in working. Suspended blocks the account as well.
          </p>
        </div>
      )}

      {!driverBeingEdited && (
        <>
          <FormField
            fieldId="driverPassword"
            label="Temporary password"
            fieldText={driverForm.password}
            onFieldTextChange={(fieldText) => changeField('password', fieldText)}
            errorText={fieldErrors.password}
            inputType="password"
            helperText={`At least ${MIN_PASSWORD_LENGTH} characters. Give it to the driver so they can sign in to the driver app.`}
          />
          <p className="form-notice">
            The driver signs in to the mobile app with this password and the email or mobile above.
          </p>
        </>
      )}
    </Modal>
  );
}
