// Keeps a copy of each ticket on the phone so the QR code still opens with no signal (NFR-04).
// A bus can be well out of coverage, which is exactly when the conductor asks to see the ticket.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OFFLINE_TICKET_KEY_PREFIX } from '../constants';

/**
 * Stores a ticket for offline use, with the time it was saved.
 * @param {string} ticketId - Ticket being cached.
 * @param {object} ticketView - The ticket view straight from the API.
 * @returns {Promise<void>} Resolves once stored; storage failures are ignored on purpose.
 */
export async function cacheTicket(ticketId, ticketView) {
  try {
    const cachedEntry = JSON.stringify({ ticketView, syncedAt: new Date().toISOString() });
    await AsyncStorage.setItem(`${OFFLINE_TICKET_KEY_PREFIX}${ticketId}`, cachedEntry);
  } catch {
    // A full or unavailable store must never stop the ticket rendering from the network copy.
  }
}

/**
 * Reads the stored copy of a ticket.
 * @param {string} ticketId - Ticket to read.
 * @returns {Promise<{ticketView: object, syncedAt: string} | null>} The copy, or null when there is none.
 */
export async function readCachedTicket(ticketId) {
  try {
    const cachedEntry = await AsyncStorage.getItem(`${OFFLINE_TICKET_KEY_PREFIX}${ticketId}`);
    return cachedEntry ? JSON.parse(cachedEntry) : null;
  } catch {
    return null;
  }
}

/**
 * Removes a stored ticket, used once it is cancelled so a dead QR cannot be shown.
 * @param {string} ticketId - Ticket to forget.
 * @returns {Promise<void>} Resolves once removed.
 */
export async function forgetCachedTicket(ticketId) {
  try {
    await AsyncStorage.removeItem(`${OFFLINE_TICKET_KEY_PREFIX}${ticketId}`);
  } catch {
    // Nothing to do: the copy is only an optimisation.
  }
}
