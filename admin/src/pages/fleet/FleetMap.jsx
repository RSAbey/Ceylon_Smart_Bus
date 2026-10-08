// Fleet map (Member 02): every running bus drawn over the stops of the route it is serving.
// A street map needs a paid tile key, which this project does not ship, so the positions are drawn
// on a plain latitude/longitude plot instead: the coordinates are the real ones the drivers posted,
// only the streets are missing. Recorded in docs/evidence/m02/deviations.md.
import { FLEET_MESSAGES, LIVE_STATUSES } from './fleetConstants';

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 440;
/** Keeps a marker and its label inside the frame when a bus sits on the edge of the area. */
const EDGE_PADDING = 56;
const DRAW_WIDTH = VIEW_WIDTH - EDGE_PADDING * 2;
const DRAW_HEIGHT = VIEW_HEIGHT - EDGE_PADDING * 2;
/** About 1 km, so a single bus is not magnified until its own GPS jitter fills the frame. */
const MIN_SPAN_DEGREES = 0.01;
/** Breathing room around the outermost point, as a share of the area being shown. */
const SPAN_PADDING_RATIO = 0.12;
const BUS_MARKER_RADIUS = 9;
const FOCUSED_MARKER_RADIUS = 13;
const STOP_MARKER_RADIUS = 3.5;
const LABEL_OFFSET_Y = 20;
const LEGEND_SWATCH_CENTRE = 7;
const LEGEND_SWATCH_RADIUS = 5;

const MAP_LEGEND = Object.freeze([
  { liveStatus: LIVE_STATUSES.ON_TIME, label: 'On time (circle)' },
  { liveStatus: LIVE_STATUSES.DELAYED, label: 'Delayed (triangle)' },
  { liveStatus: LIVE_STATUSES.DISRUPTED, label: 'No signal (square)' },
]);

/**
 * Builds the function that turns a coordinate into a point in the drawing.
 * One scale is used for both axes so the shape of the route is not stretched. Sri Lanka is close
 * enough to the equator that a degree of latitude and a degree of longitude cover almost the same
 * distance, so no further projection correction is needed at this scale.
 * @param {Array<{latitude: number, longitude: number}>} plottedPoints - Every point to be shown.
 * @returns {Function} Takes a coordinate and returns { canvasX, canvasY } in the viewBox.
 */
function buildProjection(plottedPoints) {
  const latitudes = plottedPoints.map((plottedPoint) => plottedPoint.latitude);
  const longitudes = plottedPoints.map((plottedPoint) => plottedPoint.longitude);
  const centreLatitude = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
  const centreLongitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;

  const paddedSpan = (lowest, highest) =>
    Math.max(highest - lowest, MIN_SPAN_DEGREES) * (1 + SPAN_PADDING_RATIO);
  const degreesPerPixel = Math.max(
    paddedSpan(Math.min(...latitudes), Math.max(...latitudes)) / DRAW_HEIGHT,
    paddedSpan(Math.min(...longitudes), Math.max(...longitudes)) / DRAW_WIDTH
  );

  return ({ latitude, longitude }) => ({
    canvasX: VIEW_WIDTH / 2 + (longitude - centreLongitude) / degreesPerPixel,
    // Latitude grows northwards but SVG y grows downwards, so the sign is flipped.
    canvasY: VIEW_HEIGHT / 2 - (latitude - centreLatitude) / degreesPerPixel,
  });
}

/**
 * The marker for one bus. The shape carries the service status as well as the colour, so the map
 * still reads correctly in greyscale or to a colour-blind administrator (NFR-09).
 * @param {object} props - Component props.
 * @param {string} props.liveStatus - A LIVE_STATUSES value.
 * @param {number} props.centreX - Marker centre, x.
 * @param {number} props.centreY - Marker centre, y.
 * @param {number} props.radius - Half the marker's width.
 * @returns {import('react').JSX.Element} A circle, triangle or square.
 */
function MarkerShape({ liveStatus, centreX, centreY, radius }) {
  if (liveStatus === LIVE_STATUSES.DELAYED) {
    const trianglePoints = [
      `${centreX},${centreY - radius}`,
      `${centreX + radius},${centreY + radius}`,
      `${centreX - radius},${centreY + radius}`,
    ].join(' ');
    return <polygon points={trianglePoints} />;
  }
  if (liveStatus === LIVE_STATUSES.DISRUPTED) {
    return (
      <rect x={centreX - radius} y={centreY - radius} width={radius * 2} height={radius * 2} />
    );
  }
  return <circle cx={centreX} cy={centreY} r={radius} />;
}

