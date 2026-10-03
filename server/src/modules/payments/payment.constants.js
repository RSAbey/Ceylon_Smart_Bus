// Enum values for PAYMENT (Member 03). Payments are mocked: no real gateway is called.

const PAYMENT_METHODS = Object.freeze({
  CARD: 'card',
  CASH: 'cash',
  WALLET: 'wallet',
});

const PAYMENT_STATUSES = Object.freeze({
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
});

module.exports = { PAYMENT_METHODS, PAYMENT_STATUSES };
