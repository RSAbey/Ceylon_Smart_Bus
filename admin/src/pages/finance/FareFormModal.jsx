// Fare dialog (Member 03): reprices one route from the finance page. The reference fares on the
// route and a percentage revision across every stop fare are edited together, because that is how a
// fare increase is actually announced: "all fares on route 154 rise by 10%".
import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import {
  FINANCE_MESSAGES,
  MAX_FARE_ADJUST_PERCENT,
  MIN_FARE_ADJUST_PERCENT,
  formatCurrency,
} from './financeConstants';

const PERCENT_SCALE = 100;

/**
 * Builds the starting values from the route being repriced.
 * @param {object | null} fareRow - Route row from the finance summary.
 * @returns {object} Form values.
 */
function buildInitialForm(fareRow) {
  return {
    baseFare: fareRow ? String(fareRow.baseFare) : '',
    perKmRate: fareRow?.perKmRate ? String(fareRow.perKmRate) : '',
    adjustPercent: '',
  };
}

/**
 * Adjust fares dialog.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object | null} props.fareRow - The route being repriced.
 * @param {object} props.serverFieldErrors - Field errors returned by the API.
 * @param {boolean} props.isSaving - Shows the loading state on the save button.
 * @param {Function} props.onSubmit - Called with the fare changes.
 * @param {Function} props.onClose - Called when the dialog is dismissed.
 * @returns {import('react').JSX.Element} The dialog.
 */
export default function FareFormModal({
  isOpen,
  fareRow,
  serverFieldErrors,
  isSaving,
  onSubmit,
  onClose,
}) {
  // The parent remounts this with a key, so the starting values are read once per open.
  const [fareForm, setFareForm] = useState(() => buildInitialForm(fareRow));
  const [localFieldErrors, setLocalFieldErrors] = useState({});

  /**
   * Updates one field without disturbing the others.
   * @param {string} fieldName - Which field changed.
   * @param {string} fieldText - Its new value.
   * @returns {void}
   */
  function changeField(fieldName, fieldText) {
    setFareForm((previousForm) => ({ ...previousForm, [fieldName]: fieldText }));
  }

  /**
   * Checks the form the same way the server does, so a mistake is caught before a round trip.
   * @returns {boolean} True when the form can be sent.
   */
  function isFormValid() {
    const foundErrors = {};
    const baseFareAmount = Number(fareForm.baseFare);
    if (fareForm.baseFare.trim().length === 0 || Number.isNaN(baseFareAmount) || baseFareAmount < 0) {
      foundErrors.baseFare = 'Enter the base fare in rupees.';
    }
    if (fareForm.perKmRate.trim().length > 0 && Number.isNaN(Number(fareForm.perKmRate))) {
      foundErrors.perKmRate = 'Enter the per-kilometre rate in rupees.';
    }
    if (fareForm.adjustPercent.trim().length > 0) {
      const revisionPercent = Number(fareForm.adjustPercent);
      if (
        Number.isNaN(revisionPercent) ||
        revisionPercent < MIN_FARE_ADJUST_PERCENT ||
        revisionPercent > MAX_FARE_ADJUST_PERCENT
      ) {
        foundErrors.adjustPercent = `A revision must be between ${MIN_FARE_ADJUST_PERCENT}% and ${MAX_FARE_ADJUST_PERCENT}%.`;
      }
    }
    setLocalFieldErrors(foundErrors);
    return Object.keys(foundErrors).length === 0;
  }

  const submitForm = () => {
    if (!isFormValid()) return;
    onSubmit({
      baseFare: Number(fareForm.baseFare),
      perKmRate: fareForm.perKmRate.trim() ? Number(fareForm.perKmRate) : undefined,
      adjustPercent: fareForm.adjustPercent.trim() ? Number(fareForm.adjustPercent) : undefined,
    });
  };

  const fieldErrors = { ...localFieldErrors, ...serverFieldErrors };
  const revisionPercent = Number(fareForm.adjustPercent);
  const hasRevision = fareForm.adjustPercent.trim().length > 0 && !Number.isNaN(revisionPercent);
  const revisedFullRouteFare =
    hasRevision && fareRow?.fullRouteFare !== null
      ? Math.round(fareRow.fullRouteFare * (1 + revisionPercent / PERCENT_SCALE))
      : null;

  return (
    <Modal
      isOpen={isOpen}
      title={`${FINANCE_MESSAGES.adjustTitle} · route ${fareRow?.routeNumber || ''}`}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="outline" onClick={onClose} />
          <Button label="Save fares" isLoading={isSaving} onClick={submitForm} />
        </>
      }
    >
      <p className="text-caption text-muted">
        {fareRow?.origin} &rarr; {fareRow?.destination} · {fareRow?.stopCount} stops · end to end{' '}
        {fareRow?.fullRouteFare === null ? 'not priced' : formatCurrency(fareRow?.fullRouteFare)}
      </p>

      <FormField
        fieldId="fareBaseFare"
        label="Base fare (Rs)"
        fieldText={fareForm.baseFare}
        onFieldTextChange={(fieldText) => changeField('baseFare', fieldText)}
        errorText={fieldErrors.baseFare}
        helperText="The minimum a passenger pays on this route."
      />
      <FormField
        fieldId="farePerKmRate"
        label="Per-km rate (Rs)"
        fieldText={fareForm.perKmRate}
        onFieldTextChange={(fieldText) => changeField('perKmRate', fieldText)}
        errorText={fieldErrors.perKmRate}
        helperText="Reference rate used when planning a revision."
      />
      <FormField
        fieldId="fareAdjustPercent"
        label="Revise every stop fare by (%)"
        fieldText={fareForm.adjustPercent}
        onFieldTextChange={(fieldText) => changeField('adjustPercent', fieldText)}
        errorText={fieldErrors.adjustPercent}
        helperText={`Leave empty to change only the reference fares above. For example 10 raises every fare on this route by a tenth, −5 cuts them by a twentieth.`}
      />

      {revisedFullRouteFare !== null && (
        <p className="form-notice">
          The end-to-end fare becomes {formatCurrency(revisedFullRouteFare)}, from{' '}
          {formatCurrency(fareRow.fullRouteFare)}. Every stop fare along the route is revised by the
          same percentage and rounded to the rupee.
        </p>
      )}

      <p className="form-notice form-notice--warning">
        Stop fares are what passengers are charged, so this changes the price of every journey on
        route {fareRow?.routeNumber} from now on. Tickets already sold keep the fare they were bought
        at.
      </p>
    </Modal>
  );
}
