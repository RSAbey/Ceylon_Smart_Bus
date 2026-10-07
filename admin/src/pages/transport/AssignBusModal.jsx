// Assign Bus dialog (Member 01 / 02): gives a driver the bus they will drive.
// A bus carries one driver, so choosing a bus someone else holds moves it. The dialog says so
// before the admin confirms, rather than silently reassigning it.
import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { BUS_STATUSES } from './transportConstants';

/**
 * Assign Bus dialog.
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object | null} props.driverRow - The driver being assigned to.
 * @param {object[]} props.assignableBuses - Buses that can be given out.
 * @param {boolean} props.isSaving - Shows the loading state on the confirm button.
 * @param {Function} props.onSubmit - Called with the chosen bus id, or null to unassign.
 * @param {Function} props.onClose - Called when the dialog is dismissed.
 * @returns {import('react').JSX.Element} The dialog.
 */
export default function AssignBusModal({
  isOpen,
  driverRow,
  assignableBuses,
  isSaving,
  onSubmit,
  onClose,
}) {
  // The parent remounts this with a key, so the current bus is read once per open.
  const [chosenBusId, setChosenBusId] = useState(() => driverRow?.bus?.id || '');

  const driverProfile = driverRow?.driver;
  const chosenBus = assignableBuses.find((candidateBus) => candidateBus.id === chosenBusId);
  // Warn only when the bus belongs to somebody else, which is the case worth confirming.
  const isTakingFromAnotherDriver =
    chosenBus?.currentDriverName && chosenBus.id !== driverRow?.bus?.id;

  return (
    <Modal
      isOpen={isOpen}
      title="Assign bus"
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="outline" onClick={onClose} />
          <Button
            label={chosenBusId ? 'Assign bus' : 'Clear assignment'}
            isLoading={isSaving}
            onClick={() => onSubmit(chosenBusId || null)}
          />
        </>
      }
    >
      <p className="text-caption text-muted">
        {driverProfile?.userId?.fullName} · Licence {driverProfile?.licenseNumber} ·{' '}
        {driverRow?.bus ? `Currently on ${driverRow.bus.busCode}` : 'Currently unassigned'}
      </p>

      <fieldset className="assign-list">
        <legend className="text-label">Available buses</legend>

        <label className={`assign-option${chosenBusId === '' ? ' assign-option--chosen' : ''}`}>
          <input
            type="radio"
            name="assignedBus"
            value=""
            checked={chosenBusId === ''}
            onChange={() => setChosenBusId('')}
          />
          <span>
            <strong>No bus</strong>
            <span className="text-caption text-muted">
              Leave this driver unassigned. They cannot start a trip until a bus is given to them.
            </span>
          </span>
        </label>

        {assignableBuses.map((candidateBus) => {
          const isChosen = candidateBus.id === chosenBusId;
          const routeLine = candidateBus.route
            ? `Route ${candidateBus.route.routeNumber}`
            : 'Unassigned route';
          const holderLine = candidateBus.currentDriverName
            ? ` · held by ${candidateBus.currentDriverName}`
            : '';
          return (
            <label
              key={candidateBus.id}
              className={`assign-option${isChosen ? ' assign-option--chosen' : ''}`}
            >
              <input
                type="radio"
                name="assignedBus"
                value={candidateBus.id}
                checked={isChosen}
                onChange={() => setChosenBusId(candidateBus.id)}
              />
              <span>
                <strong>
                  {candidateBus.busCode} · {candidateBus.plateNumber}
                </strong>
                <span className="text-caption text-muted">
                  {routeLine} · {candidateBus.capacity} seats
                  {candidateBus.status === BUS_STATUSES.MAINTENANCE ? ' · in maintenance' : ''}
                  {holderLine}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {isTakingFromAnotherDriver && (
        <p className="form-notice form-notice--warning">
          {chosenBus.busCode} is currently assigned to {chosenBus.currentDriverName}. Assigning it
          here moves the bus, leaving them without one.
        </p>
      )}
    </Modal>
  );
}
