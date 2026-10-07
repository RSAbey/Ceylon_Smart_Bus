// Route form (Member 02): adding a route and editing one share this dialog, because the fields are
// the same and only the title, the delay warning and the Suspend action differ.
import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import RouteStopEditor, { buildEmptyStop } from './RouteStopEditor';
import {
  MIN_STOPS_PER_ROUTE,
  ROUTE_MESSAGES,
  ROUTE_STATUSES,
  SERVICE_TIME_PATTERN,
} from './routeConstants';

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

/**
 * Builds the starting form values, empty for a new route or filled from the one being edited.
 * @param {object | null} routeDetails - The route and its stops, or null to add one.
 * @returns {object} Form values.
 */
function buildInitialForm(routeDetails) {
  const editableRoute = routeDetails?.route;
  const editableStops = routeDetails?.stops || [];
  return {
    routeNumber: editableRoute?.routeNumber || '',
    routeName: editableRoute?.routeName || '',
    origin: editableRoute?.origin || '',
    destination: editableRoute?.destination || '',
    serviceStartTime: editableRoute?.serviceStartTime || '',
    serviceEndTime: editableRoute?.serviceEndTime || '',
    baseFare: editableRoute ? String(editableRoute.baseFare) : '',
    perKmRate: editableRoute?.perKmRate ? String(editableRoute.perKmRate) : '',
    status: editableRoute?.status || ROUTE_STATUSES.DRAFT,
    stops: editableStops.length
      ? editableStops.map((routeStop) => ({
          stopName: routeStop.stopName,
          latitude: String(routeStop.latitude),
          longitude: String(routeStop.longitude),
          fareFromOrigin: String(routeStop.fareFromOrigin),
        }))
      : [buildEmptyStop([]), buildEmptyStop([])],
  };
}

/**
 * Add / Edit Route dialog.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object | null} props.routeDetails - Route and stops being edited, or null for a new one.
 * @param {object | null} props.delaySummary - Recent delay figures for the warning strip.
 * @param {object} props.serverFieldErrors - Field errors returned by the API.
 * @param {boolean} props.isSaving - Shows the loading state on the save button.
 * @param {Function} props.onSubmit - Called with the form values.
 * @param {Function} props.onSuspend - Called when the admin suspends the route.
 * @param {Function} props.onClose - Called when the dialog is dismissed.
 * @returns {import('react').JSX.Element} The dialog.
 */
