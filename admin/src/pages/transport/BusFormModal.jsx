// Bus form (Member 02): registering a new vehicle and editing an existing one share this dialog,
// because the fields are the same and only the title and the extra Retire action differ.
import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { BUS_MODELS, BUS_STATUSES } from './transportConstants';

const MIN_CAPACITY = 1;
const MAX_CAPACITY = 100;
/** Sri Lankan plates such as NB-1234 or WP CAB-4021. */
const PLATE_NUMBER_PATTERN = /^[A-Za-z]{2,3}-?\d{4}$/;

/**
 * Turns a stored date into the yyyy-mm-dd a date input needs.
 * @param {string} [storedDate] - ISO date from the API.
 * @returns {string} Date for the input, or an empty string.
 */
function toDateInputValue(storedDate) {
  return storedDate ? new Date(storedDate).toISOString().slice(0, 10) : '';
}

/**
 * Builds the starting form values, empty for a new bus or filled from the one being edited.
 * @param {object | null} busBeingEdited - The bus to edit, or null to register one.
 * @returns {object} Form values.
 */
function buildInitialForm(busBeingEdited) {
  return {
    plateNumber: busBeingEdited?.plateNumber || '',
    busName: busBeingEdited?.busName || '',
    model: busBeingEdited?.model || '',
    capacity: busBeingEdited ? String(busBeingEdited.capacity) : '',
    status: busBeingEdited?.status || BUS_STATUSES.ACTIVE,
    gpsDeviceId: busBeingEdited?.gpsDeviceId || '',
    lastServicedAt: toDateInputValue(busBeingEdited?.lastServicedAt),
    routeId: busBeingEdited?.routeId?.id || '',
  };
}

/**
 * Register / Edit Bus dialog.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object | null} props.busBeingEdited - Bus being edited, or null for a new one.
 * @param {object[]} props.routeOptions - Routes the bus can be assigned to.
 * @param {object} props.serverFieldErrors - Field errors returned by the API.
 * @param {boolean} props.isSaving - Shows the loading state on the save button.
 * @param {boolean} props.isBroadcasting - Whether this bus is posting live positions right now.
 * @param {Function} props.onSubmit - Called with the form values.
 * @param {Function} props.onRetire - Called when the admin retires the bus.
 * @param {Function} props.onClose - Called when the dialog is dismissed.
 * @returns {import('react').JSX.Element} The dialog.
 */
