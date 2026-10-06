// Great-circle distance between two coordinates, used for ETA and "nearest bus" calculations.

const EARTH_RADIUS_KM = 6371;
const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Distance in kilometres between two latitude/longitude points (haversine formula).
 * Accurate enough for city distances and needs no external service.
 * @param {{latitude: number, longitude: number}} fromPoint - Start coordinate.
 * @param {{latitude: number, longitude: number}} toPoint - End coordinate.
 * @returns {number} Distance in kilometres.
 */
function getDistanceInKm(fromPoint, toPoint) {
  const latitudeDifference = (toPoint.latitude - fromPoint.latitude) * DEGREES_TO_RADIANS;
  const longitudeDifference = (toPoint.longitude - fromPoint.longitude) * DEGREES_TO_RADIANS;
  const fromLatitudeRadians = fromPoint.latitude * DEGREES_TO_RADIANS;
  const toLatitudeRadians = toPoint.latitude * DEGREES_TO_RADIANS;

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.sin(longitudeDifference / 2) ** 2 * Math.cos(fromLatitudeRadians) * Math.cos(toLatitudeRadians);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}

module.exports = { getDistanceInKm };