/**
 * Live positions of the running buses.
 * The drawing is marked up as a single image: clicking a marker is a shortcut for sighted users,
 * while the vehicle table below carries the same facts as text and its "Show on map" button is the
 * keyboard route to the same focus.
 * @param {object} props - Component props.
 * @param {object[]} props.fleet - Fleet rows currently shown in the list.
 * @param {object[]} props.routePaths - Stops of each route being served.
 * @param {string | null} props.focusedTripId - Trip the administrator is looking at.
 * @param {Function} props.onFocusBus - Called with a trip id when a marker is clicked.
 * @returns {import('react').JSX.Element} The map card.
 */
export default function FleetMap({ fleet, routePaths, focusedTripId, onFocusBus }) {
  const plottedBuses = fleet.filter((fleetRow) => fleetRow.position);
  const plottedPoints = [
    ...routePaths.flatMap((routePath) => routePath.stops),
    ...plottedBuses.map((fleetRow) => fleetRow.position),
  ];

  if (plottedPoints.length === 0) {
    return (
      <section className="card fleet-map" aria-label="Fleet map">
        <p className="text-body-large">{FLEET_MESSAGES.noPositions}</p>
        <p className="text-caption text-muted">{FLEET_MESSAGES.mapCaption}</p>
      </section>
    );
  }

  const project = buildProjection(plottedPoints);
  const unplottedCount = fleet.length - plottedBuses.length;

  return (
    <section className="card fleet-map" aria-label="Fleet map">
      <svg
        className="fleet-map__canvas"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={`Map of ${plottedBuses.length} running ${plottedBuses.length === 1 ? 'bus' : 'buses'} plotted by longitude and latitude.`}
      >
        {routePaths.map((routePath) => (
          <polyline
            key={routePath.routeId}
            className="fleet-map__route"
            points={routePath.stops
              .map((routeStop) => {
                const stopPoint = project(routeStop);
                return `${stopPoint.canvasX},${stopPoint.canvasY}`;
              })
              .join(' ')}
          />
        ))}

        {routePaths.flatMap((routePath) =>
          routePath.stops.map((routeStop) => {
            const stopPoint = project(routeStop);
            return (
              <circle
                key={`${routePath.routeId}-${routeStop.stopSequence}`}
                className="fleet-map__stop"
                cx={stopPoint.canvasX}
                cy={stopPoint.canvasY}
                r={STOP_MARKER_RADIUS}
              />
            );
          })
        )}

        {plottedBuses.map((fleetRow) => {
          const busPoint = project(fleetRow.position);
          const isFocused = fleetRow.tripId === focusedTripId;
          const markerClassNames = [
            'fleet-map__bus',
            `fleet-map__bus--${fleetRow.liveStatus}`,
            isFocused ? 'fleet-map__bus--focused' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <g
              key={fleetRow.tripId}
              className={markerClassNames}
              onClick={() => onFocusBus(fleetRow.tripId)}
            >
              <MarkerShape
                liveStatus={fleetRow.liveStatus}
                centreX={busPoint.canvasX}
                centreY={busPoint.canvasY}
                radius={isFocused ? FOCUSED_MARKER_RADIUS : BUS_MARKER_RADIUS}
              />
              <text
                className="fleet-map__label"
                x={busPoint.canvasX}
                y={busPoint.canvasY + LABEL_OFFSET_Y}
                textAnchor="middle"
              >
                {fleetRow.bus?.busCode}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="fleet-map__legend">
        {MAP_LEGEND.map((legendEntry) => (
          <li key={legendEntry.liveStatus} className="fleet-map__legend-entry">
            <svg
              className={`fleet-map__bus fleet-map__bus--${legendEntry.liveStatus}`}
              width={LEGEND_SWATCH_CENTRE * 2}
              height={LEGEND_SWATCH_CENTRE * 2}
              aria-hidden="true"
            >
              <MarkerShape
                liveStatus={legendEntry.liveStatus}
                centreX={LEGEND_SWATCH_CENTRE}
                centreY={LEGEND_SWATCH_CENTRE}
                radius={LEGEND_SWATCH_RADIUS}
              />
            </svg>
            {legendEntry.label}
          </li>
        ))}
      </ul>

      <p className="text-caption text-muted">
        {FLEET_MESSAGES.mapCaption}
        {unplottedCount > 0 &&
          ` ${unplottedCount} running ${unplottedCount === 1 ? 'bus has' : 'buses have'} not posted a position and ${unplottedCount === 1 ? 'is' : 'are'} not on the map.`}
      </p>
    </section>
  );
}
