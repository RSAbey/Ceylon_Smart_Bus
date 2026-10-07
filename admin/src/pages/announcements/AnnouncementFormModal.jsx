// Announcement form (Member 04): used for both writing a new draft and editing an existing one.
import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';

const MAX_TITLE_LENGTH = 120;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 1000;

const SEVERITY_OPTIONS = Object.freeze([
  { severity: 'info', label: 'Info' },
  { severity: 'warning', label: 'Warning' },
  { severity: 'critical', label: 'Critical' },
]);

/**
 * Builds the starting form values, either empty or from the announcement being edited.
 * @param {object | null} announcementBeingEdited - The draft being changed, or null for a new one.
 * @returns {object} Form values.
 */
function buildInitialForm(announcementBeingEdited) {
  return {
    title: announcementBeingEdited?.title || '',
    message: announcementBeingEdited?.message || '',
    severity: announcementBeingEdited?.severity || 'info',
    targetRouteId: announcementBeingEdited?.targetRouteId?.id || '',
  };
}

/**
 * The announcement form dialog.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object | null} props.announcementBeingEdited - Draft being edited, or null for a new one.
 * @param {object[]} props.routeOptions - Routes that can be targeted.
 * @param {object} props.serverFieldErrors - Field errors returned by the API.
 * @param {boolean} props.isSaving - Shows the loading state on the save button.
 * @param {Function} props.onSubmit - Called with the form values.
 * @param {Function} props.onClose - Called when the dialog is dismissed.
 * @returns {import('react').JSX.Element} The dialog.
 */
export default function AnnouncementFormModal({
  isOpen,
  announcementBeingEdited,
  routeOptions,
  serverFieldErrors,
  isSaving,
  onSubmit,
  onClose,
}) {
  // The parent remounts this with a key, so the starting values are read once per open.
  const [announcementForm, setAnnouncementForm] = useState(() =>
    buildInitialForm(announcementBeingEdited)
  );
  const [localFieldErrors, setLocalFieldErrors] = useState({});

  /**
   * Updates one field without disturbing the others.
   * @param {string} fieldName - Which field changed.
   * @param {string} fieldText - Its new text.
   * @returns {void}
   */
  function changeField(fieldName, fieldText) {
    setAnnouncementForm((previousForm) => ({ ...previousForm, [fieldName]: fieldText }));
  }

  /**
   * Checks the form the same way the server does, so a mistake is caught before a round trip.
   * @returns {boolean} True when the form can be sent.
   */
  function isFormValid() {
    const foundErrors = {};
    if (announcementForm.title.trim().length === 0) foundErrors.title = 'Enter a title.';
    if (announcementForm.title.trim().length > MAX_TITLE_LENGTH) {
      foundErrors.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`;
    }
    const trimmedMessage = announcementForm.message.trim();
    if (trimmedMessage.length < MIN_MESSAGE_LENGTH || trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      foundErrors.message = `Write between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters.`;
    }
    setLocalFieldErrors(foundErrors);
    return Object.keys(foundErrors).length === 0;
  }

  const submitForm = () => {
    if (!isFormValid()) return;
    onSubmit({
      title: announcementForm.title.trim(),
      message: announcementForm.message.trim(),
      severity: announcementForm.severity,
      targetRouteId: announcementForm.targetRouteId || undefined,
    });
  };

  const fieldErrors = { ...localFieldErrors, ...serverFieldErrors };

  return (
    <Modal
      isOpen={isOpen}
      title={announcementBeingEdited ? 'Edit draft' : 'Write announcement'}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="outline" onClick={onClose} />
          <Button label="Save draft" isLoading={isSaving} onClick={submitForm} />
        </>
      }
    >
      <FormField
        fieldId="announcementTitle"
        label="Title"
        fieldText={announcementForm.title}
        onFieldTextChange={(fieldText) => changeField('title', fieldText)}
        errorText={fieldErrors.title}
        helperText="Shown in bold in the passenger's alert list."
      />
      <FormField
        fieldId="announcementMessage"
        label="Message"
        fieldText={announcementForm.message}
        onFieldTextChange={(fieldText) => changeField('message', fieldText)}
        errorText={fieldErrors.message}
        helperText={`${announcementForm.message.trim().length} of ${MAX_MESSAGE_LENGTH} characters.`}
      />

      <div className="form-field">
        <label className="text-label" htmlFor="announcementSeverity">
          Severity
        </label>
        <select
          id="announcementSeverity"
          className="form-field__input"
          value={announcementForm.severity}
          onChange={(changeEvent) => changeField('severity', changeEvent.target.value)}
        >
          {SEVERITY_OPTIONS.map((severityOption) => (
            <option key={severityOption.severity} value={severityOption.severity}>
              {severityOption.label}
            </option>
          ))}
        </select>
        <p className="text-caption text-muted">
          Critical is for disruption that stops people travelling.
        </p>
      </div>

      <div className="form-field">
        <label className="text-label" htmlFor="announcementRoute">
          Who gets it
        </label>
        <select
          id="announcementRoute"
          className="form-field__input"
          value={announcementForm.targetRouteId}
          onChange={(changeEvent) => changeField('targetRouteId', changeEvent.target.value)}
        >
          <option value="">All passengers</option>
          {routeOptions.map((routeOption) => (
            <option key={routeOption.id} value={routeOption.id}>
              Route {routeOption.routeNumber} ({routeOption.origin} to {routeOption.destination})
            </option>
          ))}
        </select>
        <p className="text-caption text-muted">
          A route sends it only to passengers who saved or follow that route.
        </p>
      </div>
    </Modal>
  );
}
