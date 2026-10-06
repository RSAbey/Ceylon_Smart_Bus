// Create / edit driver form shown in a modal (Member 01).
// The parent remounts this with a key on each open, so the form starts from the right values without an effect.
import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { MIN_PASSWORD_LENGTH, validateDriverForm } from './driverValidation';

/**
 * Builds the starting form values: blank when registering, pre-filled when editing.
 * @param {object | null} driverBeingEdited - Driver row, or null when registering a new one.
 * @returns {object} Form values.
 */
function buildInitialForm(driverBeingEdited) {
  return {
    fullName: driverBeingEdited?.userId?.fullName || '',
    email: driverBeingEdited?.userId?.email || '',
    mobile: driverBeingEdited?.userId?.mobile || '',
    password: '',
    licenseNumber: driverBeingEdited?.licenseNumber || '',
    nic: driverBeingEdited?.nic || '',
  };
}

/**
 * Modal form for registering a driver or editing an existing one.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the modal is shown.
 * @param {object | null} props.driverBeingEdited - Driver to edit, or null to register a new one.
 * @param {Object<string, string>} props.serverFieldErrors - Field errors returned by the API.
 * @param {boolean} props.isSaving - Shows the loading state on Save.
 * @param {Function} props.onSubmit - Called with the validated form values.
 * @param {Function} props.onClose - Closes the modal.
 * @returns {import('react').JSX.Element} The modal.
 */
export default function DriverFormModal({
  isOpen,
  driverBeingEdited,
  serverFieldErrors,
  isSaving,
  onSubmit,
  onClose,
}) {
  const isEditing = Boolean(driverBeingEdited);
  const [driverForm, setDriverForm] = useState(() => buildInitialForm(driverBeingEdited));
  const [fieldErrors, setFieldErrors] = useState({});

  const editField = (fieldName, typedText) =>
    setDriverForm((previousForm) => ({ ...previousForm, [fieldName]: typedText }));

  const submitForm = (submitEvent) => {
    submitEvent.preventDefault();
    const formErrors = validateDriverForm(driverForm, isEditing);
    setFieldErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;
    onSubmit(driverForm);
  };

  const errorFor = (fieldName) => fieldErrors[fieldName] || serverFieldErrors[fieldName];

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Edit driver' : 'Register driver'}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="outline" onClick={onClose} isDisabled={isSaving} />
          <Button
            label={isEditing ? 'Save changes' : 'Register driver'}
            onClick={submitForm}
            isLoading={isSaving}
          />
        </>
      }
    >
      <form onSubmit={submitForm} noValidate>
        <FormField
          fieldId="driver-full-name"
          label="Full name"
          fieldText={driverForm.fullName}
          onFieldTextChange={(typedText) => editField('fullName', typedText)}
          errorText={errorFor('fullName')}
          placeholder="Sunil Perera"
        />
        <FormField
          fieldId="driver-email"
          label="Email address"
          inputType="email"
          fieldText={driverForm.email}
          onFieldTextChange={(typedText) => editField('email', typedText)}
          errorText={errorFor('email')}
          helperText={isEditing ? 'Email cannot be changed after registration.' : undefined}
          placeholder="sunil.driver@ceylonsmartbus.lk"
          isDisabled={isEditing}
        />
        <FormField
          fieldId="driver-mobile"
          label="Mobile number"
          inputType="tel"
          fieldText={driverForm.mobile}
          onFieldTextChange={(typedText) => editField('mobile', typedText)}
          errorText={errorFor('mobile')}
          helperText={isEditing ? 'Mobile number cannot be changed after registration.' : undefined}
          placeholder="0771234567"
          isDisabled={isEditing}
        />
        {!isEditing && (
          <FormField
            fieldId="driver-password"
            label="Initial password"
            fieldText={driverForm.password}
            onFieldTextChange={(typedText) => editField('password', typedText)}
            errorText={errorFor('password')}
            helperText={`At least ${MIN_PASSWORD_LENGTH} characters. Give this to the driver to sign in with.`}
            placeholder="Driver@2026"
          />
        )}
        <FormField
          fieldId="driver-license"
          label="Driving licence number"
          fieldText={driverForm.licenseNumber}
          onFieldTextChange={(typedText) => editField('licenseNumber', typedText)}
          errorText={errorFor('licenseNumber')}
          placeholder="B4521873"
        />
        <FormField
          fieldId="driver-nic"
          label="NIC"
          fieldText={driverForm.nic}
          onFieldTextChange={(typedText) => editField('nic', typedText)}
          errorText={errorFor('nic')}
          helperText="Old format 901234567V, or the newer 12-digit number."
          placeholder="199007158812"
        />
      </form>
    </Modal>
  );
}
