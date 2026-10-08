// Enum values and limits for PAYMENT, WALLET and WALLET_TRANSACTION (Member 03).
// Payments are mocked: no real gateway is called and no card number is ever stored.

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

const WALLET_TRANSACTION_TYPES = Object.freeze({
  TOPUP: 'topup',
  FARE: 'fare',
  REFUND: 'refund',
});

/** Top-up limits, so a demo cannot create an absurd balance. */
const MIN_TOPUP_AMOUNT = 100;
const MAX_TOPUP_AMOUNT = 10000;

/** The fixed amounts offered as one-tap buttons on the top-up screen. */
const TOPUP_PRESET_AMOUNTS = Object.freeze([500, 1000, 2000, 5000]);

/** A demo card number must look like a card (digits only) before the mock payment is accepted. */
const CARD_NUMBER_DIGITS = 16;
const CARD_CVV_DIGITS = 3;

/** Periods the admin finance page totals over. Leaving the period out totals everything ever taken. */
const FINANCE_PERIOD_DAYS = Object.freeze([1, 7, 30]);

const DEFAULT_FINANCE_PERIOD_DAYS = 7;

/** How many days the takings trend on the finance page covers, whatever period the totals use. */
const FINANCE_TREND_DAYS = 7;

/** How many transactions the admin finance page lists under the totals. */
const RECENT_TRANSACTION_LIMIT = 20;

module.exports = {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  FINANCE_PERIOD_DAYS,
  DEFAULT_FINANCE_PERIOD_DAYS,
  FINANCE_TREND_DAYS,
  RECENT_TRANSACTION_LIMIT,
  WALLET_TRANSACTION_TYPES,
  MIN_TOPUP_AMOUNT,
  MAX_TOPUP_AMOUNT,
  TOPUP_PRESET_AMOUNTS,
  CARD_NUMBER_DIGITS,
  CARD_CVV_DIGITS,
};
