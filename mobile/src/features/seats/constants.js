// Constants for the seat-selection feature (Member 03).

/** The three states a seat square can be in. The legend names all three, so colour is not the only cue. */
export const SEAT_STATES = Object.freeze({
  AVAILABLE: 'available',
  SELECTED: 'selected',
  BOOKED: 'booked',
});

export const SEAT_LEGEND = Object.freeze([
  { state: SEAT_STATES.AVAILABLE, label: 'Available' },
  { state: SEAT_STATES.SELECTED, label: 'Your seat' },
  { state: SEAT_STATES.BOOKED, label: 'Taken' },
]);

/** Side of one seat square, in points. Kept above the 44 px minimum touch target. */
export const SEAT_SQUARE_SIZE = 48;

export const SEAT_MESSAGES = Object.freeze({
  chooseSeat: 'Tap a free seat to choose it.',
  seatTaken: 'That seat is already taken. Pick another.',
  noSeatChosen: 'Choose a seat before you continue.',
  fullBus: 'Every seat on this bus is taken.',
});