export default function BusFormModal({
  isOpen,
  busBeingEdited,
  routeOptions,
  serverFieldErrors,
  isSaving,
  isBroadcasting,
  onSubmit,
  onRetire,
  onClose,
}) {
  // The parent remounts this with a key, so the starting values are read once per open.
  const [busForm, setBusForm] = useState(() => buildInitialForm(busBeingEdited));
  const [localFieldErrors, setLocalFieldErrors] = useState({});

  /**
   * Updates one field without disturbing the others.
   * @param {string} fieldName - Which field changed.
   * @param {string} fieldText - Its new value.
   * @returns {void}
   */
  function changeField(fieldName, fieldText) {
    setBusForm((previousForm) => ({ ...previousForm, [fieldName]: fieldText }));
  }

  /**
   * Checks the form the same way the server does, so a mistake is caught before a round trip.
   * @returns {boolean} True when the form can be sent.
   */
  function isFormValid() {
    const foundErrors = {};
    if (!PLATE_NUMBER_PATTERN.test(busForm.plateNumber.trim().replace(/\s/g, ''))) {
      foundErrors.plateNumber = 'Enter a plate number such as NB-1234.';
    }
    if (busForm.busName.trim().length === 0) foundErrors.busName = 'Enter a name for the bus.';
    const seatCount = Number(busForm.capacity);
    if (!Number.isInteger(seatCount) || seatCount < MIN_CAPACITY || seatCount > MAX_CAPACITY) {
      foundErrors.capacity = `Capacity must be between ${MIN_CAPACITY} and ${MAX_CAPACITY} seats.`;
    }
    setLocalFieldErrors(foundErrors);
    return Object.keys(foundErrors).length === 0;
  }

  const submitForm = () => {
    if (!isFormValid()) return;
    onSubmit({
      plateNumber: busForm.plateNumber.trim().replace(/\s/g, ''),
      busName: busForm.busName.trim(),
      model: busForm.model || undefined,
      capacity: Number(busForm.capacity),
      status: busForm.status,
      gpsDeviceId: busForm.gpsDeviceId.trim() || undefined,
      lastServicedAt: busForm.lastServicedAt || undefined,
      routeId: busForm.routeId || null,
    });
  };

  const fieldErrors = { ...localFieldErrors, ...serverFieldErrors };
  const isRetired = busForm.status === BUS_STATUSES.RETIRED;

  return (
    <Modal
      isOpen={isOpen}
      title={busBeingEdited ? 'Edit bus details' : 'Register bus'}
      onClose={onClose}
      size="wide"
      footer={
        <>
          {busBeingEdited && !isRetired && (
            <Button label="Retire bus" variant="error" onClick={onRetire} />
          )}
          <Button label="Cancel" variant="outline" onClick={onClose} />
          <Button
            label={busBeingEdited ? 'Save changes' : 'Register bus'}
            isLoading={isSaving}
            onClick={submitForm}
          />
        </>
      }
    >
      {busBeingEdited && (
        <p className="text-caption text-muted">
          {busBeingEdited.busCode}
          {busBeingEdited.lastServicedAt
            ? ` · last serviced ${new Date(busBeingEdited.lastServicedAt).toLocaleDateString()}`
            : ' · no service recorded'}
        </p>
      )}

      <div className="form-grid">
        <FormField
          fieldId="busPlateNumber"
          label="Plate number"
          fieldText={busForm.plateNumber}
          onFieldTextChange={(fieldText) => changeField('plateNumber', fieldText)}
          errorText={fieldErrors.plateNumber}
          helperText="For example NB-1234."
        />
        <FormField
          fieldId="busName"
          label="Bus name"
          fieldText={busForm.busName}
          onFieldTextChange={(fieldText) => changeField('busName', fieldText)}
          errorText={fieldErrors.busName}
          helperText="The name staff and passengers know it by."
        />
      </div>

      <div className="form-field">
        <label className="text-label" htmlFor="busModel">
          Model
        </label>
        <select
          id="busModel"
          className="form-field__input"
          value={busForm.model}
          onChange={(changeEvent) => changeField('model', changeEvent.target.value)}
        >
          <option value="">Select model</option>
          {BUS_MODELS.map((busModel) => (
            <option key={busModel} value={busModel}>
              {busModel}
            </option>
          ))}
        </select>
      </div>

      <FormField
        fieldId="busCapacity"
        label="Seating capacity"
        fieldText={busForm.capacity}
        onFieldTextChange={(fieldText) => changeField('capacity', fieldText.replace(/\D/g, ''))}
        errorText={fieldErrors.capacity}
        helperText="Used to draw the seat map passengers book from."
        inputType="text"
      />

      <div className="form-field">
        <label className="text-label" htmlFor="busRoute">
          Assigned route
        </label>
        <select
          id="busRoute"
          className="form-field__input"
          value={busForm.routeId}
          onChange={(changeEvent) => changeField('routeId', changeEvent.target.value)}
        >
          <option value="">Unassigned</option>
          {routeOptions.map((routeOption) => (
            <option key={routeOption.id} value={routeOption.id}>
              Route {routeOption.routeNumber} ({routeOption.origin} to {routeOption.destination})
            </option>
          ))}
        </select>
        <p className="text-caption text-muted">
          A bus needs a route before its driver can start a trip.
        </p>
      </div>

      <div className="form-field">
        <label className="text-label" htmlFor="busStatus">
          Status
        </label>
        <select
          id="busStatus"
          className="form-field__input"
          value={busForm.status}
          onChange={(changeEvent) => changeField('status', changeEvent.target.value)}
        >
          <option value={BUS_STATUSES.ACTIVE}>Active</option>
          <option value={BUS_STATUSES.MAINTENANCE}>In maintenance</option>
          <option value={BUS_STATUSES.RETIRED}>Retired</option>
        </select>
      </div>

      <FormField
        fieldId="busGpsDeviceId"
        label="GPS device id"
        fieldText={busForm.gpsDeviceId}
        onFieldTextChange={(fieldText) => changeField('gpsDeviceId', fieldText)}
        errorText={fieldErrors.gpsDeviceId}
        helperText="For example GPS-CSB-0014, so a faulty tracker can be traced to a vehicle."
      />
      <FormField
        fieldId="busLastServicedAt"
        label="Last serviced"
        fieldText={busForm.lastServicedAt}
        onFieldTextChange={(fieldText) => changeField('lastServicedAt', fieldText)}
        errorText={fieldErrors.lastServicedAt}
        inputType="date"
      />

      {isBroadcasting && (
        <p className="form-notice form-notice--live">
          Broadcasting live position right now. Changing the status to Maintenance or Retired stops
          that feed and takes the bus off the passenger map.
        </p>
      )}
      {!busBeingEdited && (
        <p className="form-notice">
          This bus appears on Live Fleet once it is Active with a route assigned.
        </p>
      )}
    </Modal>
  );
}
