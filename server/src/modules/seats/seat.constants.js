// Enum values and seat-map layout rules for SEAT_BOOKING (Member 03).

const SEAT_BOOKING_STATUSES = Object.freeze({
  BOOKED: 'booked',
  RELEASED: 'released',
});

/** Sri Lankan buses seat 2 + 2 across an aisle, so the map is drawn four seats to a row. */
const SEATS_PER_ROW = 4;
const SEAT_COLUMN_LABELS = Object.freeze(['A', 'B', 'C', 'D']);
const FIRST_ROW_NUMBER = 1;

module.exports = {
  SEAT_BOOKING_STATUSES,
  SEATS_PER_ROW,
  SEAT_COLUMN_LABELS,
  FIRST_ROW_NUMBER,
};
