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

/** Must match server/src/modules/payments/payment.constants.js. */
export const CARD_NUMBER_DIGITS = 16;
export const CARD_CVV_DIGITS = 3;
export const CARD_NUMBER_GROUP_SIZE = 4;
export const MIN_TOPUP_AMOUNT = 100;
export const MAX_TOPUP_AMOUNT = 10000;
export const TOPUP_PRESET_AMOUNTS = Object.freeze([500, 1000, 2000, 5000]);

/** Wallet statement line types, and how each is shown. */
export const WALLET_TRANSACTION_TYPES = Object.freeze({
  TOPUP: 'topup',
  FARE: 'fare',
  REFUND: 'refund',
});

export const WALLET_LINE_STYLES = Object.freeze({
  [WALLET_TRANSACTION_TYPES.TOPUP]: { iconName: 'add-circle-outline', sign: '+' },
  [WALLET_TRANSACTION_TYPES.FARE]: { iconName: 'bus-outline', sign: '-' },
  [WALLET_TRANSACTION_TYPES.REFUND]: { iconName: 'return-down-back-outline', sign: '+' },
});

export const WALLET_MESSAGES = Object.freeze({
  title: 'Mobile Wallet',
  balanceLabel: 'Available balance',
  topUpTitle: 'Top up your wallet',
  chooseAmount: 'Choose an amount',
  emptyStatement: 'No wallet activity yet. Top up to pay fares in one tap.',
  notEnough: 'Not enough balance for this fare. Top up to use the wallet.',
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
