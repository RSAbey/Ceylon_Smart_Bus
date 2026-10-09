// `npm run simulate` — walks the seeded ongoing trip along its route, posting a position every few seconds.
// Member 02 needs this to demonstrate live tracking without a real moving bus (PROJECT_PLAN master prompt B2).
const environment = require('../config/environment');
const { connectToDatabase, disconnectFromDatabase } = require('../config/database');
const Trip = require('../modules/trips/trip.model');
const RouteStop = require('../modules/routes/routeStop.model');
const BusLocation = require('../modules/tracking/busLocation.model');
// Loading the Route model registers its schema, which the populate('routeId') below needs.
require('../modules/routes/route.model');
const { TRIP_STATUSES } = require('../modules/trips/trip.constants');
const { LOCATION_POST_INTERVAL_SECONDS } = require('../modules/tracking/tracking.constants');

const MILLISECONDS_PER_SECOND = 1000;
const SIMULATION_FAILURE_EXIT_CODE = 1;
/** Steps taken between one stop and the next, so the marker glides rather than jumping. */
const STEPS_BETWEEN_STOPS = 8;
const SIMULATED_SPEED_KMH = 22;

/**
 * Builds the list of positions the bus will pass through, interpolating between consecutive stops.
 * @param {object[]} orderedStops - Route stops in travel order.
 * @returns {Array<{latitude: number, longitude: number}>} Positions along the route.
 */
function buildRoutePath(orderedStops) {
  const pathPositions = [];
  for (let stopIndex = 0; stopIndex < orderedStops.length - 1; stopIndex += 1) {
    const fromStop = orderedStops[stopIndex];
    const toStop = orderedStops[stopIndex + 1];
    for (let step = 0; step < STEPS_BETWEEN_STOPS; step += 1) {
      const travelled = step / STEPS_BETWEEN_STOPS;
      pathPositions.push({
        latitude: fromStop.latitude + (toStop.latitude - fromStop.latitude) * travelled,
        longitude: fromStop.longitude + (toStop.longitude - fromStop.longitude) * travelled,
      });
    }
  }
  pathPositions.push({
    latitude: orderedStops[orderedStops.length - 1].latitude,
    longitude: orderedStops[orderedStops.length - 1].longitude,
  });
  return pathPositions;
}

/**
 * Writes one position to the trip and the location history, exactly as the driver app would.
 * @param {object} runningTrip - The trip being simulated.
 * @param {{latitude: number, longitude: number}} position - Where the bus is now.
 * @returns {Promise<void>} Resolves once stored.
 */
async function postPosition(runningTrip, position) {
  const recordedAt = new Date();
  await BusLocation.create({
    tripId: runningTrip.id,
    latitude: position.latitude,
    longitude: position.longitude,
    speedKmh: SIMULATED_SPEED_KMH,
    recordedAt,
  });
  await Trip.findByIdAndUpdate(runningTrip.id, {
    lastLatitude: position.latitude,
    lastLongitude: position.longitude,
    lastLocationAt: recordedAt,
  });
}

/**
 * Waits between position updates without blocking the event loop.
 * @param {number} milliseconds - How long to wait.
 * @returns {Promise<void>} Resolves after the delay.
 */
function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Drives the seeded ongoing trip along its route until the end, then loops back to the start.
 * Stop it with Ctrl+C.
 * @returns {Promise<void>} Runs until interrupted.
 */
async function simulateBusMovement() {
  if (environment.isProduction) {
    throw new Error('Refusing to simulate bus movement while NODE_ENV=production.');
  }
  await connectToDatabase();

  const runningTrip = await Trip.findOne({ status: TRIP_STATUSES.ONGOING }).populate('routeId');
  if (!runningTrip) {
    throw new Error('No ongoing trip found. Run `npm run seed` first, or start a trip as a driver.');
  }
  const orderedStops = await RouteStop.find({ routeId: runningTrip.routeId.id }).sort({ stopSequence: 1 });
  if (orderedStops.length < 2) {
    throw new Error('That route has fewer than two stops, so there is nothing to drive along.');
  }

  const pathPositions = buildRoutePath(orderedStops);
  process.stdout.write(
    `Simulating route ${runningTrip.routeId.routeNumber} ` +
      `(${orderedStops.length} stops, ${pathPositions.length} positions). Press Ctrl+C to stop.\n`
  );

  let positionIndex = 0;
  // Loop forever so a demo can be left running; each pass restarts at the first stop.
  for (;;) {
    const position = pathPositions[positionIndex % pathPositions.length];
    await postPosition(runningTrip, position);
    process.stdout.write(
      `  ${String(positionIndex % pathPositions.length).padStart(3)} / ${pathPositions.length}  ` +
        `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}\n`
    );
    positionIndex += 1;
    await wait(LOCATION_POST_INTERVAL_SECONDS * MILLISECONDS_PER_SECOND);
  }
}

simulateBusMovement()
  .catch((simulationError) => {
    console.error('Simulation failed:', simulationError.message);
    process.exitCode = SIMULATION_FAILURE_EXIT_CODE;
    return disconnectFromDatabase();
  });
