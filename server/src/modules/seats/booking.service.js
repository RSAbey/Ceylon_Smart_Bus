// Trip bookings seen from the driver's seat (Member 03): who has reserved a seat on the run the
// driver is on, and whether the trip is still taking reservations.
const SeatBooking = require('./seatBooking.model');
const Ticket = require('../tickets/ticket.model');
const RouteStop = require('../routes/routeStop.model');
const User = require('../users/user.model');
const tripService = require('../trips/trip.service');
const { SEAT_BOOKING_STATUSES } = require('./seat.constants');
const { TICKET_STATUSES } = require('../tickets/ticket.constants');
const AppError = require('../../utils/AppError');
const HTTP_STATUS = require('../../utils/httpStatus');

/**
 * Turns a ticket status into the word the driver's Bookings list shows.
 * An unpaid but active ticket is "pending", because the seat is held but the fare is not in.
 * @param {object} ticket - The ticket behind the seat.
 * @param {boolean} isPaid - Whether a paid payment exists.
 * @returns {string} confirmed | pending | cancelled.
 */
function describeBookingStatus(ticket, isPaid) {
  if (ticket.status === TICKET_STATUSES.CANCELLED) return 'cancelled';
  if (ticket.status === TICKET_STATUSES.ACTIVE && !isPaid) return 'pending';
  return 'confirmed';
}

/**
 * Loads the trip the driver is running, refusing when they are not on one.
 * @param {string} userId - Signed-in driver's user id.
 * @returns {Promise<object>} The ongoing trip with bus and route.
 */
async function getRunningTripForDriver(userId) {
  const driverProfile = await tripService.getDriverProfileForUser(userId);
  const runningTrip = await tripService.getOngoingTripForDriver(driverProfile.id);
  if (!runningTrip) {
    throw new AppError(
      'Start your trip to see and manage its bookings.',
      HTTP_STATUS.CONFLICT
    );
  }
  return runningTrip.populate(['busId', 'routeId']);
}

/**
 * Everything the driver's Bookings screen shows: the seat count, whether new reservations are
 * accepted, and a row per booked passenger.
 * @param {string} userId - Signed-in driver's user id.
 * @returns {Promise<object>} Booking overview.
 */
async function getTripBookings(userId) {
  const runningTrip = await getRunningTripForDriver(userId);

  const bookings = await SeatBooking.find({
    tripId: runningTrip.id,
    status: SEAT_BOOKING_STATUSES.BOOKED,
  }).sort({ bookedAt: -1 });

  // One ticket can hold several seats, so the rows are built per ticket, not per seat.
  const bookedTicketIds = [...new Set(bookings.map((booking) => String(booking.ticketId)))];
  const bookedTickets = await Ticket.find({ _id: { $in: bookedTicketIds } });

  const passengerIds = bookedTickets.map((bookedTicket) => bookedTicket.userId);
  const passengers = await User.find({ _id: { $in: passengerIds } }).select('fullName');

  const bookingRows = await Promise.all(
    bookedTickets.map(async (bookedTicket) => {
      const seatNumbers = bookings
        .filter((booking) => String(booking.ticketId) === bookedTicket.id)
        .map((booking) => booking.seatNumber)
        .sort();
      const boardingStop = await RouteStop.findById(bookedTicket.boardingStopId).select('stopName');
      const passenger = passengers.find(
        (candidate) => candidate.id === String(bookedTicket.userId)
      );
      return {
        ticketId: bookedTicket.id,
        ticketKey: bookedTicket.ticketKey,
        passengerName: passenger?.fullName || 'Passenger',
        seatNumbers,
        boardingStopName: boardingStop?.stopName || null,
        fareAmount: bookedTicket.fareAmount,
        bookingStatus: describeBookingStatus(bookedTicket, bookedTicket.status === TICKET_STATUSES.USED),
      };
    })
  );

  const capacity = runningTrip.busId?.capacity || 0;
  return {
    tripId: runningTrip.id,
    route: runningTrip.routeId,
    bus: runningTrip.busId,
    isAcceptingBookings: runningTrip.isAcceptingBookings,
    totalSeats: capacity,
    bookedSeats: bookings.length,
    availableSeats: Math.max(0, capacity - bookings.length),
    bookings: bookingRows,
  };
}

/**
 * Opens or closes the running trip to new reservations. Closing does not touch seats already
 * booked, so nobody loses a seat they paid for.
 * @param {string} userId - Signed-in driver's user id.
 * @param {boolean} isAcceptingBookings - Whether to keep taking reservations.
 * @returns {Promise<object>} The updated booking overview.
 */
async function setAcceptingBookings(userId, isAcceptingBookings) {
  const runningTrip = await getRunningTripForDriver(userId);
  runningTrip.isAcceptingBookings = isAcceptingBookings;
  await runningTrip.save();
  return getTripBookings(userId);
}

module.exports = { getTripBookings, setAcceptingBookings };
