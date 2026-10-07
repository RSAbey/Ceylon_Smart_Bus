// The stop list inside the route dialog (Member 02).
// Each row carries a name, a position and the fare from the first stop. The Figma design shows only
// the name, but a stop without coordinates breaks the live map and the ETA, and without a fare the
// segment price cannot be worked out — so those fields are collected here too, shown on demand to
// keep the list as short as the design (recorded in docs/evidence/m02/deviations.md).
import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { DEFAULT_STOP_POSITION, ROUTE_MESSAGES } from './routeConstants';

/**
 * Builds an empty stop, positioned near the previous one so an admin nudges rather than types.
 * @param {object[]} existingStops - Stops already in the list.
 * @returns {object} A new stop row.
 */
export function buildEmptyStop(existingStops) {
  const previousStop = existingStops[existingStops.length - 1];
  return {
    stopName: '',
    latitude: String(previousStop ? previousStop.latitude : DEFAULT_STOP_POSITION.latitude),
    longitude: String(previousStop ? previousStop.longitude : DEFAULT_STOP_POSITION.longitude),
    fareFromOrigin: previousStop ? previousStop.fareFromOrigin : '0',
  };
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
  const [expandedStopIndex, setExpandedStopIndex] = useState(null);

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
   * Removes one stop and closes the expanded panel, so it cannot point at the wrong row.
   * @param {number} stopIndex - Row to remove.
   * @returns {void}
   */
  function removeStop(stopIndex) {
    onChangeStops(stops.filter((_candidateStop, candidateIndex) => candidateIndex !== stopIndex));
    setExpandedStopIndex(null);
  }

  return (
    <div className="stop-editor">
      <div className="stop-editor__heading">
        <span className="text-label">{ROUTE_MESSAGES.stopsHeading}</span>
        <span className="text-caption text-muted">{ROUTE_MESSAGES.stopsHint}</span>
      </div>

      <ol className="stop-editor__list">
        {stops.map((stopRow, stopIndex) => {
          const isExpanded = expandedStopIndex === stopIndex;
          const isFirstStop = stopIndex === 0;
          const isLastStop = stopIndex === stops.length - 1;
          const positionLabel = isFirstStop ? ' (start)' : isLastStop ? ' (end)' : '';
          return (
            <li key={`stop-${stopIndex}`} className="stop-editor__item">
              <div className="stop-editor__row">
                <span className="stop-editor__number">{stopIndex + 1}.</span>
                <input
                  type="text"
                  className="form-field__input stop-editor__name"
                  placeholder={`Stop name${positionLabel}`}
                  aria-label={`Stop ${stopIndex + 1} name`}
                  value={stopRow.stopName}
                  onChange={(changeEvent) =>
                    changeStopField(stopIndex, 'stopName', changeEvent.target.value)
                  }
                />
                <Button
                  label={isExpanded ? 'Hide details' : 'Details'}
                  icon={isExpanded ? ChevronUp : ChevronDown}
                  variant="text"
                  size="small"
                  ariaLabel={`${isExpanded ? 'Hide' : 'Show'} position and fare for stop ${stopIndex + 1}`}
                  onClick={() => setExpandedStopIndex(isExpanded ? null : stopIndex)}
                />
                <Button
                  label="Remove"
                  icon={X}
                  variant="text"
                  size="small"
                  ariaLabel={`Remove stop ${stopIndex + 1}`}
                  onClick={() => removeStop(stopIndex)}
                />
              </div>

              {isExpanded && (
                <div className="stop-editor__details">
                  <FormField
                    fieldId={`stopLatitude-${stopIndex}`}
                    label="Latitude"
                    fieldText={String(stopRow.latitude)}
                    onFieldTextChange={(fieldText) =>
                      changeStopField(stopIndex, 'latitude', fieldText)
                    }
                    helperText="Between -90 and 90."
                  />
                  <FormField
                    fieldId={`stopLongitude-${stopIndex}`}
                    label="Longitude"
                    fieldText={String(stopRow.longitude)}
                    onFieldTextChange={(fieldText) =>
                      changeStopField(stopIndex, 'longitude', fieldText)
                    }
                    helperText="Between -180 and 180."
                  />
                  <FormField
                    fieldId={`stopFare-${stopIndex}`}
                    label="Fare from the first stop (Rs)"
                    fieldText={String(stopRow.fareFromOrigin)}
                    onFieldTextChange={(fieldText) =>
                      changeStopField(stopIndex, 'fareFromOrigin', fieldText)
                    }
                    helperText="A journey between two stops is priced from the difference."
                  />
                </div>
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
        onClick={() => onChangeStops([...stops, buildEmptyStop(stops)])}
      />
    </div>
  );
}
