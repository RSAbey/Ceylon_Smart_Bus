// Seat business logic (Member 03): builds the seat map for a trip and holds or releases one seat per ticket.
const SeatBooking = require('./seatBooking.model');
const Trip = require('../trips/trip.model');
const {
  SEAT_BOOKING_STATUSES,
  SEATS_PER_ROW,
  SEAT_COLUMN_LABELS,
  FIRST_ROW_NUMBER,
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
 * Loads a trip that is still running, because seats can only be chosen on a bus in service.
 * @param {string} tripId - Trip the passenger is booking on.
 * @returns {Promise<object>} The trip with its bus populated.
 */
async function getTripForBooking(tripId) {
  const matchingTrip = await Trip.findById(tripId).populate('busId');
  if (!matchingTrip) {
    throw new AppError('Trip not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (!matchingTrip.busId) {
    throw new AppError('This trip has no bus assigned.', HTTP_STATUS.CONFLICT);
  }
  return matchingTrip;
}

/**
 * The seat map one trip: every seat label with whether it is already taken (FR-06).
 * @param {string} tripId - Trip to show.
 * @returns {Promise<object>} Bus details, seat rows and the booked count.
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
    seats,
    seatsPerRow: SEATS_PER_ROW,
    bookedCount: bookedSeatNumbers.length,
    availableCount: seats.length - bookedSeatNumbers.length,
  };
}

/**
 * Checks a seat exists on the bus and is free, raising a clear message when it is not.
 * @param {string} tripId - Trip being booked.
 * @param {string} seatNumber - Seat the passenger tapped.
 * @returns {Promise<void>} Resolves when the seat can be booked.
 */
async function assertSeatIsAvailable(tripId, seatNumber) {
  const matchingTrip = await getTripForBooking(tripId);
  const seatLabels = buildSeatLabels(matchingTrip.busId.capacity);
  if (!seatLabels.includes(seatNumber)) {
    throw new AppError(`Seat ${seatNumber} does not exist on this bus.`, HTTP_STATUS.UNPROCESSABLE_ENTITY, [
      { field: 'seatNumber', message: 'Choose a seat from the seat map.' },
    ]);
  }
  const takenSeat = await SeatBooking.findOne({
    tripId,
    seatNumber,
    status: SEAT_BOOKING_STATUSES.BOOKED,
  });
  if (takenSeat) {
    throw new AppError(`Seat ${seatNumber} has just been taken. Please pick another.`, HTTP_STATUS.CONFLICT, [
      { field: 'seatNumber', message: 'This seat is no longer free.' },
    ]);
  }
}

/**
 * Holds one seat for a ticket. The partial unique index is the real guard against two
 * passengers booking the same seat at the same moment.
 * @param {object} bookingDetails - Which seat on which trip for which ticket.
 * @param {string} bookingDetails.tripId - Trip being booked.
 * @param {string} bookingDetails.ticketId - Ticket that owns the seat.
 * @param {string} bookingDetails.seatNumber - Seat label.
 * @returns {Promise<object>} The stored booking.
 */
async function bookSeatForTicket({ tripId, ticketId, seatNumber }) {
  await assertSeatIsAvailable(tripId, seatNumber);
  try {
    return await SeatBooking.create({ tripId, ticketId, seatNumber });
  } catch {
    // The unique index rejected it, which means another passenger won the race by milliseconds.
    throw new AppError(`Seat ${seatNumber} has just been taken. Please pick another.`, HTTP_STATUS.CONFLICT, [
      { field: 'seatNumber', message: 'This seat is no longer free.' },
    ]);
  }
}

/**
 * The seat a ticket holds, so the ticket screens can print "Seat 12A".
 * @param {string} ticketId - Ticket to look up.
 * @returns {Promise<object | null>} The booking, or null when the seat was released.
 */
async function getSeatForTicket(ticketId) {
  return SeatBooking.findOne({ ticketId, status: SEAT_BOOKING_STATUSES.BOOKED });
}

/**
 * Frees the seat a ticket held, which is what makes a cancelled ticket's seat bookable again.
 * @param {string} ticketId - Ticket being cancelled or changed.
 * @returns {Promise<void>} Resolves once the seat is released.
 */
async function releaseSeatForTicket(ticketId) {
  await SeatBooking.updateMany(
    { ticketId, status: SEAT_BOOKING_STATUSES.BOOKED },
    { status: SEAT_BOOKING_STATUSES.RELEASED }
  );
}

/**
 * Moves a ticket to a different seat: the old seat is released first so the swap cannot
 * leave the passenger holding two seats.
 * @param {object} changeDetails - Which ticket moves to which seat.
 * @param {string} changeDetails.tripId - Trip being booked.
 * @param {string} changeDetails.ticketId - Ticket that owns the seat.
 * @param {string} changeDetails.seatNumber - New seat label.
 * @returns {Promise<object>} The new booking.
 */
async function changeSeatForTicket({ tripId, ticketId, seatNumber }) {
  const currentBooking = await getSeatForTicket(ticketId);
  if (currentBooking?.seatNumber === seatNumber) return currentBooking;

  await assertSeatIsAvailable(tripId, seatNumber);
  await SeatBooking.deleteMany({ ticketId });
  return bookSeatForTicket({ tripId, ticketId, seatNumber });
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
  bookSeatForTicket,
  getSeatForTicket,
  releaseSeatForTicket,
  changeSeatForTicket,
  countBookedSeats,
};
