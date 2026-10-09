// Constants for the seat-selection feature (Member 03).

/** The three states a seat square can be in. The legend names all three, so colour is not the only cue. */
export const SEAT_STATES = Object.freeze({
  AVAILABLE: 'available',
  SELECTED: 'selected',
  BOOKED: 'booked',
});

/** Legend across the top of the map: an icon as well as a colour for every state (NFR-09). */
export const SEAT_LEGEND = Object.freeze([
  { state: SEAT_STATES.AVAILABLE, label: 'Available', iconName: 'square-outline' },
  { state: SEAT_STATES.SELECTED, label: 'Selected', iconName: 'checkbox' },
  { state: SEAT_STATES.BOOKED, label: 'Occupied', iconName: 'close' },
]);

/** Side of one seat square, in points. Kept above the 44 px minimum touch target. */
export const SEAT_SQUARE_SIZE = 52;

/** Width of the aisle between the B and C columns, in points. */
export const AISLE_WIDTH = 36;

export const SEAT_MESSAGES = Object.freeze({
  chooseSeat: 'Tap a free seat to choose it.',
  noSeatChosen: 'Choose a seat before you continue.',
  fullBus: 'Every seat on this bus is taken.',
  noSeatsRecorded: 'This bus has no seats recorded.',
  frontOfBus: 'Front of bus',
  driver: 'Driver',
});

/**
 * Builds the "2 seats selected" line under the map.
 * @param {string[]} seatNumbers - Seats the passenger has chosen.
 * @returns {string} Sentence for the summary bar.
 */
export function describeSeatCount(seatNumbers) {
  if (seatNumbers.length === 0) return 'No seats selected';
  return `${seatNumbers.length} ${seatNumbers.length === 1 ? 'seat' : 'seats'} selected`;
}

/** StatusBadge status + wording for each booking state on the driver's Bookings screen. */
export const BOOKING_BADGES = Object.freeze({
  confirmed: { status: 'valid', label: 'Confirmed' },
  pending: { status: 'delayed', label: 'Pending' },
  cancelled: { status: 'cancelled', label: 'Cancelled' },
});

export const BOOKING_MESSAGES = Object.freeze({
  title: 'Bookings',
  acceptTitle: 'Accept New Bookings',
  acceptHint: 'Passengers can reserve a seat on this trip',
  availabilityHeading: 'Seat availability',
  todaysHeading: "Today's bookings",
  closedNote: 'When bookings are disabled, passengers see this trip as "walk-on only" in the app.',
  noBookings: 'No seats reserved on this trip yet.',
  noTrip: 'Start your trip to see and manage its bookings.',
});
