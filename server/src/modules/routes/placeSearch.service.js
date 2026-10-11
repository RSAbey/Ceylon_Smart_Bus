// Finding a place by name, so an administrator picks a stop from a list instead of typing latitude
// and longitude by hand (Member 02, FR-03).
//
// Nominatim is OpenStreetMap's own geocoder: no API key, no account, and the same data the maps are
// drawn from — so a stop chosen here sits exactly where the map shows it. It is called from the
// server rather than the browser for three reasons: the usage policy asks for a User-Agent that
// identifies the application, the admin dashboard and the mobile admin app then share one
// implementation, and the results can be reshaped into the fields a stop actually needs.
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
/** Only Sri Lankan places: this operator runs nowhere else, and it keeps the list short. */
const SRI_LANKA_COUNTRY_CODE = 'lk';
const MAX_SUGGESTIONS = 8;
/** Nominatim's usage policy requires a User-Agent that identifies the application. */
const CALLER_USER_AGENT = 'CeylonSmartBus/1.0 (IT3060 university project)';
/** Nominatim asks for no more than one request a second; the forms debounce to stay inside that. */
const SEARCH_TIMEOUT_MS = 8000;
const UNAVAILABLE_MESSAGE = 'Place search is unavailable right now. Type the coordinates instead.';

/**
 * Shortens a Nominatim result into the name a stop should carry.
 * Its `name` is the place on its own ("Koswatta"); `display_name` is the whole address down to the
 * country, which is useful for telling two places apart but far too long for a stop name.
 * @param {object} nominatimPlace - One result from Nominatim.
 * @returns {string} A short stop name.
 */
function readStopName(nominatimPlace) {
  if (nominatimPlace.name) return nominatimPlace.name;
  return String(nominatimPlace.display_name || '').split(',')[0].trim();
}

/**
 * Searches for places matching what the administrator typed.
 * @param {string} queryText - What was typed into the stop field.
 * @returns {Promise<Array<{placeId: string, stopName: string, description: string,
 *   latitude: number, longitude: number}>>} Suggestions, nearest match first.
 */
async function searchPlaces(queryText) {
  const searchUrl = new URL(NOMINATIM_SEARCH_URL);
  searchUrl.searchParams.set('q', queryText);
  searchUrl.searchParams.set('format', 'jsonv2');
  searchUrl.searchParams.set('limit', String(MAX_SUGGESTIONS));
  searchUrl.searchParams.set('countrycodes', SRI_LANKA_COUNTRY_CODE);

  let searchResponse;
  try {
    searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': CALLER_USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
  } catch {
    // Out of reach or too slow: the form still lets the coordinates be typed, so this is not fatal.
    throw new AppError(UNAVAILABLE_MESSAGE, HTTP_STATUS.BAD_GATEWAY);
  }

  if (!searchResponse.ok) {
    throw new AppError(UNAVAILABLE_MESSAGE, HTTP_STATUS.BAD_GATEWAY);
  }

  const foundPlaces = await searchResponse.json().catch(() => []);
  return foundPlaces.map((nominatimPlace) => ({
    placeId: String(nominatimPlace.place_id),
    stopName: readStopName(nominatimPlace),
    description: nominatimPlace.display_name,
    latitude: Number(nominatimPlace.lat),
    longitude: Number(nominatimPlace.lon),
  }));
}

module.exports = { searchPlaces };
