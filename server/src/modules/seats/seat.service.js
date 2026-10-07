// Seat business logic (Member 03): builds the seat map for a trip and holds or releases the seats a
// ticket owns. One ticket may hold several seats, so a family travels on one ticket and one fare.
const SeatBooking = require('./seatBooking.model');
const Trip = require('../trips/trip.model');
const {
  SEAT_BOOKING_STATUSES,
  SEATS_PER_ROW,
  SEAT_COLUMN_LABELS,
  FIRST_ROW_NUMBER,
  MAX_SEATS_PER_TICKET,
} = require('./seat.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * Builds every seat label a bus has, in map order ("1A", "1B", "1C", "1D", "2A" ...).
 * The last row is short when the capacity does not divide evenly by four.
 * @param {number} capacity - How many passengers the bus seats.
 * @returns {string[]} Seat labels in map order.
 */
function buildSeatLabels(capacity) {
  const seatLabels = [];
  for (let seatIndex = 0; seatIndex < capacity; seatIndex += 1) {
    const rowNumber = Math.floor(seatIndex / SEATS_PER_ROW) + FIRST_ROW_NUMBER;
    const columnLabel = SEAT_COLUMN_LABELS[seatIndex % SEATS_PER_ROW];
    seatLabels.push(`${rowNumber}${columnLabel}`);
  }
  return seatLabels;
}

/**
 * Loads a trip that can still be booked, because seats are only sold on a bus in service.
 * @param {string} tripId - Trip the passenger is booking on.
 * @returns {Promise<object>} The trip with its bus and route populated.
 */
async function getTripForBooking(tripId) {
  const matchingTrip = await Trip.findById(tripId).populate(['busId', 'routeId']);
  if (!matchingTrip) {
    throw new AppError('Trip not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (!matchingTrip.busId) {
    throw new AppError('This trip has no bus assigned.', HTTP_STATUS.CONFLICT);
  }
  return matchingTrip;
}

/**
 * The seat map for one trip: every seat label with whether it is already taken (FR-06).
 * @param {string} tripId - Trip to show.
 * @returns {Promise<object>} Bus and route details, seat rows and the free/taken counts.
 */
async function getSeatMap(tripId) {
  const matchingTrip = await getTripForBooking(tripId);
  const bookedSeatNumbers = await SeatBooking.distinct('seatNumber', {
    tripId,
    status: SEAT_BOOKING_STATUSES.BOOKED,
  });

  const seats = buildSeatLabels(matchingTrip.busId.capacity).map((seatNumber) => ({
    seatNumber,
    isBooked: bookedSeatNumbers.includes(seatNumber),
  }));

  return {
    tripId: matchingTrip.id,
    bus: {
      id: matchingTrip.busId.id,
      plateNumber: matchingTrip.busId.plateNumber,
      busName: matchingTrip.busId.busName,
      capacity: matchingTrip.busId.capacity,
    },
    route: matchingTrip.routeId,
    departsAt: matchingTrip.startedAt,
    seats,
    seatsPerRow: SEATS_PER_ROW,
    maxSeatsPerTicket: MAX_SEATS_PER_TICKET,
    bookedCount: bookedSeatNumbers.length,
    availableCount: seats.length - bookedSeatNumbers.length,
  };
}

/**
 * Checks a set of seats exists on the bus and is free, raising a clear message when it is not.
 * @param {string} tripId - Trip being booked.
 * @param {string[]} seatNumbers - Seats the passenger tapped.
 * @param {string} [ignoreTicketId] - Ticket whose own seats do not count as taken (used when editing).
 * @returns {Promise<void>} Resolves when every seat can be booked.
 */
async function assertSeatsAreAvailable(tripId, seatNumbers, ignoreTicketId) {
  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    throw new AppError('Choose at least one seat.', HTTP_STATUS.UNPROCESSABLE_ENTITY, [
      { field: 'seatNumbers', message: 'Choose a seat from the seat map.' },
    ]);
  }
  if (seatNumbers.length > MAX_SEATS_PER_TICKET) {
    throw new AppError(
      `One ticket can hold at most ${MAX_SEATS_PER_TICKET} seats.`,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      [{ field: 'seatNumbers', message: `Choose up to ${MAX_SEATS_PER_TICKET} seats.` }]
    );
  }
  if (new Set(seatNumbers).size !== seatNumbers.length) {
    throw new AppError('The same seat was chosen twice.', HTTP_STATUS.UNPROCESSABLE_ENTITY, [
      { field: 'seatNumbers', message: 'Choose different seats.' },
    ]);
  }

  const matchingTrip = await getTripForBooking(tripId);
  const seatLabels = buildSeatLabels(matchingTrip.busId.capacity);
  const unknownSeat = seatNumbers.find((seatNumber) => !seatLabels.includes(seatNumber));
  if (unknownSeat) {
    throw new AppError(
      `Seat ${unknownSeat} does not exist on this bus.`,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      [{ field: 'seatNumbers', message: 'Choose seats from the seat map.' }]
    );
  }

  const takenFilter = {
    tripId,
    seatNumber: { $in: seatNumbers },
    status: SEAT_BOOKING_STATUSES.BOOKED,
  };
  if (ignoreTicketId) takenFilter.ticketId = { $ne: ignoreTicketId };
  const takenSeat = await SeatBooking.findOne(takenFilter);
  if (takenSeat) {
    throw new AppError(
      `Seat ${takenSeat.seatNumber} has just been taken. Please pick another.`,
      HTTP_STATUS.CONFLICT,
      [{ field: 'seatNumbers', message: 'One of those seats is no longer free.' }]
    );
  }
}

/**
 * Holds the seats for a ticket. The partial unique index is the real guard against two passengers
 * booking the same seat at the same moment.
 * @param {object} bookingDetails - Which seats on which trip for which ticket.
 * @param {string} bookingDetails.tripId - Trip being booked.
 * @param {string} bookingDetails.ticketId - Ticket that owns the seats.
 * @param {string[]} bookingDetails.seatNumbers - Seat labels.
 * @returns {Promise<object[]>} The stored bookings.
 */
async function bookSeatsForTicket({ tripId, ticketId, seatNumbers }) {
  await assertSeatsAreAvailable(tripId, seatNumbers, ticketId);
  try {
    return await SeatBooking.insertMany(
      seatNumbers.map((seatNumber) => ({ tripId, ticketId, seatNumber }))
    );
  } catch {
    // The unique index rejected one of them, so another passenger won the race by milliseconds.
    // Any seats that did get in are rolled back, so the ticket never holds a partial set.
    await SeatBooking.deleteMany({ ticketId });
    throw new AppError(
      'One of those seats has just been taken. Please pick again.',
      HTTP_STATUS.CONFLICT,
      [{ field: 'seatNumbers', message: 'One of those seats is no longer free.' }]
    );
  }
}

/**
 * The seats a ticket holds, so the ticket screens can print "Seats 4C, 4D".
 * @param {string} ticketId - Ticket to look up.
 * @returns {Promise<string[]>} Seat labels in map order, empty once released.
 */
async function getSeatsForTicket(ticketId) {
  const bookings = await SeatBooking.find({
    ticketId,
    status: SEAT_BOOKING_STATUSES.BOOKED,
  }).sort({ seatNumber: 1 });
  return bookings.map((booking) => booking.seatNumber);
}

/**
 * Frees the seats a ticket held, which is what makes a cancelled ticket's seats bookable again.
 * @param {string} ticketId - Ticket being cancelled.
 * @returns {Promise<void>} Resolves once the seats are released.
 */
async function releaseSeatsForTicket(ticketId) {
  await SeatBooking.updateMany(
    { ticketId, status: SEAT_BOOKING_STATUSES.BOOKED },
    { status: SEAT_BOOKING_STATUSES.RELEASED }
  );
}

/**
 * Moves a ticket to a different set of seats. The old rows go first so the swap cannot leave the
 * passenger holding both sets.
 * @param {object} changeDetails - Which ticket moves to which seats.
 * @param {string} changeDetails.tripId - Trip being booked.
 * @param {string} changeDetails.ticketId - Ticket that owns the seats.
 * @param {string[]} changeDetails.seatNumbers - New seat labels.
 * @returns {Promise<object[]>} The new bookings.
 */
async function changeSeatsForTicket({ tripId, ticketId, seatNumbers }) {
  await assertSeatsAreAvailable(tripId, seatNumbers, ticketId);
  await SeatBooking.deleteMany({ ticketId });
  return bookSeatsForTicket({ tripId, ticketId, seatNumbers });
}

/**
 * How full a bus is on a trip, used by the driver screens and the admin fleet view.
 * @param {string} tripId - Trip to measure.
 * @returns {Promise<number>} Seats currently booked.
 */
async function countBookedSeats(tripId) {
  return SeatBooking.countDocuments({ tripId, status: SEAT_BOOKING_STATUSES.BOOKED });
}

module.exports = {
  getSeatMap,
  bookSeatsForTicket,
  getSeatsForTicket,
  releaseSeatsForTicket,
  changeSeatsForTicket,
  countBookedSeats,
};
