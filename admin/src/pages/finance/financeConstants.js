// Reference data for the admin Tickets & Finance page.
// Must match server/src/modules/payments/payment.constants.js and route.constants.js.

export const CURRENCY_PREFIX = 'Rs.';

export const PAYMENT_STATUSES = Object.freeze({
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
});

export const PAYMENT_METHOD_LABELS = Object.freeze({
  card: 'Card',
  wallet: 'Mobile wallet',
  cash: 'Cash to the conductor',
});

export const PAYMENT_STATUS_BADGES = Object.freeze({
  [PAYMENT_STATUSES.PAID]: { status: 'valid', label: 'Paid' },
  [PAYMENT_STATUSES.REFUNDED]: { status: 'cancelled', label: 'Refunded' },
  [PAYMENT_STATUSES.FAILED]: { status: 'invalid', label: 'Failed' },
});

/** Periods the totals can cover. An empty `days` means every payment ever recorded. */
export const FINANCE_PERIOD_FILTERS = Object.freeze([
  { label: 'Today', days: '1' },
  { label: 'Last 7 days', days: '7' },
  { label: 'Last 30 days', days: '30' },
  { label: 'All time', days: '' },
]);

export const TRANSACTION_STATUS_FILTERS = Object.freeze([
  { label: 'All transactions', status: '' },
  { label: 'Paid', status: PAYMENT_STATUSES.PAID },
  { label: 'Refunded', status: PAYMENT_STATUSES.REFUNDED },
  { label: 'Failed', status: PAYMENT_STATUSES.FAILED },
]);

/** Bounds on a fare revision, matching the server's validation. */
export const MIN_FARE_ADJUST_PERCENT = -50;
export const MAX_FARE_ADJUST_PERCENT = 100;

export const FINANCE_MESSAGES = Object.freeze({
  title: 'Tickets & Finance',
  subtitle: 'What the service took, how it was paid, and what each route is priced at',
  trendTitle: 'Takings per day, last 7 days',
  faresHeading: 'Fares by route',
  faresCaption:
    'What each route charges and what it took in the chosen period. Editing fares here changes what passengers are charged from now on; tickets already sold keep the fare they were bought at.',
  transactionsHeading: 'Transactions',
  transactionsCaption: 'The 20 most recent payments in the chosen period',
  refundTitle: 'Refund this fare?',
  refundLabel: 'Refund',
  adjustTitle: 'Adjust fares',
  adjustLabel: 'Adjust fares',
});

/**
 * Writes an amount the way the dashboard shows money everywhere else.
 * @param {number} amount - Amount in rupees.
 * @returns {string} For example "Rs. 1,250".
 */
export function formatCurrency(amount) {
  return `${CURRENCY_PREFIX} ${Math.round(amount || 0).toLocaleString()}`;
}

/**
 * The badge for one transaction, named in words as well as coloured (NFR-09).
 * @param {string} paymentStatus - A PAYMENT_STATUSES value.
 * @returns {{status: string, label: string}} Props for StatusBadge.
 */
export function describePaymentStatus(paymentStatus) {
  return PAYMENT_STATUS_BADGES[paymentStatus] || PAYMENT_STATUS_BADGES[PAYMENT_STATUSES.FAILED];
}
