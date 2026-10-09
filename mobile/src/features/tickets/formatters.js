// Date and money wording shared by the ticket, seat and payment screens (Member 03).
import { CURRENCY_PREFIX } from './constants';

/**
 * Formats a departure as "19 Sep, 7:40 AM", the wording used on the seat and ticket screens.
 * @param {string | Date} [departureTime] - When the bus leaves.
 * @returns {string} Readable departure, or a dash when it is unknown.
 */
export function formatDepartureTime(departureTime) {
  if (!departureTime) return '\u2014';
  const departureDate = new Date(departureTime);
  const datePart = departureDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const timePart = departureDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart}`;
}

/**
 * Formats the "Valid until 19 Sep 2026, 11:59 PM" line on a ticket.
 * @param {string | Date} [validUntil] - When the ticket stops being usable.
 * @returns {string} Readable expiry, or a dash when it is unknown.
 */
export function formatValidUntil(validUntil) {
  if (!validUntil) return '\u2014';
  const expiryDate = new Date(validUntil);
  const datePart = expiryDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timePart = expiryDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${datePart}, ${timePart}`;
}

/**
 * Formats a clock time such as "7:31 AM", used for the last-synced line.
 * @param {string | Date} [syncedAt] - When the ticket was last fetched.
 * @returns {string} Readable time.
 */
export function formatSyncTime(syncedAt) {
  if (!syncedAt) return '\u2014';
  return new Date(syncedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * Formats a fare as "Rs. 160".
 * @param {number} [amount] - Rupee amount.
 * @returns {string} Readable fare.
 */
export function formatFare(amount) {
  return `${CURRENCY_PREFIX} ${amount ?? 0}`;
}
