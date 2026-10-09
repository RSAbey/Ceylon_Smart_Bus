// Turning the seat map's flat seat list into rows (Member 03, FR-06). The API sends the seats in map
// order with seatsPerRow beside them, so both the passenger's Select Seats screen and the driver's
// read-only map group them the same way here instead of each keeping its own copy.

/**
 * Splits the flat seat list into rows of seatsPerRow so the map can be drawn.
 * The last row is short when the capacity does not divide evenly, exactly as the server labels it.
 * @param {object[]} seats - Seats in map order.
 * @param {number} seatsPerRow - How many seats sit across the bus.
 * @returns {Array<object[]>} Seats grouped into rows.
 */
export function groupSeatsIntoRows(seats, seatsPerRow) {
  const seatRows = [];
  for (let rowStart = 0; rowStart < seats.length; rowStart += seatsPerRow) {
    seatRows.push(seats.slice(rowStart, rowStart + seatsPerRow));
  }
  return seatRows;
}
