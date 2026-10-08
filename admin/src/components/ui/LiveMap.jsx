// Real map of the running buses, shared by Live Fleet and the Overview.
// Leaflet with OpenStreetMap tiles: a genuine street map that needs no API key and no account, so
// the dashboard shows real roads without shipping a secret. Attribution is required by the tile
// policy and is drawn by Leaflet in the corner.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/** Colombo, so an empty map opens where this service runs rather than in the Atlantic. */
const COLOMBO_CENTRE = Object.freeze([6.9271, 79.8612]);
const DEFAULT_ZOOM = 12;
const MAX_TILE_ZOOM = 19;
/** Keeps the fitted view from diving into street level when only one bus is reporting. */
const MAX_FITTED_ZOOM = 15;
const FOCUS_ZOOM = 15;
const FIT_PADDING_PX = 48;
const STOP_MARKER_RADIUS = 4;
const BUS_MARKER_SIZE = 18;

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Builds the marker for one bus. The shape carries the service state as well as the colour, so the
 * map still reads in greyscale or to a colour-blind administrator (NFR-09).
 * @param {string} liveStatus - onTime, delayed or disrupted.
 * @param {boolean} isFocused - Whether this is the bus the administrator asked to see.
 * @returns {import('leaflet').DivIcon} The marker icon.
 */
function buildBusIcon(liveStatus, isFocused) {
  const markerClassNames = [
    'live-map__bus',
    `live-map__bus--${liveStatus}`,
    isFocused ? 'live-map__bus--focused' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return L.divIcon({
    className: 'live-map__marker',
    // Only class names built from our own fixed strings go in here; every piece of text that comes
    // from the database is written with textContent below, so no stored value can inject markup.
    html: `<span class="${markerClassNames}"></span>`,
    iconSize: [BUS_MARKER_SIZE, BUS_MARKER_SIZE],
    iconAnchor: [BUS_MARKER_SIZE / 2, BUS_MARKER_SIZE / 2],
  });
}

/**
 * Builds a tooltip from stored text without letting it be read as HTML.
 * @param {string} tooltipText - What to show.
 * @returns {HTMLElement} The tooltip content.
 */
function buildTooltip(tooltipText) {
  const tooltipElement = document.createElement('span');
  tooltipElement.textContent = tooltipText;
  return tooltipElement;
}

/**
 * Street map of the buses currently reporting a position.
 * @param {object} props - Component props.
 * @param {Array<{tripId: string, label: string, caption: string, liveStatus: string,
 *   position: {latitude: number, longitude: number}}>} props.buses - Buses to plot.
 * @param {Array<{routeId: string, stops: object[]}>} [props.routePaths] - Route lines to draw under them.
 * @param {string | null} [props.focusedTripId] - Bus to centre on.
 * @param {Function} [props.onFocusBus] - Called with a trip id when a marker is clicked.
 * @param {boolean} [props.isCompact] - Shorter map, for the Overview panel.
 * @returns {import('react').JSX.Element} The map.
 */
export default function LiveMap({
  buses,
  routePaths = [],
  focusedTripId = null,
  onFocusBus,
  isCompact = false,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawnLayerRef = useRef(null);
  // The view is fitted to the buses once. After that the administrator's own panning and zooming
  // is left alone, otherwise every refresh would snatch the map back.
  const hasFittedOnceRef = useRef(false);

  useEffect(() => {
    const createdMap = L.map(mapContainerRef.current, {
      center: COLOMBO_CENTRE,
      zoom: DEFAULT_ZOOM,
      // Scrolling the page over the map should scroll the page, not zoom the map.
      scrollWheelZoom: false,
    });
    L.tileLayer(OSM_TILE_URL, { maxZoom: MAX_TILE_ZOOM, attribution: OSM_ATTRIBUTION }).addTo(
      createdMap
    );
    mapRef.current = createdMap;
    drawnLayerRef.current = L.layerGroup().addTo(createdMap);

    return () => {
      createdMap.remove();
      mapRef.current = null;
      drawnLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const currentMap = mapRef.current;
    const drawnLayer = drawnLayerRef.current;
    if (!currentMap || !drawnLayer) return;

    drawnLayer.clearLayers();
    const plottedPoints = [];

    routePaths.forEach((routePath) => {
      const linePoints = routePath.stops.map((routeStop) => [
        routeStop.latitude,
        routeStop.longitude,
      ]);
      if (linePoints.length > 1) {
        L.polyline(linePoints, { className: 'live-map__route' }).addTo(drawnLayer);
      }
      routePath.stops.forEach((routeStop) => {
        L.circleMarker([routeStop.latitude, routeStop.longitude], {
          radius: STOP_MARKER_RADIUS,
          className: 'live-map__stop',
        })
          .bindTooltip(buildTooltip(routeStop.stopName))
          .addTo(drawnLayer);
      });
      plottedPoints.push(...linePoints);
    });

    buses.forEach((bus) => {
      const busPoint = [bus.position.latitude, bus.position.longitude];
      const busMarker = L.marker(busPoint, {
        icon: buildBusIcon(bus.liveStatus, bus.tripId === focusedTripId),
        keyboard: false,
      }).bindTooltip(buildTooltip(`${bus.label} · ${bus.caption}`));
      if (onFocusBus) busMarker.on('click', () => onFocusBus(bus.tripId));
      busMarker.addTo(drawnLayer);
      plottedPoints.push(busPoint);
    });

    if (plottedPoints.length > 0 && !hasFittedOnceRef.current) {
      currentMap.fitBounds(L.latLngBounds(plottedPoints), {
        padding: [FIT_PADDING_PX, FIT_PADDING_PX],
        maxZoom: MAX_FITTED_ZOOM,
      });
      hasFittedOnceRef.current = true;
    }
  }, [buses, routePaths, focusedTripId, onFocusBus]);

  useEffect(() => {
    const focusedBus = buses.find((bus) => bus.tripId === focusedTripId);
    if (focusedBus && mapRef.current) {
      mapRef.current.setView(
        [focusedBus.position.latitude, focusedBus.position.longitude],
        FOCUS_ZOOM
      );
    }
  }, [focusedTripId, buses]);

  return (
    <div
      ref={mapContainerRef}
      className={isCompact ? 'live-map live-map--compact' : 'live-map'}
      role="application"
      aria-label={`Street map of ${buses.length} running ${buses.length === 1 ? 'bus' : 'buses'}. The table below lists the same buses as text.`}
    />
  );
}
