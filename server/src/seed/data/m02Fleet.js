// Demo fleet (Member 02 tables): 2 routes with ordered stops, 3 buses, 1 ongoing trip, a recent GPS ping, saved routes.
// All coordinates and fares are APPROXIMATE demo data around Colombo, not official timetable or fare-board values.
const Route = require('../../modules/routes/route.model');
const RouteStop = require('../../modules/routes/routeStop.model');
const Bus = require('../../modules/buses/bus.model');
const Trip = require('../../modules/trips/trip.model');
const BusLocation = require('../../modules/tracking/busLocation.model');
const SavedRoute = require('../../modules/savedRoutes/savedRoute.model');
const { BUS_STATUSES } = require('../../modules/buses/bus.constants');

const MILLISECONDS_PER_MINUTE = 60 * 1000;
const TRIP_STARTED_MINUTES_AGO = 25;
const LAST_PING_MILLISECONDS_AGO = 8 * 1000;
const DEMO_BUS_SPEED_KMH = 18;

/** Stop lists in travel order; fareFromOrigin is the LKR fare from the first stop. */
const DEMO_ROUTES = [
  {
    routeNumber: '154',
    routeName: 'Kaduwela - Pettah via Malabe',
    origin: 'Kaduwela',
    destination: 'Pettah',
    baseFare: 30,
    stops: [
      ['Kaduwela', 6.9363, 79.9843, 0],
      ['Malabe', 6.9061, 79.9696, 30],
      ['Thalahena', 6.901, 79.953, 40],
      ['Koswatta', 6.9045, 79.929, 50],
      ['Battaramulla', 6.9, 79.918, 60],
      ['Rajagiriya', 6.909, 79.896, 70],
      ['Borella', 6.9147, 79.8775, 80],
      ['Maradana', 6.9285, 79.865, 90],
      ['Pettah Central Bus Stand', 6.9344, 79.853, 100],
    ],
  },
  {
    routeNumber: '138',
    routeName: 'Pettah - Homagama via High Level Road',
    origin: 'Pettah',
    destination: 'Homagama',
    baseFare: 30,
    stops: [
      ['Pettah Central Bus Stand', 6.9344, 79.853, 0],
      ['Town Hall', 6.9165, 79.8636, 30],
      ['Thummulla', 6.8935, 79.862, 40],
      ['Kirulapone', 6.879, 79.877, 50],
      ['Nugegoda', 6.872, 79.889, 60],
      ['Delkanda', 6.862, 79.901, 70],
      ['Maharagama', 6.848, 79.9265, 80],
      ['Pannipitiya', 6.846, 79.945, 90],
      ['Kottawa', 6.841, 79.965, 100],
      ['Homagama', 6.844, 80.003, 120],
    ],
  },
];

/** Index of the stop the demo bus has just passed (Battaramulla on route 154). */
const ONGOING_TRIP_CURRENT_STOP_INDEX = 4;

/**
 * Inserts the routes and their ordered stops.
 * @returns {Promise<{routes: object[], stopsByRouteNumber: Map<string, object[]>}>} Created routes and stops.
 */
async function seedRoutesWithStops() {
  const routes = await Route.insertMany(
    DEMO_ROUTES.map((demoRoute) => ({
      routeNumber: demoRoute.routeNumber,
      routeName: demoRoute.routeName,
      origin: demoRoute.origin,
      destination: demoRoute.destination,
      baseFare: demoRoute.baseFare,
    }))
  );
  const stopsByRouteNumber = new Map();

  for (const createdRoute of routes) {
    const demoRoute = DEMO_ROUTES.find((routeDefinition) => routeDefinition.routeNumber === createdRoute.routeNumber);
    const createdStops = await RouteStop.insertMany(
      demoRoute.stops.map(([stopName, latitude, longitude, fareFromOrigin], stopIndex) => ({
        routeId: createdRoute.id,
        stopName,
        latitude,
        longitude,
        stopSequence: stopIndex + 1,
        fareFromOrigin,
      }))
    );
    stopsByRouteNumber.set(createdRoute.routeNumber, createdStops);
  }
  return { routes, stopsByRouteNumber };
}

