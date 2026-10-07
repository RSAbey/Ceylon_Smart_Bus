// Constants for the payments feature (Member 03).

/** Must match server/src/modules/payments/payment.constants.js. */
export const PAYMENT_METHODS = Object.freeze({
  CARD: 'card',
  CASH: 'cash',
  WALLET: 'wallet',
});

export const PAYMENT_STATUSES = Object.freeze({
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
});

/** Ionicons name for each method, shown next to its label so the row is not text alone. */
export const PAYMENT_METHOD_ICONS = Object.freeze({
  [PAYMENT_METHODS.CARD]: 'card-outline',
  [PAYMENT_METHODS.WALLET]: 'phone-portrait-outline',
  [PAYMENT_METHODS.CASH]: 'cash-outline',
});

/** StatusBadge status + wording for each payment state. */
export const PAYMENT_BADGES = Object.freeze({
  [PAYMENT_STATUSES.PAID]: { status: 'valid', label: 'Paid' },
  [PAYMENT_STATUSES.REFUNDED]: { status: 'cancelled', label: 'Refunded' },
  [PAYMENT_STATUSES.FAILED]: { status: 'invalid', label: 'Failed' },
});

export const PAYMENT_MESSAGES = Object.freeze({
  chooseMethod: 'Choose how you want to pay.',
  mockNotice: 'This is a university prototype, so no real money moves and no card details are stored.',
  paid: 'Payment successful. Your ticket is ready.',
});

/** Empty-state copy for the payment-history list. */
export const PAYMENTS_EMPTY = Object.freeze({
  title: 'No payments yet',
  message: 'Fares you pay for your tickets will be listed here.',
});