export default function RouteFormModal({
  isOpen,
  routeDetails,
  delaySummary,
  serverFieldErrors,
  isSaving,
  onSubmit,
  onSuspend,
  onClose,
}) {
  // The parent remounts this with a key, so the starting values are read once per open.
  const [routeForm, setRouteForm] = useState(() => buildInitialForm(routeDetails));
  const [localFieldErrors, setLocalFieldErrors] = useState({});

  /**
   * Updates one field without disturbing the others.
   * @param {string} fieldName - Which field changed.
   * @param {string} fieldText - Its new value.
   * @returns {void}
   */
  function changeField(fieldName, fieldText) {
    setRouteForm((previousForm) => ({ ...previousForm, [fieldName]: fieldText }));
  }

  /**
   * Checks the form the same way the server does, so a mistake is caught before a round trip.
   * @returns {boolean} True when the form can be sent.
   */
  function isFormValid() {
    const foundErrors = {};
    if (routeForm.routeNumber.trim().length === 0) {
      foundErrors.routeNumber = 'Enter the route number, for example 154.';
    }
    if (routeForm.routeName.trim().length === 0) foundErrors.routeName = 'Enter the route name.';
    if (routeForm.origin.trim().length === 0) foundErrors.origin = 'Enter the starting point.';
    if (routeForm.destination.trim().length === 0) {
      foundErrors.destination = 'Enter the destination.';
    }
    if (Number.isNaN(Number(routeForm.baseFare)) || routeForm.baseFare.trim().length === 0) {
      foundErrors.baseFare = 'Enter the base fare in rupees.';
    }
    if (routeForm.serviceStartTime && !SERVICE_TIME_PATTERN.test(routeForm.serviceStartTime)) {
      foundErrors.serviceStartTime = 'Enter the first departure as HH:MM.';
    }
    if (routeForm.serviceEndTime && !SERVICE_TIME_PATTERN.test(routeForm.serviceEndTime)) {
      foundErrors.serviceEndTime = 'Enter the last departure as HH:MM.';
    }

    const namedStops = routeForm.stops.filter((routeStop) => routeStop.stopName.trim().length > 0);
    if (namedStops.length < MIN_STOPS_PER_ROUTE) {
      foundErrors.stops = ROUTE_MESSAGES.tooFewStops;
    } else {
      const hasBadPosition = namedStops.some((routeStop) => {
        const stopLatitude = Number(routeStop.latitude);
        const stopLongitude = Number(routeStop.longitude);
        return (
          Number.isNaN(stopLatitude) ||
          Number.isNaN(stopLongitude) ||
          stopLatitude < MIN_LATITUDE ||
          stopLatitude > MAX_LATITUDE ||
          stopLongitude < MIN_LONGITUDE ||
          stopLongitude > MAX_LONGITUDE
        );
      });
      const hasBadFare = namedStops.some(
        (routeStop) => Number.isNaN(Number(routeStop.fareFromOrigin)) || Number(routeStop.fareFromOrigin) < 0
      );
      if (hasBadPosition) {
        foundErrors.stops = 'Every stop needs a valid latitude and longitude. Open Details on a stop to set them.';
      } else if (hasBadFare) {
        foundErrors.stops = 'Every stop needs a fare from the first stop, in rupees.';
      }
    }

    setLocalFieldErrors(foundErrors);
    return Object.keys(foundErrors).length === 0;
  }

  const submitForm = () => {
    if (!isFormValid()) return;
    onSubmit({
      routeNumber: routeForm.routeNumber.trim(),
      routeName: routeForm.routeName.trim(),
      origin: routeForm.origin.trim(),
      destination: routeForm.destination.trim(),
      serviceStartTime: routeForm.serviceStartTime || undefined,
      serviceEndTime: routeForm.serviceEndTime || undefined,
      baseFare: Number(routeForm.baseFare),
      perKmRate: routeForm.perKmRate ? Number(routeForm.perKmRate) : undefined,
      status: routeForm.status,
      stops: routeForm.stops
        .filter((routeStop) => routeStop.stopName.trim().length > 0)
        .map((routeStop) => ({
          stopName: routeStop.stopName.trim(),
          latitude: Number(routeStop.latitude),
          longitude: Number(routeStop.longitude),
          fareFromOrigin: Number(routeStop.fareFromOrigin),
        })),
    });
  };

  const fieldErrors = { ...localFieldErrors, ...serverFieldErrors };
  const isSuspended = routeForm.status === ROUTE_STATUSES.SUSPENDED;
  const hasRecentDelays = delaySummary?.delayReportCount > 0;

  return (
    <Modal
      isOpen={isOpen}
      title={routeDetails ? ROUTE_MESSAGES.editTitle : ROUTE_MESSAGES.addTitle}
      onClose={onClose}
      size="wide"
      footer={
        <>
          {routeDetails && !isSuspended && (
            <Button label={ROUTE_MESSAGES.suspend} variant="error" onClick={onSuspend} />
          )}
          <Button label="Cancel" variant="outline" onClick={onClose} />
          <Button
            label={routeDetails ? 'Save changes' : 'Save route'}
            isLoading={isSaving}
            onClick={submitForm}
          />
        </>
      }
    >
      <p className="text-caption text-muted">
        {routeDetails
          ? `Route ${routeDetails.route.routeNumber} · last updated ${new Date(routeDetails.route.updatedAt || routeDetails.route.createdAt).toLocaleDateString()}`
          : ROUTE_MESSAGES.addSubtitle}
      </p>

      <div className="form-grid">
        <FormField
          fieldId="routeNumber"
          label="Route number"
          fieldText={routeForm.routeNumber}
          onFieldTextChange={(fieldText) => changeField('routeNumber', fieldText)}
          errorText={fieldErrors.routeNumber}
          helperText="For example 412."
        />
        <FormField
          fieldId="routeName"
          label="Route name"
          fieldText={routeForm.routeName}
          onFieldTextChange={(fieldText) => changeField('routeName', fieldText)}
          errorText={fieldErrors.routeName}
          helperText="How staff refer to it, for example Kaduwela Express."
        />
        <div className="form-field">
          <label className="text-label" htmlFor="routeStatus">
            Status
          </label>
          <select
            id="routeStatus"
            className="form-field__input"
            value={routeForm.status}
            onChange={(changeEvent) => changeField('status', changeEvent.target.value)}
          >
            <option value={ROUTE_STATUSES.DRAFT}>Draft</option>
            <option value={ROUTE_STATUSES.ACTIVE}>Active</option>
            <option value={ROUTE_STATUSES.SUSPENDED}>Suspended</option>
          </select>
          <p className="text-caption text-muted">
            Passengers only see Active routes. Draft keeps it hidden while you finish it.
          </p>
        </div>
      </div>

      <div className="form-grid">
        <FormField
          fieldId="routeOrigin"
          label="Origin"
          fieldText={routeForm.origin}
          onFieldTextChange={(fieldText) => changeField('origin', fieldText)}
          errorText={fieldErrors.origin}
          helperText="For example Colombo Fort."
        />
        <FormField
          fieldId="routeDestination"
          label="Destination"
          fieldText={routeForm.destination}
          onFieldTextChange={(fieldText) => changeField('destination', fieldText)}
          errorText={fieldErrors.destination}
          helperText="For example Battaramulla."
        />
      </div>

      <div className="form-grid">
        <FormField
          fieldId="routeServiceStart"
          label="Service start"
          fieldText={routeForm.serviceStartTime}
          onFieldTextChange={(fieldText) => changeField('serviceStartTime', fieldText)}
          errorText={fieldErrors.serviceStartTime}
          helperText="First departure, as HH:MM."
          inputType="time"
        />
        <FormField
          fieldId="routeServiceEnd"
          label="Service end"
          fieldText={routeForm.serviceEndTime}
          onFieldTextChange={(fieldText) => changeField('serviceEndTime', fieldText)}
          errorText={fieldErrors.serviceEndTime}
          helperText="Last departure, as HH:MM."
          inputType="time"
        />
      </div>

      <div className="form-grid">
        <FormField
          fieldId="routeBaseFare"
          label="Base fare (Rs)"
          fieldText={routeForm.baseFare}
          onFieldTextChange={(fieldText) => changeField('baseFare', fieldText)}
          errorText={fieldErrors.baseFare}
          helperText="The minimum a passenger pays on this route."
        />
        <FormField
          fieldId="routePerKmRate"
          label="Per-km rate (Rs)"
          fieldText={routeForm.perKmRate}
          onFieldTextChange={(fieldText) => changeField('perKmRate', fieldText)}
          errorText={fieldErrors.perKmRate}
          helperText="Reference rate for repricing. Stop fares below stay authoritative."
        />
      </div>

      <RouteStopEditor
        stops={routeForm.stops}
        onChangeStops={(nextStops) => changeField('stops', nextStops)}
        errorText={fieldErrors.stops}
      />

      {hasRecentDelays && (
        <p className="form-notice form-notice--warning">
          {delaySummary.delayReportCount} delay{' '}
          {delaySummary.delayReportCount === 1 ? 'report' : 'reports'} on this route in the last{' '}
          {delaySummary.delayWindowDays} days (average {delaySummary.averageDelayMinutes} min).
          Consider revising the schedule above.
        </p>
      )}
    </Modal>
  );
}