/**
 * Inserts three buses: two assigned to a driver and route, one in maintenance without a driver.
 * @param {object[]} routes - Routes 154 and 138.
 * @param {object[]} driverProfiles - Sunil's and Ruwan's profiles.
 * @returns {Promise<object[]>} Created buses.
 */
async function seedBuses(routes, driverProfiles) {
  const [route154, route138] = routes;
  const [sunilProfile, ruwanProfile] = driverProfiles;
  return Bus.insertMany([
    {
      busCode: 'BUS-001',
      plateNumber: 'NB-1234',
      busName: 'Kaduwela Express',
      model: 'Ashok Leyland Viking',
      capacity: 52,
      gpsDeviceId: 'GPS-CSB-0001',
      driverId: sunilProfile.id,
      routeId: route154.id,
    },
    {
      busCode: 'BUS-002',
      plateNumber: 'NC-5678',
      busName: 'Homagama Link',
      model: 'TATA Marcopolo',
      capacity: 49,
      gpsDeviceId: 'GPS-CSB-0002',
      driverId: ruwanProfile.id,
      routeId: route138.id,
    },
    {
      busCode: 'BUS-003',
      plateNumber: 'ND-4321',
      busName: 'Malabe Shuttle',
      model: 'TATA Starbus',
      capacity: 40,
      gpsDeviceId: 'GPS-CSB-0003',
      status: BUS_STATUSES.MAINTENANCE,
      routeId: route154.id,
    },
  ]);
}

/**
 * Starts one ongoing trip on route 154 and records the bus's latest GPS ping near Battaramulla.
 * @param {object} assignedBus - Bus NB-1234.
 * @param {object[]} route154Stops - Ordered stops of route 154.
 * @returns {Promise<object>} The ongoing trip.
 */
async function seedOngoingTripWithLocation(assignedBus, route154Stops) {
  const currentStop = route154Stops[ONGOING_TRIP_CURRENT_STOP_INDEX];
  const lastPingTime = new Date(Date.now() - LAST_PING_MILLISECONDS_AGO);

  const ongoingTrip = await Trip.create({
    busId: assignedBus.id,
    routeId: assignedBus.routeId,
    driverId: assignedBus.driverId,
    startedAt: new Date(Date.now() - TRIP_STARTED_MINUTES_AGO * MILLISECONDS_PER_MINUTE),
    lastLatitude: currentStop.latitude,
    lastLongitude: currentStop.longitude,
    lastLocationAt: lastPingTime,
  });
  await BusLocation.create({
    tripId: ongoingTrip.id,
    latitude: currentStop.latitude,
    longitude: currentStop.longitude,
    speedKmh: DEMO_BUS_SPEED_KMH,
    recordedAt: lastPingTime,
  });
  return ongoingTrip;
}

/**
 * Seeds the whole fleet in dependency order.
 * @param {object} accounts - Output of seedAccounts().
 * @returns {Promise<{routes: object[], stopsByRouteNumber: Map<string, object[]>, buses: object[], ongoingTrip: object}>}
 *   Created documents for the later seed steps.
 */
async function seedFleet(accounts) {
  const { driverProfiles, passengerUsers } = accounts;
  const { routes, stopsByRouteNumber } = await seedRoutesWithStops();
  const buses = await seedBuses(routes, driverProfiles);
  const ongoingTrip = await seedOngoingTripWithLocation(buses[0], stopsByRouteNumber.get('154'));

  const [anjali, kasun] = passengerUsers;
  const [route154, route138] = routes;
  await SavedRoute.insertMany([
    { userId: anjali.id, routeId: route154.id },
    { userId: anjali.id, routeId: route138.id },
    { userId: kasun.id, routeId: route154.id },
  ]);

  return { routes, stopsByRouteNumber, buses, ongoingTrip };
}

module.exports = { seedFleet };
