// Reference data for the admin Passengers page.
// Must match server/src/modules/users/user.constants.js.

export const USER_STATUSES = Object.freeze({
  ACTIVE: 'active',
  BLOCKED: 'blocked',
});

export const PASSENGER_STATUS_BADGES = Object.freeze({
  [USER_STATUSES.ACTIVE]: { status: 'active', label: 'Active' },
  [USER_STATUSES.BLOCKED]: { status: 'invalid', label: 'Blocked' },
});

export const PASSENGER_STATUS_FILTERS = Object.freeze([
  { label: 'All passengers', status: '' },
  { label: 'Active', status: USER_STATUSES.ACTIVE },
  { label: 'Blocked', status: USER_STATUSES.BLOCKED },
]);

export const PASSENGER_MESSAGES = Object.freeze({
  title: 'Passengers',
  subtitle: 'Who holds an account, what they have travelled on, and what they are waiting to hear',
  emptyTitle: 'No passengers match',
  emptyMessage: 'Clear the search, or the status filter, to see everyone.',
  blockLabel: 'Block account',
  unblockLabel: 'Unblock account',
  blockTitle: 'Block this account?',
  unblockTitle: 'Unblock this account?',
  recentTicketsHeading: 'Latest tickets',
  openInquiriesHeading: 'Waiting for an answer',
  noTickets: 'This passenger has not bought a ticket yet.',
  noInquiries: 'Nothing open.',
  noWallet: 'No wallet opened',
});

/**
 * Writes an amount the way the dashboard shows money everywhere else.
 * @param {number | null} amount - Amount in rupees, or null when there is no wallet.
 * @returns {string} For example "Rs. 1,250".
 */
export function formatRupees(amount) {
  return `Rs. ${Math.round(amount || 0).toLocaleString()}`;
}

/**
 * Writes a stored date as a short date, or says there is none.
 * @param {string | null} storedDate - ISO date from the API.
 * @returns {string} Date for the table.
 */
export function formatDate(storedDate) {
  return storedDate ? new Date(storedDate).toLocaleDateString() : 'Never';
}
