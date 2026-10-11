// The stop name field with place suggestions (Member 02, FR-03).
//
// Typing a stop name asks OpenStreetMap's geocoder — through our own API — for places of that name
// and lists them underneath. Choosing one fills in the latitude and longitude, so an administrator
// never has to read coordinates off another map and copy them across, which is where wrong stops
// came from. The coordinates stay editable under Details for a stop the geocoder does not know.
import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  MIN_PLACE_QUERY_LENGTH,
  PLACE_SEARCH_DEBOUNCE_MS,
  ROUTE_MESSAGES,
} from './routeConstants';
import { fetchPlaceSuggestions } from './routeApi';

/**
 * One stop's name field, with the suggestion list under it.
 * @param {object} props - Component props.
 * @param {number} props.stopIndex - Which stop this is, for labels.
 * @param {string} props.stopName - The name typed so far.
 * @param {string} props.positionLabel - " (start)", " (end)" or "".
 * @param {Function} props.onChangeName - Called with the typed text.
 * @param {Function} props.onChoosePlace - Called with { stopName, latitude, longitude } when picked.
 * @returns {import('react').JSX.Element} The field and its suggestions.
 */
export default function StopPlaceSearch({
  stopIndex,
  stopName,
  positionLabel,
  onChangeName,
  onChoosePlace,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [isListOpen, setIsListOpen] = useState(false);
  // What was last chosen from the list. While the text still matches it, there is nothing to search
  // for — otherwise picking a place would immediately search for its own name again.
  const chosenNameRef = useRef('');

  useEffect(() => {
    const typedName = stopName.trim();
    if (typedName.length < MIN_PLACE_QUERY_LENGTH || typedName === chosenNameRef.current) {
      setSuggestions([]);
      setSearchMessage('');
      return undefined;
    }

    let isEffectActive = true;
    setIsSearching(true);
    const searchTimerId = setTimeout(() => {
      fetchPlaceSuggestions(typedName)
        .then((foundPlaces) => {
          if (!isEffectActive) return;
          setSuggestions(foundPlaces);
          setSearchMessage(foundPlaces.length === 0 ? ROUTE_MESSAGES.noPlacesFound : '');
          setIsListOpen(true);
        })
        .catch((searchError) => {
          if (!isEffectActive) return;
          setSuggestions([]);
          setSearchMessage(searchError.message);
        })
        .finally(() => {
          if (isEffectActive) setIsSearching(false);
        });
    }, PLACE_SEARCH_DEBOUNCE_MS);

    return () => {
      isEffectActive = false;
      clearTimeout(searchTimerId);
    };
  }, [stopName]);

  /**
   * Takes the place the administrator picked, and stops searching for it again.
   * @param {object} chosenPlace - The suggestion that was clicked.
   * @returns {void}
   */
  function choosePlace(chosenPlace) {
    chosenNameRef.current = chosenPlace.stopName;
    setSuggestions([]);
    setIsListOpen(false);
    setSearchMessage('');
    onChoosePlace(chosenPlace);
  }

  return (
    <div className="stop-search">
      <input
        type="text"
        className="form-field__input stop-editor__name"
        placeholder={`Stop name${positionLabel}`}
        aria-label={`Stop ${stopIndex + 1} name`}
        autoComplete="off"
        value={stopName}
        onChange={(changeEvent) => onChangeName(changeEvent.target.value)}
        onFocus={() => setIsListOpen(true)}
        // A click on a suggestion blurs the input first, so closing is delayed past that click.
        onBlur={() => setTimeout(() => setIsListOpen(false), 150)}
      />

      {isSearching && <p className="stop-search__status text-caption">{ROUTE_MESSAGES.searching}</p>}

      {!isSearching && isListOpen && searchMessage && (
        <p className="stop-search__status text-caption">{searchMessage}</p>
      )}

      {isListOpen && suggestions.length > 0 && (
        <ul className="stop-search__list" role="listbox" aria-label="Matching places">
          {suggestions.map((placeSuggestion) => (
            <li key={placeSuggestion.placeId}>
              <button
                type="button"
                className="stop-search__option"
                onClick={() => choosePlace(placeSuggestion)}
              >
                <MapPin size={14} aria-hidden="true" />
                <span className="stop-search__option-text">
                  <span className="stop-search__option-name">{placeSuggestion.stopName}</span>
                  <span className="stop-search__option-address text-caption text-muted">
                    {placeSuggestion.description}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
