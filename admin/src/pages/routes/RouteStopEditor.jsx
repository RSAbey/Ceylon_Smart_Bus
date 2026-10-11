// The stop list inside the route dialog (Member 02).
//
// A stop is a place and a fare, nothing else. The place is searched for by name and chosen from a
// list, the way a map app does it, and that choice is what gives the stop its position — latitude
// and longitude are never shown or typed. Asking for coordinates is what produced routes whose
// stops all sat on the same default point, with no line to draw.
import { MapPin, Plus, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { ROUTE_MESSAGES } from './routeConstants';
import StopPlaceSearch from './StopPlaceSearch';

/**
 * Builds an empty stop. It deliberately has no position: one arrives only by choosing a place from
 * the list, so a stop can never quietly keep a default that belongs somewhere else.
 * @returns {object} A new stop row.
 */
export function buildEmptyStop() {
  return { stopName: '', latitude: '', longitude: '', placeDescription: '', fareFromOrigin: '0' };
}

/**
 * Whether a stop has been given a real position by choosing a place.
 * @param {object} routeStop - A stop row.
 * @returns {boolean} True when it can be saved and drawn.
 */
export function hasChosenPlace(routeStop) {
  return Number.isFinite(Number(routeStop.latitude)) && String(routeStop.latitude).trim() !== '';
}

/**
 * The ordered stop editor.
 * @param {object} props - Component props.
 * @param {object[]} props.stops - Current stop rows.
 * @param {Function} props.onChangeStops - Called with the whole updated stop list.
 * @param {string} [props.errorText] - Error shown under the list.
 * @returns {import('react').JSX.Element} The editor.
 */
export default function RouteStopEditor({ stops, onChangeStops, errorText }) {
  /**
   * Changes one field on one stop without disturbing the others.
   * @param {number} stopIndex - Row being edited.
   * @param {string} fieldName - Which field changed.
   * @param {string} fieldText - Its new value.
   * @returns {void}
   */
  function changeStopField(stopIndex, fieldName, fieldText) {
    onChangeStops(
      stops.map((candidateStop, candidateIndex) =>
        candidateIndex === stopIndex ? { ...candidateStop, [fieldName]: fieldText } : candidateStop
      )
    );
  }

  /**
   * Takes the place chosen from the list: its name, its position and the address that identifies
   * which of several same-named places it is.
   * @param {number} stopIndex - Row being filled.
   * @param {object} chosenPlace - The place that was chosen.
   * @returns {void}
   */
  function takePlaceForStop(stopIndex, chosenPlace) {
    onChangeStops(
      stops.map((candidateStop, candidateIndex) =>
        candidateIndex === stopIndex
          ? {
              ...candidateStop,
              stopName: chosenPlace.stopName,
              latitude: String(chosenPlace.latitude),
              longitude: String(chosenPlace.longitude),
              placeDescription: chosenPlace.description,
            }
          : candidateStop
      )
    );
  }

  /**
   * Clears a stop's name and the position that came with it, so a half-corrected stop cannot keep
   * the position of the place it used to be.
   * @param {number} stopIndex - Row being retyped.
   * @param {string} typedText - What is in the field now.
   * @returns {void}
   */
  function changeStopName(stopIndex, typedText) {
    onChangeStops(
      stops.map((candidateStop, candidateIndex) =>
        candidateIndex === stopIndex
          ? { ...candidateStop, stopName: typedText, latitude: '', longitude: '', placeDescription: '' }
          : candidateStop
      )
    );
  }

  /**
   * Removes one stop.
   * @param {number} stopIndex - Row to remove.
   * @returns {void}
   */
  function removeStop(stopIndex) {
    onChangeStops(stops.filter((_candidateStop, candidateIndex) => candidateIndex !== stopIndex));
  }

  return (
    <div className="stop-editor">
      <div className="stop-editor__heading">
        <span className="text-label">{ROUTE_MESSAGES.stopsHeading}</span>
        <span className="text-caption text-muted">{ROUTE_MESSAGES.searchHint}</span>
      </div>

      <ol className="stop-editor__list">
        {stops.map((stopRow, stopIndex) => {
          const isFirstStop = stopIndex === 0;
          const isLastStop = stopIndex === stops.length - 1;
          const positionLabel = isFirstStop ? ' (start)' : isLastStop ? ' (end)' : '';
          return (
            <li key={`stop-${stopIndex}`} className="stop-editor__item">
              <div className="stop-editor__row">
                <span className="stop-editor__number">{stopIndex + 1}.</span>
                <StopPlaceSearch
                  stopIndex={stopIndex}
                  stopName={stopRow.stopName}
                  positionLabel={positionLabel}
                  onChangeName={(typedText) => changeStopName(stopIndex, typedText)}
                  onChoosePlace={(chosenPlace) => takePlaceForStop(stopIndex, chosenPlace)}
                />
                <div className="stop-editor__fare">
                  <FormField
                    fieldId={`stopFare-${stopIndex}`}
                    label="Fare (Rs)"
                    fieldText={String(stopRow.fareFromOrigin)}
                    onFieldTextChange={(fieldText) =>
                      changeStopField(stopIndex, 'fareFromOrigin', fieldText)
                    }
                  />
                </div>
                <Button
                  label="Remove"
                  icon={X}
                  variant="text"
                  size="small"
                  ariaLabel={`Remove stop ${stopIndex + 1}`}
                  onClick={() => removeStop(stopIndex)}
                />
              </div>

              {/* Which of several same-named places this is, so "Borella" is never ambiguous. */}
              {hasChosenPlace(stopRow) ? (
                <p className="stop-editor__chosen text-caption">
                  <MapPin size={13} aria-hidden="true" />
                  {stopRow.placeDescription || ROUTE_MESSAGES.positionFromMap}
                </p>
              ) : (
                stopRow.stopName.trim().length > 0 && (
                  <p className="stop-editor__unchosen text-caption">{ROUTE_MESSAGES.pickFromList}</p>
                )
              )}
            </li>
          );
        })}
      </ol>

      {errorText && <p className="stop-editor__error text-caption">{errorText}</p>}

      <Button
        label={ROUTE_MESSAGES.addStop}
        icon={Plus}
        variant="outline"
        onClick={() => onChangeStops([...stops, buildEmptyStop()])}
      />
    </div>
  );
}
