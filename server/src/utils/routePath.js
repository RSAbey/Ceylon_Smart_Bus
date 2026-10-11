// Splitting a route's line at the bus (Member 02, FR-02/FR-03).
//
// A route drawn end to end tells a waiting passenger very little: most of it is behind the bus.
// What they want is the part still to come, starting where the bus actually is — the way a ride app
// draws the leg you are waiting for. These two functions work out that split, once, on the server,
// so the admin map and the phone draw exactly the same line instead of each doing its own geometry.
//
// The maths treats latitude and longitude as flat coordinates. Over one bus route that is accurate
// enough to pick the right segment: a degree of longitude in Sri Lanka is about 0.75 % shorter than
// a degree of latitude, which cannot move the answer to a neighbouring segment. Real distances are
// measured with geoDistance.js, which does account for the curve.

/** Fractions along a segment: a projection is clamped between its two ends. */
const SEGMENT_START = 0;
const SEGMENT_END = 1;
/** A route needs two stops before it has a line to split. */
const MIN_STOPS_FOR_A_LINE = 2;

/**
 * Reduces a stop or a position to the two numbers this file works with.
 * @param {{latitude: number, longitude: number}} mapPoint - Stop or bus position.
 * @returns {{latitude: number, longitude: number}} A plain point.
 */
function toPlainPoint(mapPoint) {
  return { latitude: mapPoint.latitude, longitude: mapPoint.longitude };
}

/**
 * Finds the nearest point to `position` on the segment between two stops.
 * @param {object} position - Where the bus is.
 * @param {object} segmentStart - Stop the segment leaves.
 * @param {object} segmentEnd - Stop the segment reaches.
 * @returns {{point: object, fractionAlong: number, offRouteDistance: number}} The projection, how
 *   far along the segment it falls, and how far the bus sits off the line.
 */
function projectOntoSegment(position, segmentStart, segmentEnd) {
  const segmentLatitudeSpan = segmentEnd.latitude - segmentStart.latitude;
  const segmentLongitudeSpan = segmentEnd.longitude - segmentStart.longitude;
  const segmentLengthSquared =
    segmentLatitudeSpan * segmentLatitudeSpan + segmentLongitudeSpan * segmentLongitudeSpan;

  // Two stops in the same place have no direction to project onto, so the start is the answer.
  let fractionAlong = SEGMENT_START;
  if (segmentLengthSquared > 0) {
    const alongSegment =
      (position.latitude - segmentStart.latitude) * segmentLatitudeSpan +
      (position.longitude - segmentStart.longitude) * segmentLongitudeSpan;
    fractionAlong = Math.min(
      SEGMENT_END,
      Math.max(SEGMENT_START, alongSegment / segmentLengthSquared)
    );
  }

  const point = {
    latitude: segmentStart.latitude + segmentLatitudeSpan * fractionAlong,
    longitude: segmentStart.longitude + segmentLongitudeSpan * fractionAlong,
  };
  const latitudeGap = position.latitude - point.latitude;
  const longitudeGap = position.longitude - point.longitude;
  return {
    point,
    fractionAlong,
    offRouteDistance: Math.sqrt(latitudeGap * latitudeGap + longitudeGap * longitudeGap),
  };
}

/**
 * Splits a route's stop line at the bus.
 * @param {object[]} orderedStops - The route's stops in travel order.
 * @param {{latitude: number, longitude: number} | null} busPosition - Where the bus is now, or null.
 * @returns {{travelled: object[], ahead: object[]}} The line behind the bus and the line in front of
 *   it. `ahead` begins at the bus itself, so the drawn route starts wherever the driver is. With no
 *   position, nothing is behind and the whole route is ahead.
 */
function splitRoutePathAtBus(orderedStops, busPosition) {
  const linePoints = (orderedStops || []).map(toPlainPoint);
  if (!busPosition || linePoints.length < MIN_STOPS_FOR_A_LINE) {
    return { travelled: [], ahead: linePoints };
  }

  const bus = toPlainPoint(busPosition);
  let nearestSegmentIndex = 0;
  let nearestProjection = projectOntoSegment(bus, linePoints[0], linePoints[1]);

  for (let segmentIndex = 1; segmentIndex < linePoints.length - 1; segmentIndex += 1) {
    const projection = projectOntoSegment(
      bus,
      linePoints[segmentIndex],
      linePoints[segmentIndex + 1]
    );
    if (projection.offRouteDistance < nearestProjection.offRouteDistance) {
      nearestSegmentIndex = segmentIndex;
      nearestProjection = projection;
    }
  }

  return {
    // Up to and including where the bus sits on the line, so the two halves meet at the bus.
    travelled: [...linePoints.slice(0, nearestSegmentIndex + 1), nearestProjection.point],
    // From the bus itself onward: this is what makes the route start at the driver's live position.
    ahead: [bus, ...linePoints.slice(nearestSegmentIndex + 1)],
  };
}

module.exports = { splitRoutePathAtBus };
